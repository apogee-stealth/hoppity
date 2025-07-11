import { BrokerConfig } from "rascal";
import { config } from "../../shared/config";

/**
 * RPC Initiator topology configuration.
 * This service will make RPC calls to the RPC Handler Service.
 */
export const rpcInitiatorTopology: BrokerConfig = {
    vhosts: {
        [config.rabbitMQ.vhost]: {
            connection: {
                url: config.rabbitMQ.url,
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
