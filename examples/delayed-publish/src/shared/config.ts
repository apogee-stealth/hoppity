import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
    rabbitmq: {
        host: process.env.RABBITMQ_HOST || "localhost",
        port: parseInt(process.env.RABBITMQ_PORT || "5672", 10),
        user: process.env.RABBITMQ_USER || "guest",
        pass: process.env.RABBITMQ_PASS || "guest",
        vhost: process.env.RABBITMQ_VHOST || "/",
    },
    service: {
        a: {
            interval: parseInt(process.env.SERVICE_A_INTERVAL || "3000", 10),
        },
        b: {
            queueName: process.env.SERVICE_B_QUEUE_NAME || "delayed-example-queue",
            exchangeName: process.env.SERVICE_B_EXCHANGE_NAME || "delayed-example-exchange",
        },
    },
    delayed: {
        exchange: process.env.DELAYED_EXCHANGE || "delayed-exchange",
        defaultDelay: parseInt(process.env.DEFAULT_DELAY || "5000", 10),
        maxDelay: parseInt(process.env.MAX_DELAY || "30000", 10),
    },
    development: {
        nodeEnv: process.env.NODE_ENV || "development",
    },
} as const;

export type Config = typeof config;
