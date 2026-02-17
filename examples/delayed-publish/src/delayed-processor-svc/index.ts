import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";

/**
 * Delayed Processor Service
 *
 * Demonstrates consuming delayed messages:
 * 1. Receives messages that were scheduled by the Delayed Scheduler Service
 * 2. Processes them via subscription handlers wired up with hoppity-subscriptions
 * 3. Custom logger injection via hoppity-logger
 */
async function main() {
    console.log("🚀 [Delayed Processor] Starting...");
    console.log("📋 [Delayed Processor] Configuration:", {
        rabbitmq: config.rabbitmq.host,
        processorQueue: config.processor.queueName,
        defaultDelay: config.delayed.defaultDelay,
    });

    try {
        const broker = await getBroker();
        console.log("✅ [Delayed Processor] Broker created successfully");

        const shutdown = async (signal: string) => {
            console.log(`\n🛑 [Delayed Processor] Received ${signal}, shutting down...`);
            try {
                await broker.shutdown();
                console.log("✅ [Delayed Processor] Shutdown complete");
                process.exit(0);
            } catch (error) {
                console.error("❌ [Delayed Processor] Error during shutdown:", error);
                process.exit(1);
            }
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

        console.log(
            "✅ [Delayed Processor] Running. Waiting for delayed messages. Press Ctrl+C to stop"
        );
    } catch (error) {
        console.error("❌ [Delayed Processor] Failed to start:", error);
        process.exit(1);
    }
}

main();
