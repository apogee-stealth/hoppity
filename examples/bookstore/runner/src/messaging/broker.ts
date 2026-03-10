import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { withOperations } from "@apogeelabs/hoppity-operations";
import type { OperationsBroker } from "@apogeelabs/hoppity-operations";
import { withSubscriptions } from "@apogeelabs/hoppity-subscriptions";
import { logger } from "../logger";
import { topology, RUNNER_INSTANCE_ID, TAP_QUEUE_NAME } from "./topology";
import { tapHandler } from "./tapHandler";

let brokerInstance: OperationsBroker | null = null;

/**
 * Singleton factory for the runner broker.
 *
 * Middleware stack:
 *  1. withCustomLogger — ensures all downstream middleware uses the runner logger
 *  2. withOperations — extends broker with request(), sendCommand() etc.
 *     The runner has no inbound handlers, but the topology was pre-augmented with
 *     reply infrastructure so wireRpcOutbound can subscribe successfully.
 *  3. withSubscriptions — wires the outbound tap handler for the fanout tap queue
 */
export async function getBroker(): Promise<OperationsBroker> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = (await hoppity
        .withTopology(topology)
        .use(withCustomLogger({ logger }))
        .use(
            withOperations({
                serviceName: "runner",
                instanceId: RUNNER_INSTANCE_ID,
                handlers: [],
            })
        )
        .use(withSubscriptions({ [TAP_QUEUE_NAME]: tapHandler }))
        .build()) as OperationsBroker;

    return brokerInstance;
}
