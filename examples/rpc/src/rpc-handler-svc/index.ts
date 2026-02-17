import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";
import { startHandlerService } from "./handlerService";

/**
 * RPC Handler Service
 *
 * Demonstrates:
 * 1. Using hoppity with a base topology
 * 2. Applying RPC middleware for service-to-service communication
 * 3. Setting up RPC handlers to process requests
 * 4. Custom logger injection via hoppity-logger
 */
async function main() {
    console.log("📥 [RPC Handler] Starting...");
    console.log("📋 [RPC Handler] Configuration:", {
        rabbitmq: config.rabbitmq.host,
        rpcExchange: config.service.rpcExchange,
    });

    try {
        const broker = await getBroker();
        console.log("✅ [RPC Handler] Broker created successfully");

        await startHandlerService();

        const shutdown = async () => {
            console.log("🛑 [RPC Handler] Shutting down...");
            try {
                await broker.shutdown();
                console.log("✅ [RPC Handler] Shutdown complete");
            } catch (error) {
                console.log(
                    "⚠️  [RPC Handler] Shutdown completed with warnings:",
                    error instanceof Error ? error.message : String(error)
                );
            }
            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        console.log("✅ [RPC Handler] Running. Press Ctrl+C to stop");
    } catch (error) {
        console.error("❌ [RPC Handler] Failed to start:", error);
        process.exit(1);
    }
}

main();
