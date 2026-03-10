import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { BrokerAsPromised } from "rascal";
import { logger } from "../../logger";
import { publisherTopology } from "./topology";

let brokerInstance: BrokerAsPromised | null = null;

/**
 * Singleton factory for the publisher broker.
 *
 * This is the minimal hoppity pipeline for a publisher:
 * 1. `withTopology()` — provide the Rascal topology (exchanges + publications)
 * 2. `use(withCustomLogger(...))` — swap in a custom logger so hoppity's
 *     internal pipeline logging goes through our logger instead of console
 * 3. `.build()` — run the middleware pipeline, create the Rascal broker,
 *     then execute any `onBrokerCreated` callbacks
 *
 * No `withSubscriptions` here because the publisher only sends messages.
 *
 * @returns The Rascal BrokerAsPromised instance, ready to publish
 */
export async function getBroker(): Promise<BrokerAsPromised> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = await hoppity
        .withTopology(publisherTopology)
        // withCustomLogger should be first — it replaces context.logger so
        // downstream middleware uses our logger for their internal logging.
        .use(withCustomLogger({ logger }))
        .build();

    return brokerInstance;
}
