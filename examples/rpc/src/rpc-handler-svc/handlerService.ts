/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBroker } from "./messaging/broker";

/**
 * Starts the RPC handler service
 * This function sets up RPC listeners for processing messages from RPC Initiator Service
 */
export async function startHandlerService(): Promise<void> {
    const broker = await getBroker();

    // Register RPC handler for processing messages from RPC Initiator Service
    broker.addRpcListener("rpc_handler_svc.process_message", async request => {
        console.log("📥 [HandlerService] Received RPC request:", {
            id: request.id,
            service: request.service,
            timestamp: request.timestamp,
            message: request.message,
            receivedAt: new Date().toISOString(),
        });

        // Process the message (in a real app, this would be more complex)
        console.log("🔄 [HandlerService] Processing RPC request:", request.id);

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 100));

        // Return a response
        const response = {
            processed: true,
            requestId: request.id,
            processedAt: new Date().toISOString(),
            message: `Processed message from ${request.service}`,
            originalMessage: request.message,
        };

        console.log("✅ [HandlerService] RPC request processed successfully:", request.id);
        return response;
    });

    console.log("✅ [HandlerService] RPC Handler setup complete");
}
