import dotenv from "dotenv";
import path from "path";

// Load .env from the bookstore root (two levels up from this package)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/**
 * Service configuration for order-service.
 * Reads RabbitMQ connection details from environment variables with sensible
 * defaults that work out of the box with the repo's `docker compose` setup.
 */
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
} as const;
