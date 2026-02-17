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
 */
export async function getBroker(): Promise<BrokerWithExtensions<[BasicServiceComms, RpcBroker]>> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = (await hoppity
        .withTopology(rpcHandlerTopology)
        .use(withCustomLogger({ logger }))
        .use(withBasicServiceComms({ serviceName: "rpc_handler_svc" }))
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
