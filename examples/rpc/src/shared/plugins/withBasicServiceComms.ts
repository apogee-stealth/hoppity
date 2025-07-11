/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareFunction, MiddlewareResult, MiddlewareContext } from "@apogeelabs/hoppity";
import { cloneDeep } from "lodash";
import { BrokerConfig, BrokerAsPromised, PublicationConfig, PublicationSession } from "rascal";

/**
 * Extended broker interface with basic service communication methods
 */
export interface BasicServiceComms extends BrokerAsPromised {
    publishToOutbound(
        message: any,
        overrides?: PublicationConfig | string
    ): Promise<PublicationSession>;
}

/**
 * Options for the withBasicServiceComms middleware factory
 */
export interface BasicServiceCommsOptions {
    /** The name of the service (used to create exchange names) */
    serviceName: string;
    /** The vhost(s) to create exchanges on (defaults to "/") */
    vhost?: string | string[];
}

/**
 * Middleware factory that adds basic service communication exchanges to the topology.
 * Creates inbound (topic) and outbound (fanout) exchanges for the specified service.
 *
 * @param options - Configuration options for the service communications
 * @returns A middleware function that adds the exchanges to the topology
 */
export const withBasicServiceComms = (options: BasicServiceCommsOptions): MiddlewareFunction => {
    // Validate required options
    if (
        !options.serviceName ||
        typeof options.serviceName !== "string" ||
        options.serviceName.trim() === ""
    ) {
        throw new Error(
            "withBasicServiceComms: serviceName is required and must be a non-empty string"
        );
    }

    const serviceName = options.serviceName.trim();
    const vhosts = Array.isArray(options.vhost) ? options.vhost : [options.vhost || "/"];

    return (topology: BrokerConfig, _context: MiddlewareContext): MiddlewareResult => {
        console.log(`🔧 [BasicServiceComms] Applying middleware for service: ${serviceName}`);

        // Clone the topology to avoid mutations
        const modifiedTopology = cloneDeep(topology);

        // Ensure vhosts exist in topology
        if (!modifiedTopology.vhosts) {
            modifiedTopology.vhosts = {};
        }

        // Add exchanges to each specified vhost
        vhosts.forEach(vhost => {
            if (!modifiedTopology.vhosts![vhost]) {
                modifiedTopology.vhosts![vhost] = {};
            }

            const vhostConfig = modifiedTopology.vhosts![vhost];

            if (!vhostConfig.exchanges) {
                vhostConfig.exchanges = {};
            }

            // Add inbound exchange (topic)
            const inboundExchangeName = `${serviceName}_inbound`;
            (vhostConfig.exchanges as { [key: string]: any })[inboundExchangeName] = {
                assert: true,
                type: "topic",
                options: {
                    durable: true,
                },
            };

            // Add outbound exchange (fanout)
            const outboundExchangeName = `${serviceName}_outbound`;
            (vhostConfig.exchanges as { [key: string]: any })[outboundExchangeName] = {
                assert: true,
                type: "fanout",
                options: {
                    durable: true,
                },
            };

            // Add generic service publication
            const publicationName = `${serviceName}_publication`;
            if (!vhostConfig.publications) {
                vhostConfig.publications = {};
            }
            (vhostConfig.publications as { [key: string]: any })[publicationName] = {
                exchange: outboundExchangeName,
            };

            console.log(
                `🔧 [BasicServiceComms] Added exchanges to vhost '${vhost}': ${inboundExchangeName}, ${outboundExchangeName}`
            );
        });

        // Return the modified topology and a callback to extend the broker
        return {
            topology: modifiedTopology,
            onBrokerCreated: async (broker: BrokerAsPromised) => {
                console.log(
                    `🔧 [BasicServiceComms] Extending broker with publishToOutbound method for service: ${serviceName}`
                );

                // Extend the broker with the publishToOutbound method
                Object.assign(broker, {
                    publishToOutbound: (
                        message: any,
                        overrides?: PublicationConfig | string
                    ): Promise<PublicationSession> => {
                        const publicationName = `${serviceName}_publication`;
                        return broker.publish(publicationName, message, overrides);
                    },
                });

                console.log(`✅ [BasicServiceComms] Broker extended with publishToOutbound method`);
            },
        };
    };
};
