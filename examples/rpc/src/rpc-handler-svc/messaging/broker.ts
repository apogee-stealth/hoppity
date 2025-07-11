import hoppity, { BrokerWithExtensions } from "@apogeelabs/hoppity";
import { RpcBroker, withRpcSupport } from "@apogeelabs/hoppity-rpc";
import { randomUUID } from "crypto";
import { config } from "../../shared/config";
import { BasicServiceComms, withBasicServiceComms } from "../../shared/plugins";
import { rpcHandlerTopology } from "./topology";

// Private broker instance for singleton pattern
let brokerInstance: BrokerWithExtensions<[BasicServiceComms, RpcBroker]> | null = null;

/**
 * Singleton factory to get the broker instance for the RPC handler service
 * Creates the broker on first call and returns the same instance on subsequent calls
 */
export async function getBroker(): Promise<BrokerWithExtensions<[BasicServiceComms, RpcBroker]>> {
    if (brokerInstance) {
        return brokerInstance;
    }

    // Build the hoppity broker with RPC support
    brokerInstance = (await hoppity
        .withTopology(rpcHandlerTopology)
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
