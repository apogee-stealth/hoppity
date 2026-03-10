import dotenv from "dotenv";

// Load .env file if present; falls back to sensible defaults for local dev
dotenv.config();

/**
 * Application configuration sourced from environment variables.
 *
 * All RabbitMQ settings default to the standard local dev values
 * (guest/guest on localhost:5672, vhost "/"), so the example works
 * out of the box with `docker compose up -d` and no .env file.
 */
export const config = {
    rabbitmq: {
        host: process.env.RABBITMQ_HOST || "localhost",
        port: parseInt(process.env.RABBITMQ_PORT || "5672", 10),
        user: process.env.RABBITMQ_USER || "guest",
        pass: process.env.RABBITMQ_PASS || "guest",
        vhost: process.env.RABBITMQ_VHOST || "/",
        /** Computed AMQP connection URL used by Rascal's `connection.url` field. */
        get url() {
            return `amqp://${this.user}:${this.pass}@${this.host}:${this.port}${this.vhost}`;
        },
    },
    /** How often (ms) the publisher sends a message. */
    publishInterval: parseInt(process.env.PUBLISH_INTERVAL || "3000", 10),
} as const;
