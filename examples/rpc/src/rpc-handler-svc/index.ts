import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";
import { startHandlerService } from "./handlerService";

/**
 * RPC Handler Service - RPC Server & Message Consumer
 *
 * This service demonstrates:
 * 1. Using hoppity with a base topology
 * 2. Applying RPC middleware for service-to-service communication
 * 3. Setting up RPC handlers to process requests from RPC Initiator Service
 * 4. Using package plugins for logging and monitoring
 */
async function startRpcHandler() {
    console.log("📥 [RPC Handler] Starting RPC Handler Service (RPC Server)...");
    console.log("📥 [RPC Handler] Configuration:", {
        rabbitMQ: config.rabbitMQ.host,
        rpcExchange: config.service.rpcExchange,
    });

    try {
        // Get the broker instance using the singleton factory
        const broker = await getBroker();

        console.log("✅ [RPC Handler] Broker created successfully");

        // Start the handler service
        await startHandlerService();

        // Handle graceful shutdown
        const shutdown = async () => {
            console.log("🛑 [RPC Handler] Shutting down...");
            try {
                await broker.shutdown();
                console.log("✅ [RPC Handler] Shutdown complete");
            } catch (error) {
                // Gracefully handle shutdown errors (like "Callback was already called")
                console.log(
                    "⚠️  [RPC Handler] Shutdown completed with warnings:",
                    error instanceof Error ? error.message : String(error)
                );
            }
            process.exit(0);
        };

        // Listen for shutdown signals
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        console.log(
            "✅ [RPC Handler] RPC Handler Service is running and waiting for RPC requests from RPC Initiator Service..."
        );
        console.log("✅ [RPC Handler] Press Ctrl+C to stop");
    } catch (error) {
        console.error("❌ [RPC Handler] Failed to start RPC Handler Service:", error);
        process.exit(1);
    }
}

// Start the service
startRpcHandler();
