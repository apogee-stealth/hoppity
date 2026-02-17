import { StartedRabbitMQContainer } from "@testcontainers/rabbitmq";

export default async function globalTeardown() {
    const container = (globalThis as Record<string, unknown>).__RABBITMQ_CONTAINER__ as
        | StartedRabbitMQContainer
        | undefined;

    if (container) {
        await container.stop();
    }
}
