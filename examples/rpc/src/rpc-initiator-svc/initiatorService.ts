import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";

/**
 * Starts the RPC initiator service.
 * Sets up periodic RPC calls to the RPC Handler Service.
 * Returns the interval handle so the caller can clean it up on shutdown.
 */
export async function startInitiatorService(): Promise<ReturnType<typeof setInterval>> {
    const broker = await getBroker();

    const rpcInterval = setInterval(async () => {
        try {
            const requestId = Date.now();
            console.log(`📤 [Initiator] RPC call to handler (request ${requestId})...`);

            const response = await broker.request("rpc_handler_svc.process_message", {
                id: requestId,
                service: "RPC Initiator",
                timestamp: new Date().toISOString(),
                message: `Hello from RPC Initiator at ${new Date().toISOString()}`,
            });

            console.log(`✅ [Initiator] RPC response (request ${requestId}):`, response);
        } catch (error) {
            console.error("❌ [Initiator] RPC call failed:", error);
        }
    }, config.service.rpcCallInterval);

    console.log("✅ [Initiator] RPC call loop started");
    return rpcInterval;
}
