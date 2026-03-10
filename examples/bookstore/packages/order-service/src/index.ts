import { getBroker } from "./messaging/broker";

/**
 * Order Service
 *
 * Owns the orders domain — handles createOrder and getOrderSummary RPCs,
 * the cancelOrder command, and publishes orderCreated / orderCancelled events.
 *
 * All publications go through the order-service outbound fanout exchange so
 * the runner can tap them for audit/observation without subscribing to domain
 * events directly.
 */
async function main() {
    try {
        const broker = await getBroker();
        console.log("[INFO] [order-service] Connected to RabbitMQ");
        console.log(
            "[INFO] [order-service] Handlers registered: createOrder, getOrderSummary, cancelOrder"
        );

        const shutdown = async () => {
            try {
                await broker.shutdown();
            } catch {
                // Shutdown warnings are non-fatal
            }
            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        // Signal to the runner that this service is ready to accept messages.
        // The runner monitors stdout for this exact string.
        console.log("[READY]");
    } catch (error) {
        console.error("[ERROR] [order-service] Failed to start:", error);
        process.exit(1);
    }
}

main();
