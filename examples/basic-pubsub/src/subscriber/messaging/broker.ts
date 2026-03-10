import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { withSubscriptions } from "@apogeelabs/hoppity-subscriptions";
import { BrokerAsPromised } from "rascal";
import { logger } from "../../logger";
import { messageHandler } from "./handlers/messageHandler";
import { subscriberTopology } from "./topology";

let brokerInstance: BrokerAsPromised | null = null;

/**
 * Singleton factory for the subscriber broker.
 *
 * This demonstrates the full hoppity pipeline for a consumer:
 * 1. `withTopology()` — provide the Rascal topology (exchange, queue, binding, subscription)
 * 2. `use(withCustomLogger(...))` — inject custom logger (runs first so downstream
 *     middleware logs through it)
 * 3. `use(withSubscriptions(...))` — map subscription names to handler functions.
 *     This must be last because it validates handler keys against the finalized topology.
 * 4. `.build()` — run middleware, create the broker, then wire up subscriptions
 *
 * Middleware order matters:
 * - `withCustomLogger` first: replaces the default logger on `context.logger`
 * - `withSubscriptions` last: needs the final topology to validate handler keys
 *
 * @returns The Rascal BrokerAsPromised instance, already consuming from its subscriptions
 */
export async function getBroker(): Promise<BrokerAsPromised> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = await hoppity
        .withTopology(subscriberTopology)
        .use(withCustomLogger({ logger }))
        .use(
            withSubscriptions({
                // Keys must match subscription names in the topology.
                // "on_event" maps to the subscription defined in topology.ts.
                on_event: messageHandler,
            })
        )
        .build();

    return brokerInstance;
}
