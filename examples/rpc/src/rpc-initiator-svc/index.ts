/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";
import { startInitiatorService } from "./initiatorService";

/**
 * RPC Initiator Service - Publisher & Subscriber
 *
 * This service demonstrates:
 * 1. Using hoppity with a base topology
 * 2. Applying RPC middleware for service-to-service communication
 * 3. Applying subscription middleware for handling non-RPC messages
 * 4. Making periodic RPC calls to RPC Handler Service
 * 5. Using package plugins for logging and monitoring
 */
async function startRpcInitiator() {
    console.log("🚀 [RPC Initiator] Starting RPC Initiator Service (Publisher & Subscriber)...");
    console.log("🚀 [RPC Initiator] Configuration:", {
        rabbitMQ: config.rabbitMQ.host,
        interval: config.service.serviceAInterval,
        rpcExchange: config.service.rpcExchange,
    });

    try {
        // Get the broker instance using the singleton factory
        const broker = await getBroker();

        console.log("✅ [Service A] Broker created successfully");

        // Start the initiator service
        await startInitiatorService();

        // Handle graceful shutdown
        const shutdown = async () => {
            console.log("🛑 [RPC Initiator] Shutting down...");

            // Clear the RPC interval
            if ((broker as any).rpcInitiatorRpcInterval) {
                clearInterval((broker as any).rpcInitiatorRpcInterval);
            }

            // Clear the publish interval
            if ((broker as any).rpcInitiatorPublishInterval) {
                clearInterval((broker as any).rpcInitiatorPublishInterval);
            }

            await broker.shutdown();
            console.log("✅ [RPC Initiator] Shutdown complete");
            process.exit(0);
        };

        // Listen for shutdown signals
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        console.log(
            "✅ [RPC Initiator] RPC Initiator Service is running and making RPC calls to RPC Handler Service..."
        );
        console.log("✅ [RPC Initiator] Press Ctrl+C to stop");
    } catch (error) {
        console.error("❌ [RPC Initiator] Failed to start RPC Initiator Service:", error);
        process.exit(1);
    }
}

// Start the service
startRpcInitiator();
