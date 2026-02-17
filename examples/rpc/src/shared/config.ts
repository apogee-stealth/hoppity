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
        get url() {
            return `amqp://${this.user}:${this.pass}@${this.host}:${this.port}${this.vhost}`;
        },
    },
    service: {
        rpcCallInterval: parseInt(process.env.RPC_CALL_INTERVAL || "5000", 10),
        rpcExchange: process.env.RPC_EXCHANGE || "rpc-exchange",
    },
} as const;
