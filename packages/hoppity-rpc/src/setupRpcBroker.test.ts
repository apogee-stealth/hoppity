/* eslint-disable @typescript-eslint/no-explicit-any */
export default {};

const mockRandomUUID = jest.fn();
jest.mock("crypto", () => {
    return {
        randomUUID: mockRandomUUID,
    };
});

const mockCreateCorrelationManager = jest.fn();
jest.mock("./utils/createCorrelationManager", () => {
    return {
        createCorrelationManager: mockCreateCorrelationManager,
    };
});

const mockGenerateInboundQueueName = jest.fn();
const mockGenerateReplyQueueName = jest.fn();
const mockGenerateRpcRoutingKey = jest.fn();
jest.mock("./utils/queueNaming", () => {
    return {
        generateInboundQueueName: mockGenerateInboundQueueName,
        generateReplyQueueName: mockGenerateReplyQueueName,
        generateRpcRoutingKey: mockGenerateRpcRoutingKey,
    };
});

import { PublicationConfig } from "rascal";
import { RpcErrorCode, RpcMiddlewareOptions, RpcRequest, RpcResponse } from "./types";

describe("hoppity-rpc > src > setupRpcBroker", () => {
    let mockBroker: any,
        mockLogger: any,
        mockCorrelationManager: any,
        mockReplySubscription: any,
        mockInboundSubscription: any,
        options: RpcMiddlewareOptions;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockRandomUUID.mockReturnValue("CORRELATION_ID");
        mockGenerateReplyQueueName.mockReturnValue("REPLY_QUEUE_NAME");
        mockGenerateInboundQueueName.mockReturnValue("INBOUND_QUEUE_NAME");
        mockGenerateRpcRoutingKey.mockReturnValue("RPC_ROUTING_KEY");
        mockCorrelationManager = {
            addRequest: jest.fn().mockResolvedValue("RESPONSE"),
            resolveRequest: jest.fn().mockReturnValue(true),
            rejectRequest: jest.fn().mockReturnValue(true),
            cancelRequest: jest.fn().mockReturnValue(true),
            cleanup: jest.fn(),
        };
        mockCreateCorrelationManager.mockReturnValue(mockCorrelationManager);
        mockReplySubscription = {
            on: jest.fn(),
        };
        mockInboundSubscription = {
            on: jest.fn(),
        };
        mockBroker = {
            subscribe: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
            shutdown: jest.fn().mockResolvedValue(undefined),
        };
        mockLogger = {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        options = {
            serviceName: "TEST_SERVICE",
            instanceId: "TEST_INSTANCE",
            rpcExchange: "TEST_RPC_EXCHANGE",
            defaultTimeout: 45_000,
        };
    });

    describe("when calling setupRpcBroker", () => {
        beforeEach(async () => {
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
        });

        it("should call createCorrelationManager", () => {
            expect(mockCreateCorrelationManager).toHaveBeenCalledTimes(1);
        });

        it("should call generateReplyQueueName with the expected args", () => {
            expect(mockGenerateReplyQueueName).toHaveBeenCalledWith(
                "TEST_SERVICE",
                "TEST_INSTANCE"
            );
        });

        it("should call generateInboundQueueName with the expected args", () => {
            expect(mockGenerateInboundQueueName).toHaveBeenCalledWith(
                "TEST_SERVICE",
                "TEST_INSTANCE"
            );
        });

        it("should subscribe to the reply queue", () => {
            expect(mockBroker.subscribe).toHaveBeenNthCalledWith(
                1,
                "REPLY_QUEUE_NAME_subscription"
            );
        });

        it("should subscribe to the inbound queue", () => {
            expect(mockBroker.subscribe).toHaveBeenNthCalledWith(
                2,
                "INBOUND_QUEUE_NAME_subscription"
            );
        });

        it("should set up reply subscription message handler", () => {
            expect(mockReplySubscription.on).toHaveBeenCalledWith("message", expect.any(Function));
        });

        it("should set up reply subscription error handler", () => {
            expect(mockReplySubscription.on).toHaveBeenCalledWith("error", expect.any(Function));
        });

        it("should set up inbound subscription message handler", () => {
            expect(mockInboundSubscription.on).toHaveBeenCalledWith(
                "message",
                expect.any(Function)
            );
        });

        it("should set up inbound subscription error handler", () => {
            expect(mockInboundSubscription.on).toHaveBeenCalledWith("error", expect.any(Function));
        });

        it("should extend the broker with request method", () => {
            expect(mockBroker.request).toBeDefined();
        });

        it("should extend the broker with addRpcListener method", () => {
            expect(mockBroker.addRpcListener).toBeDefined();
        });

        it("should extend the broker with cancelRequest method", () => {
            expect(mockBroker.cancelRequest).toBeDefined();
        });

        it("should store correlationManager on broker", () => {
            expect(mockBroker.__hoppityRpcCorrelationManager).toBe(mockCorrelationManager);
        });

        it("should override broker shutdown method", () => {
            expect(mockBroker.shutdown).toBeDefined();
        });

        it("should log completion message", () => {
            expect(mockLogger.info).toHaveBeenCalledWith(
                "✅ [RpcBroker] RPC broker setup complete for service: TEST_SERVICE"
            );
        });
    });

    describe("with the reply subscription message handler", () => {
        let messageHandler: any, ackOrNack: any;

        beforeEach(async () => {
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            messageHandler = mockReplySubscription.on.mock.calls.find(
                (call: any) => call[0] === "message"
            )[1];
            ackOrNack = jest.fn();
        });

        describe("when processing a successful response", () => {
            let content: RpcResponse;

            beforeEach(() => {
                content = {
                    correlationId: "CORRELATION_ID",
                    payload: "RESPONSE_PAYLOAD",
                };
                messageHandler({}, content, ackOrNack);
            });

            it("should call correlationManager.resolveRequest", () => {
                expect(mockCorrelationManager.resolveRequest).toHaveBeenCalledWith(
                    "CORRELATION_ID",
                    "RESPONSE_PAYLOAD"
                );
            });

            it("should call ackOrNack", () => {
                expect(ackOrNack).toHaveBeenCalledTimes(1);
            });
        });

        describe("when processing an error response", () => {
            let content: RpcResponse;

            beforeEach(() => {
                content = {
                    correlationId: "CORRELATION_ID",
                    error: {
                        code: RpcErrorCode.HANDLER_ERROR,
                        message: "ERROR_MESSAGE",
                    },
                };
                messageHandler({}, content, ackOrNack);
            });

            it("should call correlationManager.rejectRequest", () => {
                expect(mockCorrelationManager.rejectRequest).toHaveBeenCalledWith(
                    "CORRELATION_ID",
                    expect.any(Error)
                );
            });

            it("should call ackOrNack", () => {
                expect(ackOrNack).toHaveBeenCalledTimes(1);
            });
        });

        describe("when processing throws an error", () => {
            let error: any;

            beforeEach(() => {
                error = new Error("E_PROCESSING_ERROR");
                mockCorrelationManager.resolveRequest.mockImplementationOnce(() => {
                    throw error;
                });
                messageHandler({}, { correlationId: "CORRELATION_ID" }, ackOrNack);
            });

            it("should log an error", () => {
                expect(mockLogger.error).toHaveBeenCalledWith(
                    "Error processing RPC response:",
                    error
                );
            });

            it("should call ackOrNack with the error instance", () => {
                expect(ackOrNack).toHaveBeenCalledWith(error);
            });
        });

        describe("when processing throws a non-Error value", () => {
            beforeEach(() => {
                mockCorrelationManager.resolveRequest.mockImplementationOnce(() => {
                    throw "E_STRING_ERROR";
                });
                messageHandler({}, { correlationId: "CORRELATION_ID" }, ackOrNack);
            });

            it("should log an error", () => {
                expect(mockLogger.error).toHaveBeenCalledWith(
                    "Error processing RPC response:",
                    "E_STRING_ERROR"
                );
            });

            it("should call ackOrNack with a new Error wrapping the string", () => {
                expect(ackOrNack).toHaveBeenCalledWith(new Error("E_STRING_ERROR"));
            });
        });
    });

    describe("with the reply subscription error handler", () => {
        let errorHandler: any, error: any;

        beforeEach(async () => {
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            errorHandler = mockReplySubscription.on.mock.calls.find(
                (call: any) => call[0] === "error"
            )[1];
            error = new Error("E_REPLY_SUBSCRIPTION_ERROR");
            errorHandler(error);
        });

        it("should log the error", () => {
            expect(mockLogger.error).toHaveBeenCalledWith("Reply subscription error:", error);
        });
    });

    describe("with the inbound subscription message handler", () => {
        let messageHandler: any, ackOrNack: any;

        beforeEach(async () => {
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            messageHandler = mockInboundSubscription.on.mock.calls.find(
                (call: any) => call[0] === "message"
            )[1];
            ackOrNack = jest.fn();
        });

        describe("when handler is found", () => {
            let content: RpcRequest, mockHandler: any;

            beforeEach(async () => {
                mockHandler = jest.fn().mockResolvedValue("HANDLER_RESULT");
                mockBroker.addRpcListener("TEST_RPC", mockHandler);
                content = {
                    correlationId: "CORRELATION_ID",
                    rpcName: "TEST_RPC",
                    payload: "REQUEST_PAYLOAD",
                    replyTo: "REPLY_QUEUE",
                };
                await messageHandler({}, content, ackOrNack);
            });

            it("should call the handler with the payload", () => {
                expect(mockHandler).toHaveBeenCalledWith("REQUEST_PAYLOAD");
            });

            it("should publish successful response", () => {
                expect(mockBroker.publish).toHaveBeenCalledWith(
                    "rpc_reply",
                    {
                        correlationId: "CORRELATION_ID",
                        payload: "HANDLER_RESULT",
                    },
                    {
                        routingKey: "REPLY_QUEUE",
                        options: { mandatory: false },
                    }
                );
            });

            it("should log debug message", () => {
                expect(mockLogger.debug).toHaveBeenCalledWith(
                    "Publishing response for RPC method:",
                    {
                        rpcName: "TEST_RPC",
                        replyTo: "REPLY_QUEUE",
                        responsePublicationName: "rpc_reply",
                    }
                );
            });

            it("should call ackOrNack", () => {
                expect(ackOrNack).toHaveBeenCalledTimes(1);
            });
        });

        describe("when handler is not found", () => {
            let content: RpcRequest;

            beforeEach(async () => {
                content = {
                    correlationId: "CORRELATION_ID",
                    rpcName: "UNKNOWN_RPC",
                    payload: "REQUEST_PAYLOAD",
                    replyTo: "REPLY_QUEUE",
                };
                await messageHandler({}, content, ackOrNack);
            });

            it("should log a warning", () => {
                expect(mockLogger.warn).toHaveBeenCalledWith(
                    "No handler found for RPC method:",
                    "UNKNOWN_RPC"
                );
            });

            it("should publish error response", () => {
                expect(mockBroker.publish).toHaveBeenCalledWith(
                    "rpc_reply",
                    {
                        correlationId: "CORRELATION_ID",
                        error: {
                            code: RpcErrorCode.METHOD_NOT_FOUND,
                            message: "RPC method 'UNKNOWN_RPC' not found",
                        },
                    },
                    {
                        routingKey: "REPLY_QUEUE",
                        options: { mandatory: false },
                    }
                );
            });

            it("should call ackOrNack", () => {
                expect(ackOrNack).toHaveBeenCalledTimes(1);
            });
        });

        describe("when handler throws an error", () => {
            let content: RpcRequest, mockHandler: any, error: any;

            beforeEach(async () => {
                error = new Error("E_HANDLER_ERROR");
                mockHandler = jest.fn().mockRejectedValue(error);
                mockBroker.addRpcListener("TEST_RPC", mockHandler);
                content = {
                    correlationId: "CORRELATION_ID",
                    rpcName: "TEST_RPC",
                    payload: "REQUEST_PAYLOAD",
                    replyTo: "REPLY_QUEUE",
                };
                await messageHandler({}, content, ackOrNack);
            });

            it("should log an error", () => {
                expect(mockLogger.error).toHaveBeenCalledWith(
                    "Publishing error response for RPC method:",
                    {
                        rpcName: "TEST_RPC",
                        replyTo: "REPLY_QUEUE",
                        responsePublicationName: "rpc_reply",
                    }
                );
            });

            it("should publish error response with the error message", () => {
                expect(mockBroker.publish).toHaveBeenCalledWith(
                    "rpc_reply",
                    {
                        correlationId: "CORRELATION_ID",
                        error: {
                            code: RpcErrorCode.HANDLER_ERROR,
                            message: "E_HANDLER_ERROR",
                        },
                    },
                    {
                        routingKey: "REPLY_QUEUE",
                        options: { mandatory: false },
                    }
                );
            });

            it("should call ackOrNack", () => {
                expect(ackOrNack).toHaveBeenCalledTimes(1);
            });
        });

        describe("when handler throws a non-Error value", () => {
            let content: RpcRequest, mockHandler: any;

            beforeEach(async () => {
                mockHandler = jest.fn().mockRejectedValue("E_STRING_ERROR");
                mockBroker.addRpcListener("TEST_RPC", mockHandler);
                content = {
                    correlationId: "CORRELATION_ID",
                    rpcName: "TEST_RPC",
                    payload: "REQUEST_PAYLOAD",
                    replyTo: "REPLY_QUEUE",
                };
                await messageHandler({}, content, ackOrNack);
            });

            it("should publish error response with 'Unknown error' message", () => {
                expect(mockBroker.publish).toHaveBeenCalledWith(
                    "rpc_reply",
                    {
                        correlationId: "CORRELATION_ID",
                        error: {
                            code: RpcErrorCode.HANDLER_ERROR,
                            message: "Unknown error",
                        },
                    },
                    {
                        routingKey: "REPLY_QUEUE",
                        options: { mandatory: false },
                    }
                );
            });
        });

        describe("when processing throws an error in the outer try/catch", () => {
            beforeEach(async () => {
                mockBroker.subscribe
                    .mockResolvedValueOnce(mockReplySubscription)
                    .mockResolvedValueOnce(mockInboundSubscription);
                const mod = await import("./setupRpcBroker");
                await mod.setupRpcBroker(mockBroker, options, mockLogger);
                messageHandler = mockInboundSubscription.on.mock.calls.find(
                    (call: any) => call[0] === "message"
                )[1];
                ackOrNack = jest.fn();
            });

            it("should call ackOrNack with the error instance if thrown", async () => {
                const thrownError = new Error("E_OUTER_ERROR");
                // Simulate error thrown in broker.publish to trigger outer try/catch
                mockBroker.publish.mockRejectedValueOnce(thrownError);
                const content: RpcRequest = {
                    correlationId: "CORRELATION_ID",
                    rpcName: "TEST_RPC",
                    payload: "REQUEST_PAYLOAD",
                    replyTo: "REPLY_QUEUE",
                };
                await messageHandler({}, content, ackOrNack);
                expect(ackOrNack).toHaveBeenCalledWith(thrownError);
            });

            it("should call ackOrNack with a new Error if a non-Error is thrown", async () => {
                // Simulate non-Error thrown in broker.publish to trigger outer try/catch
                mockBroker.publish.mockRejectedValueOnce("E_STRING_OUTER_ERROR");
                const content: RpcRequest = {
                    correlationId: "CORRELATION_ID",
                    rpcName: "TEST_RPC",
                    payload: "REQUEST_PAYLOAD",
                    replyTo: "REPLY_QUEUE",
                };
                await messageHandler({}, content, ackOrNack);
                expect(ackOrNack).toHaveBeenCalledWith(new Error("E_STRING_OUTER_ERROR"));
            });
        });
    });

    describe("with the inbound subscription error handler", () => {
        let errorHandler: any, error: any;

        beforeEach(async () => {
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            errorHandler = mockInboundSubscription.on.mock.calls.find(
                (call: any) => call[0] === "error"
            )[1];
            error = new Error("E_INBOUND_SUBSCRIPTION_ERROR");
            errorHandler(error);
        });

        it("should log the error", () => {
            expect(mockLogger.error).toHaveBeenCalledWith("Inbound subscription error:", error);
        });
    });

    describe("with the request method", () => {
        let requestMethod: any;

        beforeEach(async () => {
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            requestMethod = mockBroker.request;
        });

        describe("when making a request", () => {
            let result: any;

            beforeEach(async () => {
                result = await requestMethod("TEST_RPC", "REQUEST_PAYLOAD");
            });

            it("should call randomUUID", () => {
                expect(mockRandomUUID).toHaveBeenCalledTimes(1);
            });

            it("should call correlationManager.addRequest", () => {
                expect(mockCorrelationManager.addRequest).toHaveBeenCalledWith(
                    "CORRELATION_ID",
                    45_000
                );
            });

            it("should publish the request", () => {
                expect(mockBroker.publish).toHaveBeenCalledWith(
                    "rpc_request",
                    {
                        correlationId: "CORRELATION_ID",
                        rpcName: "TEST_RPC",
                        payload: "REQUEST_PAYLOAD",
                        replyTo: "REPLY_QUEUE_NAME",
                        headers: {
                            "service-name": "TEST_SERVICE",
                            "instance-id": "TEST_INSTANCE",
                            rpc_name: "TEST_RPC",
                        },
                    },
                    {
                        exchange: "TEST_RPC_EXCHANGE",
                        routingKey: "RPC_ROUTING_KEY",
                        options: {
                            mandatory: true,
                            persistent: false,
                        },
                    }
                );
            });

            it("should return the response", () => {
                expect(result).toBe("RESPONSE");
            });
        });

        describe("when making a request with overrides", () => {
            let overrides: PublicationConfig;

            beforeEach(async () => {
                overrides = {
                    routingKey: "OVERRIDE_ROUTING_KEY",
                    options: { persistent: true },
                };
                await requestMethod("TEST_RPC", "REQUEST_PAYLOAD", overrides);
            });

            it("should publish with overrides", () => {
                expect(mockBroker.publish).toHaveBeenCalledWith("rpc_request", expect.any(Object), {
                    exchange: "TEST_RPC_EXCHANGE",
                    routingKey: "OVERRIDE_ROUTING_KEY",
                    options: { persistent: true },
                });
            });
        });
    });

    describe("with the addRpcListener method", () => {
        let addRpcListenerMethod: any, mockHandler: any;

        beforeEach(async () => {
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            addRpcListenerMethod = mockBroker.addRpcListener;
            mockHandler = jest.fn().mockResolvedValue("HANDLER_RESULT");
        });

        describe("when registering a handler", () => {
            beforeEach(() => {
                addRpcListenerMethod("TEST_RPC", mockHandler);
            });

            it("should log the registration", () => {
                expect(mockLogger.info).toHaveBeenCalledWith(
                    "🔧 [RpcBroker] Registered RPC handler: TEST_RPC"
                );
            });

            it("should store the handler", () => {
                const content: RpcRequest = {
                    correlationId: "CORRELATION_ID",
                    rpcName: "TEST_RPC",
                    payload: "REQUEST_PAYLOAD",
                    replyTo: "REPLY_QUEUE",
                };
                const messageHandler = mockInboundSubscription.on.mock.calls.find(
                    (call: any) => call[0] === "message"
                )[1];
                messageHandler({}, content, jest.fn());
                expect(mockHandler).toHaveBeenCalledWith("REQUEST_PAYLOAD");
            });
        });
    });

    describe("with the cancelRequest method", () => {
        let cancelRequestMethod: any;

        beforeEach(async () => {
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            cancelRequestMethod = mockBroker.cancelRequest;
        });

        describe("when cancelling a request", () => {
            let result: any;

            beforeEach(() => {
                result = cancelRequestMethod("CORRELATION_ID");
            });

            it("should call correlationManager.cancelRequest", () => {
                expect(mockCorrelationManager.cancelRequest).toHaveBeenCalledWith("CORRELATION_ID");
            });

            it("should return the result", () => {
                expect(result).toBe(true);
            });
        });
    });

    describe("with the shutdown method", () => {
        let shutdownMethod: any, originalShutdown: any;

        beforeEach(async () => {
            originalShutdown = mockBroker.shutdown;
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            shutdownMethod = mockBroker.shutdown;
        });

        describe("when shutting down", () => {
            beforeEach(async () => {
                await shutdownMethod();
            });

            it("should call correlationManager.cleanup", () => {
                expect(mockCorrelationManager.cleanup).toHaveBeenCalledTimes(1);
            });

            it("should call the original shutdown method", () => {
                expect(originalShutdown).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe("when options have default timeout", () => {
        beforeEach(async () => {
            options.defaultTimeout = 60000;
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            await mockBroker.request("TEST_RPC", "REQUEST_PAYLOAD");
        });

        it("should use the custom timeout", () => {
            expect(mockCorrelationManager.addRequest).toHaveBeenCalledWith("CORRELATION_ID", 60000);
        });
    });

    describe("when options does not specify defaultTimeout", () => {
        beforeEach(async () => {
            delete options.defaultTimeout;
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            await mockBroker.request("TEST_RPC", "REQUEST_PAYLOAD");
        });

        it("should use the fallback default timeout of 30_000", () => {
            expect(mockCorrelationManager.addRequest).toHaveBeenCalledWith("CORRELATION_ID", 30000);
        });
    });

    describe("when options have default rpcExchange", () => {
        beforeEach(async () => {
            delete options.rpcExchange;
            mockBroker.subscribe
                .mockResolvedValueOnce(mockReplySubscription)
                .mockResolvedValueOnce(mockInboundSubscription);
            const mod = await import("./setupRpcBroker");
            await mod.setupRpcBroker(mockBroker, options, mockLogger);
            await mockBroker.request("TEST_RPC", "REQUEST_PAYLOAD");
        });

        it("should use undefined exchange", () => {
            expect(mockBroker.publish).toHaveBeenCalledWith("rpc_request", expect.any(Object), {
                exchange: undefined,
                routingKey: "RPC_ROUTING_KEY",
                options: {
                    mandatory: true,
                    persistent: false,
                },
            });
        });
    });
});
