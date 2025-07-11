import { randomUUID } from "crypto";
import hoppity from "@apogeelabs/hoppity";
import { withDelayedPublish } from "@apogeelabs/hoppity-delayed-publish";
import { delayedSchedulerTopology } from "./topology";
import { withBasicServiceComms } from "../../shared/plugins/withBasicServiceComms";
import { config } from "../../shared/config";
import { BrokerAsPromised } from "rascal";

// Private broker instance for singleton pattern
let brokerInstance: BrokerAsPromised | null = null;

/**
 * Singleton factory to get the broker instance for the delayed scheduler service
 * Creates the broker on first call and returns the same instance on subsequent calls
 */
export async function getBroker(): Promise<BrokerAsPromised> {
    if (brokerInstance) {
        return brokerInstance;
    }

    // Build the hoppity broker with delayed publish support
    brokerInstance = await hoppity
        .withTopology(delayedSchedulerTopology)
        .use(withBasicServiceComms({ serviceName: "delayed_scheduler_svc" }))
        .use(
            withDelayedPublish({
                serviceName: "delayed_scheduler_svc",
                instanceId: randomUUID(),
                defaultDelay: config.delayed.defaultDelay,
            })
        )
        .build();

    return brokerInstance;
}
