import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";
import { startInitiatorService } from "./initiatorService";

/**
 * RPC Initiator Service
 *
 * Demonstrates:
 * 1. Using hoppity with a base topology
 * 2. Applying RPC middleware for service-to-service communication
 * 3. Making periodic RPC calls to RPC Handler Service
 * 4. Custom logger injection via hoppity-logger
 */
async function main() {
    console.log("🚀 [RPC Initiator] Starting...");
    console.log("📋 [RPC Initiator] Configuration:", {
        rabbitmq: config.rabbitmq.host,
        rpcCallInterval: config.service.rpcCallInterval,
        rpcExchange: config.service.rpcExchange,
    });

    try {
        const broker = await getBroker();
        console.log("✅ [RPC Initiator] Broker created successfully");

        // Start the initiator service (sets up periodic RPC calls)
        const rpcInterval = await startInitiatorService();

        const shutdown = async () => {
            console.log("🛑 [RPC Initiator] Shutting down...");
            clearInterval(rpcInterval);
            await broker.shutdown();
            console.log("✅ [RPC Initiator] Shutdown complete");
            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        console.log("✅ [RPC Initiator] Running. Press Ctrl+C to stop");
    } catch (error) {
        console.error("❌ [RPC Initiator] Failed to start:", error);
        process.exit(1);
    }
}

main();
