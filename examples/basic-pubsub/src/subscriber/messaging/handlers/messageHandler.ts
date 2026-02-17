/* eslint-disable @typescript-eslint/no-explicit-any */
import { SubscriptionHandler } from "@apogeelabs/hoppity-subscriptions";

/**
 * Handler for incoming event messages.
 * Logs the message and acknowledges it.
 */
export const messageHandler: SubscriptionHandler = async (
    _message: any,
    content: any,
    ackOrNack: any
): Promise<void> => {
    console.log("📨 [Subscriber] Received message:", {
        id: content.id,
        text: content.text,
        timestamp: content.timestamp,
        receivedAt: new Date().toISOString(),
    });

    ackOrNack();
};
