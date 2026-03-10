import dotenv from "dotenv";
import path from "path";

// Load .env from the bookstore root (one level up from runner)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Runner configuration. Includes RabbitMQ connection details (same env vars as
 * the services) plus paths to the service entry points for child-process spawning.
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
    // Paths to service entry points, resolved relative to this file at runtime
    services: {
        orderService: path.resolve(__dirname, "../../packages/order-service/src/index.ts"),
        catalogService: path.resolve(__dirname, "../../packages/catalog-service/src/index.ts"),
    },
    // How long to wait for a service to print [READY] before giving up
    serviceReadyTimeoutMs: 15000,
} as const;
