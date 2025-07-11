import { getBroker } from "./messaging/broker";
import { startSchedulerService } from "./schedulerService";
import { config } from "../shared/config";

/**
 * Delayed Scheduler Service - Delayed Publish Example
 *
 * This service demonstrates the hoppity-delayed-publish plugin by:
 * 1. Scheduling messages to be published to Delayed Processor Service with delays
 * 2. Publishing messages at regular intervals with configurable delays
 * 3. Showing the delayed publish functionality in action
 */
async function main() {
    console.log("🚀 [Delayed Scheduler] Starting delayed publish example...");
    console.log("📋 [Delayed Scheduler] Configuration:", {
        rabbitmq: config.rabbitmq,
        service: config.service,
        delayed: config.delayed,
    });

    try {
        // Get the broker instance using the singleton factory
        const broker = await getBroker();

        console.log(
            "✅ [Delayed Scheduler] Broker created successfully with delayed publish support"
        );

        // Start the scheduler service
        await startSchedulerService();

        // Handle graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n🛑 [Delayed Scheduler] Received ${signal}, shutting down gracefully...`);

            try {
                await broker.shutdown();
                console.log("✅ [Delayed Scheduler] Broker shutdown completed");
                process.exit(0);
            } catch (error) {
                console.error("❌ [Delayed Scheduler] Error during shutdown:", error);
                process.exit(1);
            }
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

        console.log("🎯 [Delayed Scheduler] Service is running and scheduling delayed messages...");
        console.log(
            "📊 [Delayed Scheduler] Check RabbitMQ Management UI at http://localhost:15672"
        );
        console.log(
            "⏰ [Delayed Scheduler] Messages will be scheduled with delays and sent to Delayed Processor Service"
        );
        console.log("📨 [Delayed Scheduler] Press Ctrl+C to stop the service");
    } catch (error) {
        console.error("❌ [Delayed Scheduler] Failed to start service:", error);
        process.exit(1);
    }
}

// Start the service
main().catch(error => {
    console.error("❌ [Delayed Scheduler] Unhandled error:", error);
    process.exit(1);
});
