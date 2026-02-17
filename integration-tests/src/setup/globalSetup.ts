import { RabbitMQContainer } from "@testcontainers/rabbitmq";

export default async function globalSetup() {
    const container = await new RabbitMQContainer("rabbitmq:3.13-management")
        .withExposedPorts(5672, 15672)
        .start();

    process.env.__RABBITMQ_HOST__ = container.getHost();
    process.env.__RABBITMQ_PORT__ = container.getMappedPort(5672).toString();
    process.env.__RABBITMQ_URL__ = `amqp://guest:guest@${container.getHost()}:${container.getMappedPort(5672)}/`;

    // Store container reference for teardown (same process context)
    (globalThis as Record<string, unknown>).__RABBITMQ_CONTAINER__ = container;
}
