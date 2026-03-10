import hoppity, { BrokerWithExtensions } from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { RpcBroker, withRpcSupport } from "@apogeelabs/hoppity-rpc";
import { randomUUID } from "crypto";
import { config } from "../../shared/config";
import { logger } from "../../shared/logger";
import { BasicServiceComms, withBasicServiceComms } from "../../shared/plugins";
import { rpcInitiatorTopology } from "./topology";

let brokerInstance: BrokerWithExtensions<[BasicServiceComms, RpcBroker]> | null = null;

/**
 * Singleton factory for the RPC initiator broker.
 *
 * The middleware pipeline is identical to the handler's, but with a different
 * `serviceName`. Both services need `withRpcSupport` — the initiator for its
 * reply queue (where responses arrive) and the handler for its inbound queue
 * (where requests arrive). The shared `rpcExchange` is how they find each other.
 *
 * @see {@link ../../../rpc-handler-svc/messaging/broker.ts} for the handler equivalent
 */
export async function getBroker(): Promise<BrokerWithExtensions<[BasicServiceComms, RpcBroker]>> {
    if (brokerInstance) {
        return brokerInstance;
    }

    brokerInstance = (await hoppity
        .withTopology(rpcInitiatorTopology)
        // Inject our custom logger first — downstream middleware will use it
        .use(withCustomLogger({ logger }))
        // Add standard service exchanges (inbound topic + outbound fanout)
        .use(withBasicServiceComms({ serviceName: "rpc_initiator_svc" }))
        // Add RPC infrastructure. The instanceId ensures each running process
        // gets its own exclusive reply queue, so multiple instances of the same
        // service don't steal each other's responses.
        .use(
            withRpcSupport({
                serviceName: "rpc_initiator_svc",
                instanceId: randomUUID(),
                rpcExchange: config.service.rpcExchange,
                defaultTimeout: 10000,
            })
        )
        .build()) as BrokerWithExtensions<[BasicServiceComms, RpcBroker]>;

    return brokerInstance;
}
