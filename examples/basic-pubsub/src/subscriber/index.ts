import { config } from "../config";
import { getBroker } from "./messaging/broker";

/**
 * Subscriber Service
 *
 * Demonstrates consuming messages with hoppity:
 * 1. withTopology() to declare exchanges, queues, bindings, and subscriptions
 * 2. withCustomLogger() for custom logger injection
 * 3. withSubscriptions() to auto-wire handlers to subscription queues
 */
async function main() {
    console.log("🚀 [Subscriber] Starting...");
    console.log("📋 [Subscriber] Configuration:", {
        rabbitmq: config.rabbitmq.host,
    });

    try {
        const broker = await getBroker();
        console.log("✅ [Subscriber] Broker created successfully");

        const shutdown = async () => {
            console.log("🛑 [Subscriber] Shutting down...");
            try {
                await broker.shutdown();
                console.log("✅ [Subscriber] Shutdown complete");
            } catch (error) {
                console.log(
                    "⚠️  [Subscriber] Shutdown completed with warnings:",
                    error instanceof Error ? error.message : String(error)
                );
            }
            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        console.log("✅ [Subscriber] Running. Waiting for messages. Press Ctrl+C to stop");
    } catch (error) {
        console.error("❌ [Subscriber] Failed to start:", error);
        process.exit(1);
    }
}

main();
