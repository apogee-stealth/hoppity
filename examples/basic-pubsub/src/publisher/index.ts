import { config } from "../config";
import { getBroker } from "./messaging/broker";

/**
 * Publisher Service
 *
 * Demonstrates publishing messages with hoppity:
 * 1. withTopology() to declare exchanges and publications
 * 2. withCustomLogger() for custom logger injection
 * 3. broker.publish() to send messages
 */
async function main() {
    console.log("🚀 [Publisher] Starting...");
    console.log("📋 [Publisher] Configuration:", {
        rabbitmq: config.rabbitmq.host,
        publishInterval: config.publishInterval,
    });

    try {
        const broker = await getBroker();
        console.log("✅ [Publisher] Broker created successfully");

        let messageCount = 0;

        const publishMessage = async () => {
            messageCount++;
            const message = {
                id: messageCount,
                text: `Hello from publisher (#${messageCount})`,
                timestamp: new Date().toISOString(),
            };

            try {
                await broker.publish("send_event", message);
                console.log(`📤 [Publisher] Sent message #${messageCount}:`, message.text);
            } catch (error) {
                console.error("❌ [Publisher] Failed to publish:", error);
            }
        };

        // Publish an initial message, then on interval
        await publishMessage();
        const interval = setInterval(publishMessage, config.publishInterval);

        const shutdown = async () => {
            console.log("🛑 [Publisher] Shutting down...");
            clearInterval(interval);
            await broker.shutdown();
            console.log("✅ [Publisher] Shutdown complete");
            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        console.log("✅ [Publisher] Running. Press Ctrl+C to stop");
    } catch (error) {
        console.error("❌ [Publisher] Failed to start:", error);
        process.exit(1);
    }
}

main();
