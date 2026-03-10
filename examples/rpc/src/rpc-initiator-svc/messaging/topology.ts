import { BrokerConfig } from "rascal";
import { config } from "../../shared/config";

/**
 * Base Rascal topology for the RPC initiator service.
 *
 * Same minimal pattern as the handler — just connection details. The
 * middleware pipeline adds all AMQP infrastructure (exchanges, queues,
 * bindings, publications, subscriptions).
 *
 * @see {@link ../../../rpc-handler-svc/messaging/topology.ts} for the handler equivalent
 */
export const rpcInitiatorTopology: BrokerConfig = {
    vhosts: {
        [config.rabbitmq.vhost]: {
            connection: {
                url: config.rabbitmq.url,
                options: {
                    heartbeat: 10,
                },
                retry: {
                    factor: 2,
                    min: 1000,
                    max: 5000,
                },
            },
        },
    },
};
