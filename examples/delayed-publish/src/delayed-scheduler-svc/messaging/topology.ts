import { BrokerConfig } from "rascal";
import { config } from "../../shared/config";

/**
 * Delayed Scheduler topology configuration.
 * This service only publishes delayed messages, so it doesn't need queues or subscriptions.
 */
export const delayedSchedulerTopology: BrokerConfig = {
    vhosts: {
        "/": {
            connection: {
                url: `amqp://${config.rabbitmq.user}:${config.rabbitmq.pass}@${config.rabbitmq.host}:${config.rabbitmq.port}/${config.rabbitmq.vhost}`,
            },
            exchanges: {
                [config.delayed.exchange]: {
                    type: "direct",
                    options: {
                        durable: false,
                        autoDelete: false,
                    },
                },
                [config.processor.exchangeName]: {
                    type: "direct",
                    options: {
                        durable: false,
                        autoDelete: false,
                    },
                },
            },
            publications: {
                [`${config.processor.exchangeName}-publication`]: {
                    exchange: config.processor.exchangeName,
                    routingKey: "delayed.message",
                    options: {
                        persistent: false,
                    },
                },
            },
        },
    },
};
