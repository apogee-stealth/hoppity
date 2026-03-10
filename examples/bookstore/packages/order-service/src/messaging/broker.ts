import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { withOutboundExchange } from "@apogeelabs/hoppity-contracts";
import { withOperations } from "@apogeelabs/hoppity-operations";
import type { OperationsBroker } from "@apogeelabs/hoppity-operations";
import { randomUUID } from "crypto";
import { logger } from "../logger";
import { topology } from "./topology";
import { createOrderHandler } from "./handlers/createOrder";
import { getOrderSummaryHandler } from "./handlers/getOrderSummary";
import { cancelOrderHandler } from "./handlers/cancelOrder";

let brokerInstance: OperationsBroker | null = null;

/**
 * Singleton factory for the order-service broker.
 *
 * Middleware stack:
 *  1. withCustomLogger — ensures all downstream middleware uses the service logger
 *  2. withOutboundExchange — routes all publications through order-service's fanout
 *     exchange so the runner can tap all outbound traffic for audit/observation
 *  3. withOperations — wires typed handlers and extends broker with publishEvent etc.
 */
export async function getBroker(): Promise<OperationsBroker> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = (await hoppity
        .withTopology(topology)
        .use(withCustomLogger({ logger }))
        .use(withOutboundExchange("order-service"))
        .use(
            withOperations({
                serviceName: "order-service",
                instanceId: randomUUID(),
                handlers: [createOrderHandler, getOrderSummaryHandler, cancelOrderHandler],
            })
        )
        .build()) as OperationsBroker;

    return brokerInstance;
}
