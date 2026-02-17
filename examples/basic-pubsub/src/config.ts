import dotenv from "dotenv";

dotenv.config();

export const config = {
    rabbitmq: {
        host: process.env.RABBITMQ_HOST || "localhost",
        port: parseInt(process.env.RABBITMQ_PORT || "5672", 10),
        user: process.env.RABBITMQ_USER || "guest",
        pass: process.env.RABBITMQ_PASS || "guest",
        vhost: process.env.RABBITMQ_VHOST || "/",
        get url() {
            return `amqp://${this.user}:${this.pass}@${this.host}:${this.port}${this.vhost}`;
        },
    },
    publishInterval: parseInt(process.env.PUBLISH_INTERVAL || "3000", 10),
} as const;
