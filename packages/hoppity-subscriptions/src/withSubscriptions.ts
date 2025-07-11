import { MiddlewareContext, MiddlewareFunction, MiddlewareResult } from "@apogeelabs/hoppity";
import { BrokerAsPromised, BrokerConfig } from "rascal";
import { SubscriptionHandlers } from "./types";
import { validateSubscriptionHandlers } from "./validation";

/**
 * Middleware function that sets up subscription handlers for a Rascal broker.
 *
 * This middleware performs validation during the topology phase and sets up
 * subscription listeners during the broker creation callback phase.
 *
 * @param handlers - Object mapping subscription names to their handler functions
 * @returns MiddlewareFunction that can be used in the hoppity pipeline
 */
export function withSubscriptions(handlers: SubscriptionHandlers): MiddlewareFunction {
    return (topology: BrokerConfig, context: MiddlewareContext): MiddlewareResult => {
        // Validate subscription handlers during topology phase
        const validation = validateSubscriptionHandlers(topology, handlers);

        if (!validation.isValid) {
            throw new Error(validation.errorMessage);
        }

        // Track successfully validated subscriptions for diagnostics
        const validatedSubscriptions = Object.keys(handlers);
        context.data.validatedSubscriptions = validatedSubscriptions;
        context.logger.info(
            `Validated ${validatedSubscriptions.length} subscription handlers: ${validatedSubscriptions.join(", ")}`
        );

        // Return topology unchanged and provide callback for subscription setup
        return {
            topology,
            onBrokerCreated: async (broker: BrokerAsPromised) => {
                await setupSubscriptionHandlers(broker, handlers, context);
            },
        };
    };
}

/**
 * Sets up subscription handlers on the broker instance.
 *
 * @param broker - The Rascal broker instance
 * @param handlers - The subscription handlers object
 * @param context - The middleware context for logging
 */
async function setupSubscriptionHandlers(
    broker: BrokerAsPromised,
    handlers: SubscriptionHandlers,
    context: MiddlewareContext
): Promise<void> {
    const subscriptionNames = Object.keys(handlers);

    for (const subscriptionName of subscriptionNames) {
        try {
            // Subscribe to the queue
            const subscription = await broker.subscribe(subscriptionName);
            const handler = handlers[subscriptionName];

            // Set up message event handler
            subscription.on("message", (message, content, ackOrNack) => {
                try {
                    // Call the handler with the broker as the 4th parameter
                    const result = handler(message, content, ackOrNack, broker);

                    // Handle both Promise and void return types
                    if (result instanceof Promise) {
                        result.catch(error => {
                            context.logger.error(
                                `Error in subscription handler for '${subscriptionName}':`,
                                error
                            );
                            ackOrNack(error instanceof Error ? error : new Error(String(error)));
                        });
                    }
                } catch (error) {
                    context.logger.error(
                        `Error in subscription handler for '${subscriptionName}':`,
                        error
                    );
                    ackOrNack(error instanceof Error ? error : new Error(String(error)));
                }
            });

            // Set up error event handler with default logging
            subscription.on("error", error => {
                context.logger.warn(`Subscription error for '${subscriptionName}':`, error);
            });

            // Set up invalid_content event handler with default logging
            subscription.on("invalid_content", error => {
                context.logger.warn(
                    `Invalid content for subscription '${subscriptionName}':`,
                    error
                );
            });

            context.logger.info(
                `Successfully set up subscription handler for '${subscriptionName}'`
            );
        } catch (error) {
            context.logger.error(
                `Failed to set up subscription handler for '${subscriptionName}':`,
                error
            );
            throw error; // Re-throw to fail the pipeline
        }
    }

    context.logger.info(`Successfully set up ${subscriptionNames.length} subscription handlers`);
}
