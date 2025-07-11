import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";

/**
 * Delayed Processor Service - Delayed Message Processor
 *
 * This service demonstrates processing delayed messages from Delayed Scheduler Service:
 * 1. Consumes delayed messages that were scheduled by Delayed Scheduler Service
 * 2. Processes them with different scenarios (regular vs long delayed)
 * 3. Sends notifications back to Delayed Scheduler Service about processing results
 */
async function main() {
    console.log("🚀 [Delayed Processor] Starting delayed message processor...");
    console.log("📋 [Delayed Processor] Configuration:", {
        rabbitmq: config.rabbitmq,
        service: config.service,
        delayed: config.delayed,
    });

    try {
        // Get the broker instance using the singleton factory
        const broker = await getBroker();

        console.log(
            "✅ [Delayed Processor] Broker created successfully with delayed publish support"
        );

        // Handle graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n🛑 [Delayed Processor] Received ${signal}, shutting down gracefully...`);

            try {
                await broker.shutdown();
                console.log("✅ [Delayed Processor] Broker shutdown completed");
                process.exit(0);
            } catch (error) {
                console.error("❌ [Delayed Processor] Error during shutdown:", error);
                process.exit(1);
            }
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

        console.log(
            "🎯 [Delayed Processor] Service is running and ready to process delayed messages..."
        );
        console.log(
            "📊 [Delayed Processor] Check RabbitMQ Management UI at http://localhost:15672"
        );
        console.log(
            "⏰ [Delayed Processor] Waiting for delayed messages from Delayed Scheduler Service..."
        );
        console.log("📨 [Delayed Processor] Press Ctrl+C to stop the service");
    } catch (error) {
        console.error("❌ [Delayed Processor] Failed to start service:", error);
        process.exit(1);
    }
}

// Start the service
main().catch(error => {
    console.error("❌ [Delayed Processor] Unhandled error:", error);
    process.exit(1);
});
