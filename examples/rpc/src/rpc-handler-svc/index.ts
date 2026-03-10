import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";
import { startHandlerService } from "./handlerService";

/**
 * RPC Handler Service — entry point.
 *
 * This is the "server" side of the RPC pattern. It:
 * 1. Creates a broker with RPC infrastructure via `withRpcSupport`
 * 2. Registers an RPC listener that processes incoming requests
 * 3. Automatically sends responses back to the initiator's reply queue
 *
 * The handler doesn't need to know where replies go — the RPC middleware
 * handles correlation IDs and reply routing transparently.
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

        // Graceful shutdown: close the AMQP connection cleanly so RabbitMQ
        // can remove the exclusive/auto-delete queues immediately.
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
