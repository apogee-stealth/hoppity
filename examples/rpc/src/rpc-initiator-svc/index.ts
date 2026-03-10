import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";
import { startInitiatorService } from "./initiatorService";

/**
 * RPC Initiator Service — entry point.
 *
 * This is the "client" side of the RPC pattern. It:
 * 1. Creates a broker with RPC infrastructure via `withRpcSupport`
 * 2. Periodically sends RPC requests to the handler service
 * 3. Awaits responses that arrive on its exclusive reply queue
 *
 * Each `broker.request()` call generates a unique correlation ID, publishes
 * the request to the RPC exchange, and returns a Promise that resolves when
 * the matching response arrives (or rejects on timeout).
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

        // Clean shutdown: stop the interval first to prevent in-flight requests,
        // then close the AMQP connection. Pending requests will be rejected.
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
