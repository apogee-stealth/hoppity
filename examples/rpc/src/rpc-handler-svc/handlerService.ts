import { getBroker } from "./messaging/broker";

/**
 * Starts the RPC handler service by registering an RPC listener.
 *
 * The listener name `"rpc_handler_svc.process_message"` follows the convention
 * `serviceName.methodName`. The RPC middleware uses this to generate a routing
 * key of `rpc.rpc_handler_svc.process_message.request`, which the handler's
 * inbound queue is bound to via `rpc.rpc_handler_svc.#.request`.
 *
 * Whatever this function returns becomes the RPC response payload. The
 * middleware handles serialization, correlation, and routing the reply back
 * to the initiator's exclusive reply queue.
 */
export async function startHandlerService(): Promise<void> {
    const broker = await getBroker();

    // Register a handler for incoming RPC requests. The routing key convention
    // "serviceName.methodName" ensures requests land on this service's inbound
    // queue. The handler is async — return a value and the middleware sends it
    // back as the RPC response.
    broker.addRpcListener("rpc_handler_svc.process_message", async request => {
        console.log("📥 [Handler] Received RPC request:", {
            id: request.id,
            service: request.service,
            timestamp: request.timestamp,
            message: request.message,
            receivedAt: new Date().toISOString(),
        });

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 100));

        // The return value is automatically serialized and sent to the
        // initiator's reply queue, matched by correlation ID.
        const response = {
            processed: true,
            requestId: request.id,
            processedAt: new Date().toISOString(),
            message: `Processed message from ${request.service}`,
            originalMessage: request.message,
        };

        console.log("✅ [Handler] RPC request processed:", request.id);
        return response;
    });

    console.log("✅ [Handler] RPC listener registered");
}
