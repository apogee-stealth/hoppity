/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrokerWithExtensions } from "@apogeelabs/hoppity";
import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";
import { DelayedPublishBroker } from "@apogeelabs/hoppity-delayed-publish";

/**
 * Starts the delayed message publishing loop for the scheduler service
 * This function handles scheduling delayed messages to be sent to the processor service
 */
export async function startSchedulerService(): Promise<void> {
    const broker = (await getBroker()) as BrokerWithExtensions<[DelayedPublishBroker]>;
    let messageCounter = 0;

    const publishDelayedMessage = async () => {
        messageCounter++;

        const message = {
            id: messageCounter,
            service: "Delayed Scheduler",
            timestamp: new Date().toISOString(),
            message: `Delayed message #${messageCounter} from Delayed Scheduler`,
            originalDelay: config.delayed.defaultDelay,
        };

        try {
            // Publish message with delay to Service B
            await broker.delayedPublish(
                `${config.service.b.exchangeName}-publication`,
                message,
                undefined,
                config.delayed.defaultDelay
            );

            console.log("\n" + "=".repeat(60));
            console.log("⏰ [SCHEDULED] Delayed message scheduled for delivery");
            console.log("=".repeat(60));
            console.log(`\tMessage ID: ${messageCounter}`);
            console.log(`\t\tDelay: ${config.delayed.defaultDelay}ms`);
            console.log(`\t\tContent: ${message.message}`);
            console.log("=".repeat(60) + "\n");
        } catch (error) {
            console.error("❌ [SchedulerService] Failed to schedule delayed message:", error);
        }
    };

    // Publish initial message
    await publishDelayedMessage();

    // Set up interval for publishing delayed messages
    const interval = setInterval(async () => {
        try {
            await publishDelayedMessage();
        } catch (error) {
            console.error("❌ [SchedulerService] Error in delayed publish loop:", error);
        }
    }, config.service.a.interval);

    // Clean up interval on process exit
    process.on("SIGINT", () => {
        clearInterval(interval);
        console.log("🛑 [SchedulerService] Stopped delayed publish loop");
    });

    console.log("✅ [SchedulerService] Delayed publish loop started successfully");
}
