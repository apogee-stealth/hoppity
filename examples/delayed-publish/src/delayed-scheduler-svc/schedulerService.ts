import { BrokerWithExtensions } from "@apogeelabs/hoppity";
import { DelayedPublishBroker } from "@apogeelabs/hoppity-delayed-publish";
import { config } from "../shared/config";
import { getBroker } from "./messaging/broker";

/**
 * Starts the delayed message publishing loop.
 * Returns the interval handle so the caller can clean it up on shutdown.
 */
export async function startSchedulerService(): Promise<ReturnType<typeof setInterval>> {
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
            await broker.delayedPublish(
                `${config.processor.exchangeName}-publication`,
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
            console.error("❌ [Scheduler] Failed to schedule delayed message:", error);
        }
    };

    await publishDelayedMessage();

    const interval = setInterval(async () => {
        try {
            await publishDelayedMessage();
        } catch (error) {
            console.error("❌ [Scheduler] Error in delayed publish loop:", error);
        }
    }, config.scheduler.interval);

    console.log("✅ [Scheduler] Delayed publish loop started");
    return interval;
}
