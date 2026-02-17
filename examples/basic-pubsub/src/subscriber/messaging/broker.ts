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
 * Demonstrates withSubscriptions() to auto-wire handlers to queues.
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
                on_event: messageHandler,
            })
        )
        .build();

    return brokerInstance;
}
