import { getBroker } from "./messaging/broker";

/**
 * Catalog Service
 *
 * Reacts to order events to maintain in-memory stock levels.
 * Exposes current stock via the getStockLevels RPC so the runner can
 * display before/after stock changes without catalog-service needing
 * to push notifications.
 */
async function main() {
    try {
        const broker = await getBroker();
        console.log("[INFO] [catalog-service] Connected to RabbitMQ");
        console.log("[INFO] [catalog-service] Subscribed to: orderCreated, orderCancelled");
        console.log("[INFO] [catalog-service] RPC handler registered: getStockLevels");

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
        console.error("[ERROR] [catalog-service] Failed to start:", error);
        process.exit(1);
    }
}

main();
