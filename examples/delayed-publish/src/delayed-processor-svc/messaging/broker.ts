import hoppity from "@apogeelabs/hoppity";
import { withDelayedPublish } from "@apogeelabs/hoppity-delayed-publish";
import { withSubscriptions } from "@apogeelabs/hoppity-subscriptions";
import { randomUUID } from "crypto";
import { BrokerAsPromised } from "rascal";
import { config } from "../../shared/config";
import { withBasicServiceComms } from "../../shared/plugins/withBasicServiceComms";
import { subscriptionHandlers } from "./handlers";
import { delayedProcessorTopology } from "./topology";

// Private broker instance for singleton pattern
let brokerInstance: BrokerAsPromised | null = null;

/**
 * Singleton factory to get the broker instance for the delayed processor service
 * Creates the broker on first call and returns the same instance on subsequent calls
 */
export async function getBroker(): Promise<BrokerAsPromised> {
    if (brokerInstance) {
        return brokerInstance;
    }

    // Build the hoppity broker with delayed publish support
    brokerInstance = await hoppity
        .withTopology(delayedProcessorTopology)
        .use(withBasicServiceComms({ serviceName: "delayed_processor_svc" }))
        .use(
            withDelayedPublish({
                serviceName: "delayed_processor_svc",
                instanceId: randomUUID(),
                defaultDelay: config.delayed.defaultDelay,
            })
        )
        .use(withSubscriptions(subscriptionHandlers))
        .build();

    return brokerInstance;
}
