import { BrokerAsPromised } from "rascal";

// Minimal shape of the AMQP message fields we actually use.
// Rascal re-uses the amqplib Message type internally but does not export it,
// so we define just the slice we need rather than pulling in amqplib directly.
interface AmqpMessageFields {
    routingKey: string;
}

interface AmqpMessage {
    fields?: AmqpMessageFields;
}

/**
 * A deferred promise — something the scripted flow can await until a particular
 * event arrives on the outbound tap.
 */
interface PendingEvent {
    routingKey: string;
    resolve: (content: unknown) => void;
    reject: (err: Error) => void;
}

const pendingEvents: PendingEvent[] = [];

/**
 * Returns a Promise that resolves with the content of the next tap message
 * matching the given routing key.
 *
 * The scripted flow calls this before triggering an action so it doesn't miss
 * events that fire quickly. Only one waiter per routing key is supported at a
 * time — the demo is sequential.
 */
export function awaitTapEvent(routingKey: string, timeoutMs = 10000): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
            const idx = pendingEvents.findIndex(p => p.routingKey === routingKey);
            if (idx !== -1) {
                pendingEvents.splice(idx, 1);
                reject(
                    new Error(
                        `Timed out waiting for tap event with routing key '${routingKey}' after ${timeoutMs}ms`
                    )
                );
            }
        }, timeoutMs);

        pendingEvents.push({
            routingKey,
            resolve: value => {
                clearTimeout(timeoutHandle);
                resolve(value);
            },
            reject: err => {
                clearTimeout(timeoutHandle);
                reject(err);
            },
        });
    });
}

/**
 * Rascal subscription handler for the outbound tap queue.
 *
 * Messages arriving here were published by order-service and fanned out through
 * its outbound exchange. We inspect the routing key to identify the event type
 * and resolve any pending waiters.
 */
// Fourth param _broker matches the SubscriptionHandler signature from hoppity-subscriptions
export function tapHandler(
    message: AmqpMessage,
    content: unknown,
    ackOrNack: () => void,
    _broker: BrokerAsPromised
): void {
    // Routing key format from hoppity-contracts: {domain}.{opType}.{snake_name}
    // e.g. "orders.event.order_created"
    const routingKey = message.fields?.routingKey ?? "";

    const idx = pendingEvents.findIndex(p => p.routingKey === routingKey);
    if (idx !== -1) {
        const pending = pendingEvents.splice(idx, 1)[0];
        pending.resolve(content);
    }

    ackOrNack();
}
