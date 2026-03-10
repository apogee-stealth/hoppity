import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";

/**
 * Starts the RPC initiator service.
 *
 * Sets up a periodic interval that sends RPC requests to the handler service.
 * Each call to `broker.request()` does the following under the hood:
 * 1. Generates a unique `correlationId` (UUID)
 * 2. Publishes the request to the RPC exchange with routing key
 *    `rpc.rpc_handler_svc.process_message.request`
 * 3. Includes the initiator's reply queue name in the `replyTo` field
 * 4. Registers a pending promise keyed by the `correlationId`
 * 5. When the response arrives on the reply queue, the `correlationId`
 *    is used to resolve the correct pending promise
 *
 * @returns The interval handle — the caller must `clearInterval()` on shutdown
 *          to stop the RPC loop before closing the broker connection.
 */
export async function startInitiatorService(): Promise<ReturnType<typeof setInterval>> {
    const broker = await getBroker();

    const rpcInterval = setInterval(async () => {
        try {
            const requestId = Date.now();
            console.log(`📤 [Initiator] RPC call to handler (request ${requestId})...`);

            // broker.request() returns a Promise that resolves with the handler's
            // return value. The RPC name "rpc_handler_svc.process_message" tells
            // the RPC exchange how to route this to the handler's inbound queue.
            const response = await broker.request("rpc_handler_svc.process_message", {
                id: requestId,
                service: "RPC Initiator",
                timestamp: new Date().toISOString(),
                message: `Hello from RPC Initiator at ${new Date().toISOString()}`,
            });

            console.log(`✅ [Initiator] RPC response (request ${requestId}):`, response);
        } catch (error) {
            // Timeouts, handler errors, and cancellations all land here.
            // See RpcErrorCode for the full set of error codes.
            console.error("❌ [Initiator] RPC call failed:", error);
        }
    }, config.service.rpcCallInterval);

    console.log("✅ [Initiator] RPC call loop started");
    return rpcInterval;
}
