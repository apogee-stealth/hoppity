/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from "@apogeelabs/hoppity";
import { randomUUID } from "crypto";
import { BrokerAsPromised, PublicationConfig } from "rascal";
import { RpcBroker, RpcErrorCode, RpcMiddlewareOptions, RpcRequest, RpcResponse } from "./types";
import { createCorrelationManager } from "./utils/createCorrelationManager";
import {
    generateInboundQueueName,
    generateReplyQueueName,
    generateRpcRoutingKey,
} from "./utils/queueNaming";

/**
 * Sets up RPC functionality on a broker instance
 * This function extends the broker with RPC methods and sets up subscriptions
 *
 * @param broker - The broker instance to extend
 * @param options - RPC configuration options
 * @param logger - Optional logger instance for RPC operations
 * @returns Promise that resolves when setup is complete
 */
export async function setupRpcBroker(
    broker: BrokerAsPromised,
    options: RpcMiddlewareOptions,
    logger: Logger
): Promise<void> {
    const { serviceName, instanceId, rpcExchange, defaultTimeout = 30_000 } = options;

    // Integrate CorrelationManager for request tracking
    const correlationManager = createCorrelationManager();

    // Store RPC handlers
    const rpcHandlers = new Map<string, (request: any) => Promise<any>>();

    // Generate queue names
    const replyQueueName = generateReplyQueueName(serviceName, instanceId);
    const inboundQueueName = generateInboundQueueName(serviceName, instanceId);

    // Set up reply queue subscription for handling responses
    const replySubscription = await broker.subscribe(`${replyQueueName}_subscription`);

    replySubscription.on("message", (message, content, ackOrNack) => {
        try {
            const response = content as RpcResponse;
            const correlationId = response.correlationId;

            if (response.error) {
                correlationManager.rejectRequest(correlationId, new Error(response.error.message));
            } else {
                correlationManager.resolveRequest(correlationId, response.payload);
            }

            ackOrNack();
        } catch (error) {
            logger.error("Error processing RPC response:", error);
            ackOrNack(error instanceof Error ? error : new Error(String(error)));
        }
    });

    replySubscription.on("error", err => {
        logger.error("Reply subscription error:", err);
    });

    // Set up inbound queue subscription for handling RPC requests
    const inboundSubscription = await broker.subscribe(`${inboundQueueName}_subscription`);

    inboundSubscription.on("message", async (message, content, ackOrNack) => {
        try {
            const request = content as RpcRequest;
            const rpcName = request.rpcName;
            const correlationId = request.correlationId;

            const handler = rpcHandlers.get(rpcName);
            const responsePublicationName = "rpc_reply";
            if (!handler) {
                logger.warn("No handler found for RPC method:", rpcName);
                // Send error response for unknown RPC method
                await broker.publish(
                    responsePublicationName,
                    {
                        correlationId,
                        error: {
                            code: RpcErrorCode.METHOD_NOT_FOUND,
                            message: `RPC method '${rpcName}' not found`,
                        },
                    },
                    {
                        routingKey: request.replyTo,
                        options: { mandatory: false },
                    }
                );
                ackOrNack();
                return;
            }

            try {
                const result = await handler(request.payload);
                logger.debug("Publishing response for RPC method:", {
                    rpcName,
                    replyTo: request.replyTo,
                    responsePublicationName,
                });
                await broker.publish(
                    responsePublicationName,
                    {
                        correlationId,
                        payload: result,
                    },
                    {
                        routingKey: request.replyTo,
                        options: { mandatory: false },
                    }
                );
                ackOrNack();
            } catch (handlerError) {
                logger.error("Publishing error response for RPC method:", {
                    rpcName,
                    replyTo: request.replyTo,
                    responsePublicationName,
                });
                await broker.publish(
                    responsePublicationName,
                    {
                        correlationId,
                        error: {
                            code: RpcErrorCode.HANDLER_ERROR,
                            message:
                                handlerError instanceof Error
                                    ? handlerError.message
                                    : "Unknown error",
                        },
                    },
                    {
                        routingKey: request.replyTo,
                        options: { mandatory: false },
                    }
                );
                ackOrNack();
            }
        } catch (error) {
            logger.error("Error processing RPC request:", error);
            ackOrNack(error instanceof Error ? error : new Error(String(error)));
        }
    });

    inboundSubscription.on("error", err => {
        logger.error("Inbound subscription error:", err);
    });

    // Implement the request method
    (broker as RpcBroker).request = async function request<TRequest = any, TResponse = any>(
        rpcName: string,
        message: TRequest,
        overrides?: PublicationConfig
    ): Promise<TResponse> {
        const correlationId = randomUUID();

        const requestPromise = correlationManager.addRequest(correlationId, defaultTimeout);

        await broker.publish(
            "rpc_request",
            {
                correlationId,
                rpcName,
                payload: message,
                replyTo: replyQueueName,
                headers: {
                    "service-name": serviceName,
                    "instance-id": instanceId,
                    rpc_name: rpcName,
                },
            },
            {
                exchange: rpcExchange,
                routingKey: generateRpcRoutingKey(rpcName),
                options: {
                    mandatory: true,
                    persistent: false,
                },
                ...overrides,
            }
        );

        return requestPromise;
    };

    // Implement the addRpcListener method
    (broker as RpcBroker).addRpcListener = function addRpcListener<TRequest = any, TResponse = any>(
        rpcName: string,
        handler: (request: TRequest) => Promise<TResponse>
    ): void {
        rpcHandlers.set(rpcName, handler);
        logger.info(`🔧 [RpcBroker] Registered RPC handler: ${rpcName}`);
    };

    (broker as RpcBroker).cancelRequest = (correlationId: string): boolean => {
        return correlationManager.cancelRequest(correlationId);
    };

    // Store the correlationManager on the broker for later use (not public API)
    (broker as any).__hoppityRpcCorrelationManager = correlationManager;

    // Cleanup on broker shutdown
    const originalShutdown = broker.shutdown.bind(broker);
    broker.shutdown = async () => {
        correlationManager.cleanup();
        await originalShutdown();
    };

    logger.info(`✅ [RpcBroker] RPC broker setup complete for service: ${serviceName}`);
}
