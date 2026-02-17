import { BrokerConfig } from "rascal";
import { config } from "../../shared/config";

/**
 * RPC Initiator topology configuration.
 * Minimal topology — the RPC middleware adds the exchanges/queues it needs.
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
