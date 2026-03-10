import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized configuration for both RPC services.
 *
 * Both the initiator and handler import this — they need identical RabbitMQ
 * connection details and must agree on the RPC exchange name, otherwise
 * messages won't route between them.
 */
export const config = {
    rabbitmq: {
        host: process.env.RABBITMQ_HOST || "localhost",
        port: parseInt(process.env.RABBITMQ_PORT || "5672", 10),
        user: process.env.RABBITMQ_USER || "guest",
        pass: process.env.RABBITMQ_PASS || "guest",
        vhost: process.env.RABBITMQ_VHOST || "/",
        /** Computed AMQP connection URL from the individual fields above. */
        get url() {
            return `amqp://${this.user}:${this.pass}@${this.host}:${this.port}${this.vhost}`;
        },
    },
    service: {
        /** How often the initiator fires an RPC request (ms). */
        rpcCallInterval: parseInt(process.env.RPC_CALL_INTERVAL || "5000", 10),
        /**
         * The RPC exchange name. Both services must use the same value so the
         * topic exchange routes requests to the correct handler queues.
         */
        rpcExchange: process.env.RPC_EXCHANGE || "rpc-exchange",
    },
} as const;
