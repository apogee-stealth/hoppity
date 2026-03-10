import { BrokerConfig } from "rascal";
import { config } from "../../shared/config";

/**
 * Base Rascal topology for the RPC handler service.
 *
 * This is intentionally minimal — just a vhost with connection details.
 * The hoppity middleware pipeline adds everything else:
 * - `withBasicServiceComms` adds the service's inbound/outbound exchanges
 * - `withRpcSupport` adds the RPC exchange, reply/inbound queues, bindings,
 *   subscriptions, and publications
 *
 * This pattern keeps the base topology clean and lets middleware compose
 * the full AMQP infrastructure declaratively.
 */
export const rpcHandlerTopology: BrokerConfig = {
    vhosts: {
        [config.rabbitmq.vhost]: {
            connection: {
                url: config.rabbitmq.url,
                options: {
                    // AMQP heartbeat interval (seconds). Detects dead connections
                    // faster than the TCP default.
                    heartbeat: 10,
                },
                retry: {
                    // Exponential backoff for reconnection attempts
                    factor: 2,
                    min: 1000,
                    max: 5000,
                },
            },
        },
    },
};
