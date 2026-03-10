import { BrokerConfig } from "rascal";
import { config } from "../../config";

/**
 * Publisher topology — the Rascal BrokerConfig for the publishing side.
 *
 * Declares only what the publisher needs:
 * - The "events" topic exchange (must match the subscriber's exchange)
 * - A "send_event" publication that targets the exchange with routing key "event.created"
 *
 * The publisher does NOT declare queues or bindings — that's the subscriber's
 * responsibility. In RabbitMQ, the publisher only needs to know about exchanges.
 */
export const publisherTopology: BrokerConfig = {
    vhosts: {
        [config.rabbitmq.vhost]: {
            connection: {
                url: config.rabbitmq.url,
                options: {
                    // Heartbeat keeps the AMQP connection alive through idle periods
                    heartbeat: 10,
                },
                // Exponential backoff retry for connection failures
                retry: {
                    factor: 2,
                    min: 1000,
                    max: 5000,
                },
            },
            exchanges: {
                // Topic exchange: routes messages based on routing key patterns.
                // "durable: true" means the exchange survives broker restarts.
                events: {
                    type: "topic",
                    options: {
                        durable: true,
                    },
                },
            },
            publications: {
                // Publication name used with broker.publish("send_event", payload).
                // Rascal maps this to the exchange + routing key at publish time.
                send_event: {
                    exchange: "events",
                    routingKey: "event.created",
                },
            },
        },
    },
};
