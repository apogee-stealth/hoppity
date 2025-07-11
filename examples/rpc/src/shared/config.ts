import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface RabbitMQConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    vhost: string;
    url: string;
}

export interface ServiceConfig {
    serviceAInterval: number;
    rpcExchange: string;
    nodeEnv: string;
}

export const rabbitMQConfig: RabbitMQConfig = {
    host: process.env.RABBITMQ_HOST || "localhost",
    port: parseInt(process.env.RABBITMQ_PORT || "5672", 10),
    user: process.env.RABBITMQ_USER || "guest",
    pass: process.env.RABBITMQ_PASS || "guest",
    vhost: process.env.RABBITMQ_VHOST || "/",
    get url() {
        return `amqp://${this.user}:${this.pass}@${this.host}:${this.port}${this.vhost}`;
    },
};

export const serviceConfig: ServiceConfig = {
    serviceAInterval: parseInt(process.env.SERVICE_A_INTERVAL || "5000", 10),
    rpcExchange: process.env.RPC_EXCHANGE || "rpc-exchange",
    nodeEnv: process.env.NODE_ENV || "development",
};

export const config = {
    rabbitMQ: rabbitMQConfig,
    service: serviceConfig,
};
