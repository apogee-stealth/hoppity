/* eslint-disable @typescript-eslint/no-explicit-any */
import { SubscriptionHandler } from "@apogeelabs/hoppity-subscriptions";
import { BrokerAsPromised } from "rascal";

/**
 * Handler for processing delayed messages from the scheduler service
 */
export const delayedMessageHandler: SubscriptionHandler = async (
    _message: any,
    content: any,
    ackOrNack: any,
    _broker: BrokerAsPromised
): Promise<void> => {
    const receivedTime = new Date();
    const originalTime = new Date(content.timestamp);
    const actualDelay = receivedTime.getTime() - originalTime.getTime();

    console.log("📨 [RECEIVED] Delayed message received and being processed");

    console.log("📨 [ProcessorService] Received delayed message from Delayed Scheduler Service:", {
        messageId: content.id,
        service: content.service,
        timestamp: content.timestamp,
        originalDelay: content.originalDelay,
        actualDelay: actualDelay,
    });

    const { id, service, timestamp, originalDelay, message: messageText } = content;

    console.log("🔧 [ProcessorService] Processing delayed message:", {
        id,
        service,
        timestamp,
        originalDelay,
        messageText,
    });

    console.log("✅ [PROCESSED] Message processing completed");

    ackOrNack();
};
