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
    scheduler: {
        interval: parseInt(process.env.SCHEDULER_INTERVAL || "3000", 10),
    },
    processor: {
        queueName: process.env.PROCESSOR_QUEUE_NAME || "delayed-example-queue",
        exchangeName: process.env.PROCESSOR_EXCHANGE_NAME || "delayed-example-exchange",
    },
    delayed: {
        exchange: process.env.DELAYED_EXCHANGE || "delayed-exchange",
        defaultDelay: parseInt(process.env.DEFAULT_DELAY || "5000", 10),
        maxDelay: parseInt(process.env.MAX_DELAY || "30000", 10),
    },
} as const;

export type Config = typeof config;
