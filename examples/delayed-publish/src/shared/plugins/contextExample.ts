/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareContext, MiddlewareFunction, MiddlewareResult } from "@apogeelabs/hoppity";
import { cloneDeep } from "lodash";
import { BrokerConfig } from "rascal";

/**
 * Example middleware that demonstrates context usage.
 * This middleware sets up exchanges and shares their names via context.
 */
export const withContextExample: MiddlewareFunction = (
    topology: BrokerConfig,
    context: MiddlewareContext
): MiddlewareResult => {
    context.logger.info("🔧 [ContextExample] Applying context example middleware...");

    // Clone the topology to avoid mutations
    const modifiedTopology = cloneDeep(topology);

    // Add exchanges to topology
    if (modifiedTopology.vhosts) {
        const vhostKey = Object.keys(modifiedTopology.vhosts)[0];
        if (vhostKey && modifiedTopology.vhosts[vhostKey]) {
            const vhost = modifiedTopology.vhosts[vhostKey];

            if (!vhost.exchanges) {
                vhost.exchanges = {};
            }

            // Add exchanges
            const exchangeNames = ["delayed-events", "processed-events", "notification-events"];
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
            context.data.serviceName = "delayed-example-service";
            context.data.contextExampleComplete = true;

            context.logger.debug(
                "🔧 [ContextExample] Added exchanges and shared data via context:",
                {
                    exchangeNames,
                    serviceName: context.data.serviceName,
                }
            );
        }
    }

    return {
        topology: modifiedTopology,
    };
};
