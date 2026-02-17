import { BrokerConfig } from "rascal";
import { config } from "../../shared/config";

/**
 * Delayed Processor topology configuration.
 * Includes the queue, binding, and subscription for consuming delayed messages.
 */
export const delayedProcessorTopology: BrokerConfig = {
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
            queues: {
                [config.processor.queueName]: {
                    options: {
                        durable: false,
                        autoDelete: false,
                    },
                },
            },
            bindings: {
                [`${config.processor.queueName}-binding`]: {
                    source: config.processor.exchangeName,
                    destination: config.processor.queueName,
                    destinationType: "queue",
                    bindingKey: "delayed.message",
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
            subscriptions: {
                delayedMessageProcessor: {
                    queue: config.processor.queueName,
                },
            },
        },
    },
};
