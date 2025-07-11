/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareContext, MiddlewareFunction, MiddlewareResult } from "@apogeelabs/hoppity";
import { cloneDeep } from "lodash";
import { BrokerConfig } from "rascal";
import { setupRpcBroker } from "./setupRpcBroker";
import { RpcMiddlewareOptions } from "./types";
import {
    generateInboundQueueName,
    generateReplyQueueName,
    generateServiceRpcBindingPattern,
} from "./utils/queueNaming";

/**
 * Middleware factory that adds RPC capabilities to a hoppity broker
 *
 * This middleware:
 * 1. Adds an RPC exchange to the topology
 * 2. Creates reply and inbound queues for the service
 * 3. Sets up bindings and subscriptions
 * 4. Extends the broker with RPC methods (request, addRpcListener, cancelRequest)
 *
 * @param options - Configuration options for the RPC middleware
 * @returns A middleware function that can be used with hoppity
 */
export const withRpcSupport = (options: RpcMiddlewareOptions): MiddlewareFunction => {
    // Validate required options
    if (!options.serviceName?.trim()) {
        throw new Error("withRpcSupport: serviceName is required and must be a non-empty string");
    }
    if (!options.instanceId?.trim()) {
        throw new Error("withRpcSupport: instanceId is required and must be a non-empty string");
    }
    if (options.rpcExchange !== undefined && !options.rpcExchange.trim()) {
        throw new Error("withRpcSupport: rpcExchange must be a non-empty string when provided");
    }

    const { serviceName, instanceId, rpcExchange = "rpc_requests" } = options;

    return (topology: BrokerConfig, context: MiddlewareContext): MiddlewareResult => {
        context.logger.info(`[RpcSupport] Applying RPC middleware for service: ${serviceName}`);
        context.logger.debug(
            `[RpcSupport] Previous middleware: ${context.middlewareNames.join(", ") || "none"}`
        );

        // Check for existing RPC configuration to avoid conflicts
        if (context.data.rpcConfig) {
            context.logger.warn(
                `[RpcSupport] Warning: RPC configuration already exists in context from previous middleware`
            );
            context.logger.warn(`[RpcSupport] Existing config:`, context.data.rpcConfig);
        }

        // Store RPC configuration in context for other middleware to use
        context.data.rpcConfig = {
            serviceName,
            instanceId,
            rpcExchange,
            replyQueueName: generateReplyQueueName(serviceName, instanceId),
            inboundQueueName: generateInboundQueueName(serviceName, instanceId),
        };

        // Clone the topology to avoid mutations
        const modifiedTopology = cloneDeep(topology);

        // Ensure vhosts exist in topology
        if (!modifiedTopology.vhosts) {
            modifiedTopology.vhosts = {};
        }

        // Add RPC infrastructure to each vhost
        Object.keys(modifiedTopology.vhosts).forEach(vhostKey => {
            const vhost = modifiedTopology.vhosts![vhostKey];

            // Add RPC exchange
            if (!vhost.exchanges) {
                vhost.exchanges = {};
            }
            (vhost.exchanges as any)[rpcExchange] = {
                type: "topic",
                options: {
                    durable: true,
                },
            };

            // Add reply queue
            if (!vhost.queues) {
                vhost.queues = {};
            }
            const replyQueueName = generateReplyQueueName(serviceName, instanceId);
            (vhost.queues as any)[replyQueueName] = {
                options: {
                    exclusive: true,
                    autoDelete: true,
                },
            };

            // Add inbound queue
            const inboundQueueName = generateInboundQueueName(serviceName, instanceId);
            (vhost.queues as any)[inboundQueueName] = {
                options: {
                    exclusive: true,
                    autoDelete: true,
                },
            };

            // Add bindings
            if (!vhost.bindings) {
                vhost.bindings = {};
            }
            (vhost.bindings as any)[`${inboundQueueName}_binding`] = {
                source: rpcExchange,
                destination: inboundQueueName,
                destinationType: "queue",
                bindingKey: generateServiceRpcBindingPattern(serviceName),
            };

            // Add subscriptions
            if (!vhost.subscriptions) {
                vhost.subscriptions = {};
            }
            (vhost.subscriptions as any)[`${inboundQueueName}_subscription`] = {
                queue: inboundQueueName,
                options: {
                    prefetch: 1,
                },
            };
            (vhost.subscriptions as any)[`${replyQueueName}_subscription`] = {
                queue: replyQueueName,
                options: {
                    prefetch: 1,
                },
            };

            // Add service rpc publications
            const requestPublicationName = `rpc_request`;
            if (!vhost.publications) {
                vhost.publications = {};
            }
            (vhost.publications as any)[requestPublicationName] = {
                exchange: rpcExchange,
            };

            // RPC reply publication using RabbitMQ's default exchange
            // The default exchange (empty string "") is a direct exchange that routes messages
            // to queues whose names match the routing key. In RPC patterns, the replyTo field
            // from the original request contains the name of the temporary reply queue created
            // by the requesting service. By using "{{replyTo}}" as the routing key, messages
            // are automatically routed to the correct reply queue for each RPC request.
            (vhost.publications as any)["rpc_reply"] = {
                exchange: "", // Default direct exchange
                routingKey: "{{replyTo}}",
                options: {
                    persistent: false,
                },
            };

            context.logger.debug(`[RpcSupport] Added RPC infrastructure to vhost '${vhostKey}':`);
            context.logger.debug(`  - Exchange: ${rpcExchange}`);
            context.logger.debug(`  - Reply queue: ${replyQueueName}`);
            context.logger.debug(`  - Inbound queue: ${inboundQueueName}`);
            context.logger.debug(`  - Request publication: ${requestPublicationName}`);
            context.logger.debug(`  - Response publication: rpc_reply`);
        });

        // Return the modified topology and a callback for post-broker-creation setup
        return {
            topology: modifiedTopology,
            onBrokerCreated: async broker => {
                await setupRpcBroker(broker, options, context.logger);
            },
        };
    };
};
