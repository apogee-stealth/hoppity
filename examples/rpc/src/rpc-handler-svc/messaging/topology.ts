import { BrokerConfig } from "rascal";
import { config } from "../../shared/config";

/**
 * RPC Handler topology configuration.
 * This service will handle RPC requests from the RPC Initiator Service.
 */
export const rpcHandlerTopology: BrokerConfig = {
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
