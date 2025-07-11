import { BrokerConfig } from "rascal";
import { config } from "../../shared/config";

/**
 * Delayed Scheduler topology configuration
 * Contains the minimal topology configuration for the delayed scheduler service
 * This service only publishes delayed messages, so it doesn't need queues or subscriptions
 */
export const delayedSchedulerTopology: BrokerConfig = {
    vhosts: {
        "/": {
            connection: {
                url: `amqp://${config.rabbitmq.user}:${config.rabbitmq.pass}@${config.rabbitmq.host}:${config.rabbitmq.port}/${config.rabbitmq.vhost}`,
            },
            exchanges: {
                // Main exchange for delayed messages (used by the delayed publish plugin)
                [config.delayed.exchange]: {
                    type: "direct",
                    options: {
                        durable: false,
                        autoDelete: false,
                    },
                },
                // Service B exchange for publishing delayed messages to processor
                [config.service.b.exchangeName]: {
                    type: "direct",
                    options: {
                        durable: false,
                        autoDelete: false,
                    },
                },
            },
            publications: {
                // Publication for sending messages to Service B
                [`${config.service.b.exchangeName}-publication`]: {
                    exchange: config.service.b.exchangeName,
                    routingKey: "delayed.message",
                    options: {
                        persistent: false,
                    },
                },
            },
        },
    },
};
