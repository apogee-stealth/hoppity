import { BrokerConfig } from "rascal";

/**
 * Creates a base topology configured to use the testcontainer RabbitMQ instance.
 * Each test file should use unique exchange/queue names to avoid collisions.
 */
export function createTestTopology(): BrokerConfig {
    const host = process.env.__RABBITMQ_HOST__ || "localhost";
    const port = process.env.__RABBITMQ_PORT__ || "5672";

    return {
        vhosts: {
            "/": {
                connection: {
                    url: `amqp://guest:guest@${host}:${port}/`,
                    options: { heartbeat: 5 },
                },
                exchanges: {},
                queues: {},
                bindings: {},
                publications: {},
                subscriptions: {},
            },
        },
    };
}
