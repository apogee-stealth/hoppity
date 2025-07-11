/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";

/**
 * Starts the RPC initiator service
 * This function sets up periodic RPC calls to the RPC Handler Service
 */
export async function startInitiatorService(): Promise<void> {
    const broker = await getBroker();

    // Set up periodic RPC calls to RPC Handler Service
    const rpcInterval = setInterval(async () => {
        try {
            const requestId = Date.now();
            console.log(
                `📤 [InitiatorService] Making RPC call to RPC Handler Service (request ${requestId})...`
            );

            // Make RPC call to RPC Handler Service
            const response = await broker.request("rpc_handler_svc.process_message", {
                id: requestId,
                service: "RPC Initiator",
                timestamp: new Date().toISOString(),
                message: `Hello from RPC Initiator at ${new Date().toISOString()}`,
            });

            console.log(
                `✅ [InitiatorService] RPC response received (request ${requestId}):`,
                response
            );
        } catch (error) {
            console.error("❌ [InitiatorService] RPC call failed:", error);
        }
    }, config.service.serviceAInterval);

    // Store the interval for cleanup
    (broker as any).rpcInitiatorRpcInterval = rpcInterval;

    console.log("✅ [InitiatorService] RPC Initiator setup complete");
}
