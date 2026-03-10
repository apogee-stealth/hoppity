import { BrokerConfig } from "rascal";
import { config } from "../../config";

/**
 * Subscriber topology — the Rascal BrokerConfig for the consuming side.
 *
 * Declares the full subscriber-side topology:
 * - The "events" topic exchange (same as publisher — RabbitMQ is idempotent)
 * - A durable "event_queue" that survives broker restarts
 * - A binding from the exchange to the queue using "event.#" (topic wildcard)
 * - An "on_event" subscription that Rascal uses to consume from the queue
 *
 * The subscription name "on_event" is important — it's the key used in
 * `withSubscriptions({ on_event: handler })` to wire up the message handler.
 */
export const subscriberTopology: BrokerConfig = {
    vhosts: {
        [config.rabbitmq.vhost]: {
            connection: {
                url: config.rabbitmq.url,
                options: {
                    heartbeat: 10,
                },
                retry: {
                    factor: 2,
                    min: 1000,
                    max: 5000,
                },
            },
            exchanges: {
                // Re-declared here so the subscriber can start before the publisher.
                // RabbitMQ exchange declarations are idempotent — if it already
                // exists with the same config, nothing happens.
                events: {
                    type: "topic",
                    options: {
                        durable: true,
                    },
                },
            },
            queues: {
                // Durable queue: messages survive broker restarts (assuming
                // they were published with deliveryMode 2 / persistent).
                event_queue: {
                    options: {
                        durable: true,
                    },
                },
            },
            bindings: {
                // Binding: routes messages from the "events" exchange to "event_queue"
                // when the routing key matches "event.#" (topic wildcard).
                // "event.#" matches "event.created", "event.updated", "event.anything.nested", etc.
                event_binding: {
                    source: "events",
                    destination: "event_queue",
                    destinationType: "queue",
                    bindingKey: "event.#",
                },
            },
            subscriptions: {
                // Subscription name: this is the key you pass to withSubscriptions()
                // to map a handler function. It must match exactly.
                on_event: {
                    queue: "event_queue",
                },
            },
        },
    },
};
