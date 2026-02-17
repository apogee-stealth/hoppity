import { randomUUID } from "crypto";
import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { withDelayedPublish } from "@apogeelabs/hoppity-delayed-publish";
import { BrokerAsPromised } from "rascal";
import { config } from "../../shared/config";
import { logger } from "../../shared/logger";
import { withBasicServiceComms } from "../../shared/plugins/withBasicServiceComms";
import { delayedSchedulerTopology } from "./topology";

let brokerInstance: BrokerAsPromised | null = null;

/**
 * Singleton factory for the delayed scheduler broker.
 */
export async function getBroker(): Promise<BrokerAsPromised> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = await hoppity
        .withTopology(delayedSchedulerTopology)
        .use(withCustomLogger({ logger }))
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
