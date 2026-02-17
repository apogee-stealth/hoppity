/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareFunction, MiddlewareResult, MiddlewareContext } from "@apogeelabs/hoppity";
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

    return (topology: BrokerConfig, context: MiddlewareContext): MiddlewareResult => {
        context.logger.debug(
            `[BasicServiceComms] Applying middleware for service: ${serviceName}`
        );

        const modifiedTopology = structuredClone(topology);

        if (!modifiedTopology.vhosts) {
            modifiedTopology.vhosts = {};
        }

        vhosts.forEach((vhost) => {
            if (!modifiedTopology.vhosts![vhost]) {
                modifiedTopology.vhosts![vhost] = {};
            }

            const vhostConfig = modifiedTopology.vhosts![vhost];

            if (!vhostConfig.exchanges) {
                vhostConfig.exchanges = {};
            }

            const inboundExchangeName = `${serviceName}_inbound`;
            (vhostConfig.exchanges as { [key: string]: any })[inboundExchangeName] = {
                assert: true,
                type: "topic",
                options: {
                    durable: true,
                },
            };

            const outboundExchangeName = `${serviceName}_outbound`;
            (vhostConfig.exchanges as { [key: string]: any })[outboundExchangeName] = {
                assert: true,
                type: "fanout",
                options: {
                    durable: true,
                },
            };

            const publicationName = `${serviceName}_publication`;
            if (!vhostConfig.publications) {
                vhostConfig.publications = {};
            }
            (vhostConfig.publications as { [key: string]: any })[publicationName] = {
                exchange: outboundExchangeName,
            };

            context.logger.debug(
                `[BasicServiceComms] Added exchanges to vhost '${vhost}': ${inboundExchangeName}, ${outboundExchangeName}`
            );
        });

        return {
            topology: modifiedTopology,
            onBrokerCreated: async (broker: BrokerAsPromised) => {
                context.logger.debug(
                    `[BasicServiceComms] Extending broker with publishToOutbound for service: ${serviceName}`
                );

                Object.assign(broker, {
                    publishToOutbound: (
                        message: any,
                        overrides?: PublicationConfig | string
                    ): Promise<PublicationSession> => {
                        const publicationName = `${serviceName}_publication`;
                        return broker.publish(publicationName, message, overrides);
                    },
                });

                context.logger.debug(
                    `[BasicServiceComms] Broker extended with publishToOutbound method`
                );
            },
        };
    };
};
