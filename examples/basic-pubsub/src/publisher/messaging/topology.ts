import { BrokerConfig } from "rascal";
import { config } from "../../config";

/**
 * Publisher topology.
 * Declares the exchange and a publication for sending messages.
 */
export const publisherTopology: BrokerConfig = {
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
            publications: {
                send_event: {
                    exchange: "events",
                    routingKey: "event.created",
                },
            },
        },
    },
};
