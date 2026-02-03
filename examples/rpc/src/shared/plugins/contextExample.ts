/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareFunction, MiddlewareResult, MiddlewareContext } from "@apogeelabs/hoppity";
import { BrokerConfig, BrokerAsPromised } from "rascal";

/**
 * Example middleware that demonstrates context usage.
 * This middleware sets up exchanges and shares their names via context.
 */
export const exchangeSetupMiddleware: MiddlewareFunction = (
    topology: BrokerConfig,
    context: MiddlewareContext
): MiddlewareResult => {
    console.log("🔧 [ExchangeSetup] Applying exchange setup middleware...");

    // Clone the topology to avoid mutations
    const modifiedTopology = structuredClone(topology);

    // Add exchanges to topology
    if (modifiedTopology.vhosts) {
        const vhostKey = Object.keys(modifiedTopology.vhosts)[0];
        if (vhostKey && modifiedTopology.vhosts[vhostKey]) {
            const vhost = modifiedTopology.vhosts[vhostKey];

            if (!vhost.exchanges) {
                vhost.exchanges = {};
            }

            // Add exchanges
            const exchangeNames = ["user-events", "order-events", "notification-events"];
            exchangeNames.forEach(name => {
                (vhost.exchanges as { [key: string]: any })[name] = {
                    type: "topic",
                    options: {
                        durable: true,
                    },
                };
            });

            // Share exchange information via context
            context.data.exchangeNames = exchangeNames;
            context.data.serviceName = "example-service";
            context.data.exchangeSetupComplete = true;

            console.log("🔧 [ExchangeSetup] Added exchanges and shared data via context:", {
                exchangeNames,
                serviceName: context.data.serviceName,
            });
        }
    }

    return {
        topology: modifiedTopology,
    };
};

/**
 * Example middleware that uses context from previous middleware.
 * This middleware sets up queues bound to exchanges created by the previous middleware.
 */
export const queueSetupMiddleware: MiddlewareFunction = (
    topology: BrokerConfig,
    context: MiddlewareContext
): MiddlewareResult => {
    console.log("🔧 [QueueSetup] Applying queue setup middleware...");

    // Check if required middleware has run
    if (!context.data.exchangeSetupComplete) {
        throw new Error(
            "exchangeSetupMiddleware must run before queueSetupMiddleware. " +
                "Available middleware: " +
                context.middlewareNames.join(", ")
        );
    }

    // Access data from previous middleware
    const exchangeNames = context.data.exchangeNames || [];
    const serviceName = context.data.serviceName;

    console.log("🔧 [QueueSetup] Using context data:", {
        exchangeNames,
        serviceName,
        previousMiddleware: context.middlewareNames,
    });

    // Clone the topology to avoid mutations
    const modifiedTopology = structuredClone(topology);

    // Add queues bound to the exchanges
    if (modifiedTopology.vhosts) {
        const vhostKey = Object.keys(modifiedTopology.vhosts)[0];
        if (vhostKey && modifiedTopology.vhosts[vhostKey]) {
            const vhost = modifiedTopology.vhosts[vhostKey];

            if (!vhost.queues) {
                vhost.queues = {};
            }

            if (!vhost.bindings) {
                vhost.bindings = {};
            }

            // Create queues for each exchange
            exchangeNames.forEach((exchangeName: string) => {
                const queueName = `${serviceName}-${exchangeName}-queue`;

                // Add queue
                (vhost.queues as { [key: string]: any })[queueName] = {
                    options: {
                        durable: true,
                    },
                };

                // Add binding
                const bindingKey = `${queueName}-binding`;
                (vhost.bindings as { [key: string]: any })[bindingKey] = {
                    source: exchangeName,
                    destination: queueName,
                    destinationType: "queue",
                    bindingKey: "#", // Topic wildcard
                };
            });

            // Share queue information via context
            context.data.queueNames = exchangeNames.map(
                (name: string) => `${serviceName}-${name}-queue`
            );
            context.data.queueSetupComplete = true;

            console.log("🔧 [QueueSetup] Added queues and bindings:", context.data.queueNames);
        }
    }

    return {
        topology: modifiedTopology,
        onBrokerCreated: async (broker: BrokerAsPromised) => {
            console.log("🔧 [QueueSetup] Broker created, setting up subscriptions...");

            try {
                // Use context data to set up subscriptions
                const queueNames = context.data.queueNames || [];

                for (const queueName of queueNames) {
                    const subscription = await broker.subscribe(queueName);

                    subscription.on("message", (message: any, content: any, ackOrNack: any) => {
                        console.log(`🔧 [QueueSetup] Received message on ${queueName}:`, {
                            routingKey: message.fields.routingKey,
                            content: content,
                            timestamp: new Date().toISOString(),
                        });
                        ackOrNack();
                    });

                    subscription.on("error", (err: any) => {
                        console.error(`❌ [QueueSetup] Subscription error for ${queueName}:`, err);
                    });
                }

                console.log("✅ [QueueSetup] All subscriptions set up successfully");
            } catch (error) {
                console.error("❌ [QueueSetup] Failed to setup subscriptions:", error);
            }
        },
    };
};
