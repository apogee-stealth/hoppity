import { getBroker } from "./messaging/broker";

/**
 * Starts the RPC handler service.
 * Registers RPC listeners for processing messages from the RPC Initiator Service.
 */
export async function startHandlerService(): Promise<void> {
    const broker = await getBroker();

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
