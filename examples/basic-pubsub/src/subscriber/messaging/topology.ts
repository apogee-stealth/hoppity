import { BrokerConfig } from "rascal";
import { config } from "../../config";

/**
 * Subscriber topology.
 * Declares the exchange, a queue, a binding, and a subscription.
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
                events: {
                    type: "topic",
                    options: {
                        durable: true,
                    },
                },
            },
            queues: {
                event_queue: {
                    options: {
                        durable: true,
                    },
                },
            },
            bindings: {
                event_binding: {
                    source: "events",
                    destination: "event_queue",
                    destinationType: "queue",
                    bindingKey: "event.#",
                },
            },
            subscriptions: {
                on_event: {
                    queue: "event_queue",
                },
            },
        },
    },
};
