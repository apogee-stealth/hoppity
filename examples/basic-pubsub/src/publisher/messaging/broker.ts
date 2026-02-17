import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { BrokerAsPromised } from "rascal";
import { logger } from "../../logger";
import { publisherTopology } from "./topology";

let brokerInstance: BrokerAsPromised | null = null;

/**
 * Singleton factory for the publisher broker.
 */
export async function getBroker(): Promise<BrokerAsPromised> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = await hoppity
        .withTopology(publisherTopology)
        .use(withCustomLogger({ logger }))
        .build();

    return brokerInstance;
}
