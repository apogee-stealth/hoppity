import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { withDelayedPublish } from "@apogeelabs/hoppity-delayed-publish";
import { withSubscriptions } from "@apogeelabs/hoppity-subscriptions";
import { randomUUID } from "crypto";
import { BrokerAsPromised } from "rascal";
import { config } from "../../shared/config";
import { logger } from "../../shared/logger";
import { withBasicServiceComms } from "../../shared/plugins/withBasicServiceComms";
import { subscriptionHandlers } from "./handlers";
import { delayedProcessorTopology } from "./topology";

let brokerInstance: BrokerAsPromised | null = null;

/**
 * Singleton factory for the delayed processor broker.
 */
export async function getBroker(): Promise<BrokerAsPromised> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = await hoppity
        .withTopology(delayedProcessorTopology)
        .use(withCustomLogger({ logger }))
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
