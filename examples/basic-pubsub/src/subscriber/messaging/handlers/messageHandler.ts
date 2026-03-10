/* eslint-disable @typescript-eslint/no-explicit-any */
import { SubscriptionHandler } from "@apogeelabs/hoppity-subscriptions";

/**
 * Handler for incoming event messages.
 *
 * Implements the {@link SubscriptionHandler} signature:
 * `(message, content, ackOrNack, broker) => Promise<void> | void`
 *
 * - `message` — the raw AMQP message (headers, properties, etc.)
 * - `content` — the parsed message body (Rascal handles JSON deserialization)
 * - `ackOrNack` — call with no args to acknowledge, or with an Error to reject
 * - `broker` — the Rascal broker instance (unused here, but useful for
 *   republishing or chaining messages in more complex scenarios)
 *
 * In a real application, you'd do your business logic between receiving
 * the content and calling ackOrNack(). If processing fails, call
 * `ackOrNack(error)` to reject the message so RabbitMQ can requeue or
 * dead-letter it depending on your queue configuration.
 */
export const messageHandler: SubscriptionHandler = async (
    _message: any,
    content: any,
    ackOrNack: any
): Promise<void> => {
    console.log("📨 [Subscriber] Received message:", {
        id: content.id,
        text: content.text,
        timestamp: content.timestamp,
        receivedAt: new Date().toISOString(),
    });

    // Acknowledge the message — removes it from the queue.
    // In production you'd ack after successful processing, not before.
    ackOrNack();
};
