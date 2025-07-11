import { BrokerConfig } from "rascal";
import { config } from "../../shared/config";

/**
 * Delayed Processor topology configuration
 * Contains the complete topology configuration for the delayed processor service
 */
export const delayedProcessorTopology: BrokerConfig = {
    vhosts: {
        "/": {
            connection: {
                url: `amqp://${config.rabbitmq.user}:${config.rabbitmq.pass}@${config.rabbitmq.host}:${config.rabbitmq.port}/${config.rabbitmq.vhost}`,
            },
            exchanges: {
                // Main exchange for delayed messages
                [config.delayed.exchange]: {
                    type: "direct",
                    options: {
                        durable: false,
                        autoDelete: false,
                    },
                },
                // Service B exchange for processing delayed messages
                [config.service.b.exchangeName]: {
                    type: "direct",
                    options: {
                        durable: false,
                        autoDelete: false,
                    },
                },
            },
            queues: {
                // Service B queue for processing delayed messages
                [config.service.b.queueName]: {
                    options: {
                        durable: false,
                        autoDelete: false,
                    },
                },
            },
            bindings: {
                // Bind Service B queue to its exchange
                [`${config.service.b.queueName}-binding`]: {
                    source: config.service.b.exchangeName,
                    destination: config.service.b.queueName,
                    destinationType: "queue",
                    bindingKey: "delayed.message",
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
            subscriptions: {
                // Subscription for Service B to consume messages
                delayedMessageProcessor: {
                    queue: config.service.b.queueName,
                },
            },
        },
    },
};
