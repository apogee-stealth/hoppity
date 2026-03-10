import hoppity, { BrokerWithExtensions } from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { RpcBroker, withRpcSupport } from "@apogeelabs/hoppity-rpc";
import { randomUUID } from "crypto";
import { config } from "../../shared/config";
import { logger } from "../../shared/logger";
import { BasicServiceComms, withBasicServiceComms } from "../../shared/plugins";
import { rpcHandlerTopology } from "./topology";

let brokerInstance: BrokerWithExtensions<[BasicServiceComms, RpcBroker]> | null = null;

/**
 * Singleton factory for the RPC handler broker.
 *
 * The middleware pipeline order matters:
 * 1. `withCustomLogger` — first, so all subsequent middleware uses our logger
 * 2. `withBasicServiceComms` — adds inbound/outbound exchanges for the service
 * 3. `withRpcSupport` — adds the RPC exchange, reply queue, inbound queue,
 *    bindings, and publications needed for request/response messaging
 *
 * The `BrokerWithExtensions<[BasicServiceComms, RpcBroker]>` cast tells
 * TypeScript the broker has methods from both middleware: `publishToOutbound`
 * from BasicServiceComms and `request`/`addRpcListener` from RpcBroker.
 */
export async function getBroker(): Promise<BrokerWithExtensions<[BasicServiceComms, RpcBroker]>> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = (await hoppity
        .withTopology(rpcHandlerTopology)
        // Inject our custom logger first — downstream middleware will use it
        .use(withCustomLogger({ logger }))
        // Add standard service exchanges (inbound topic + outbound fanout)
        .use(withBasicServiceComms({ serviceName: "rpc_handler_svc" }))
        // Add RPC infrastructure: exchange, queues, bindings, and broker methods.
        // instanceId is a random UUID so each process gets its own exclusive queues.
        .use(
            withRpcSupport({
                serviceName: "rpc_handler_svc",
                instanceId: randomUUID(),
                rpcExchange: config.service.rpcExchange,
                defaultTimeout: 10000,
            })
        )
        .build()) as BrokerWithExtensions<[BasicServiceComms, RpcBroker]>;

    return brokerInstance;
}
