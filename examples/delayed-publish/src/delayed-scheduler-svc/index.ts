import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";
import { startSchedulerService } from "./schedulerService";

/**
 * Delayed Scheduler Service
 *
 * Demonstrates the hoppity-delayed-publish plugin by:
 * 1. Scheduling messages for future delivery with configurable delays
 * 2. Publishing messages at regular intervals
 * 3. Custom logger injection via hoppity-logger
 */
async function main() {
    console.log("🚀 [Delayed Scheduler] Starting...");
    console.log("📋 [Delayed Scheduler] Configuration:", {
        rabbitmq: config.rabbitmq.host,
        schedulerInterval: config.scheduler.interval,
        defaultDelay: config.delayed.defaultDelay,
    });

    try {
        const broker = await getBroker();
        console.log("✅ [Delayed Scheduler] Broker created successfully");

        const schedulerInterval = await startSchedulerService();

        const shutdown = async (signal: string) => {
            console.log(`\n🛑 [Delayed Scheduler] Received ${signal}, shutting down...`);
            clearInterval(schedulerInterval);
            try {
                await broker.shutdown();
                console.log("✅ [Delayed Scheduler] Shutdown complete");
                process.exit(0);
            } catch (error) {
                console.error("❌ [Delayed Scheduler] Error during shutdown:", error);
                process.exit(1);
            }
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

        console.log("✅ [Delayed Scheduler] Running. Press Ctrl+C to stop");
    } catch (error) {
        console.error("❌ [Delayed Scheduler] Failed to start:", error);
        process.exit(1);
    }
}

main();
