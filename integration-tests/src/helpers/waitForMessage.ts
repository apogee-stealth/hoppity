import { BrokerAsPromised } from "rascal";

/**
 * Subscribes to a Rascal subscription and returns a promise that resolves
 * with the first message content received, or rejects after timeout.
 */
export async function waitForMessage<T = unknown>(
    broker: BrokerAsPromised,
    subscriptionName: string,
    timeoutMs = 10_000
): Promise<T> {
    const subscription = await broker.subscribe(subscriptionName);

    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`Timed out waiting for message on "${subscriptionName}"`)),
            timeoutMs
        );

        subscription.on("message", (_message, content, ackOrNack) => {
            clearTimeout(timer);
            ackOrNack();
            resolve(content as T);
        });
        subscription.on("error", err => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
