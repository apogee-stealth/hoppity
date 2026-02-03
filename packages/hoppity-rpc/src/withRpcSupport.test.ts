/* eslint-disable @typescript-eslint/no-explicit-any */

const mockSetupRpcBroker = jest.fn();
jest.mock("./setupRpcBroker", () => {
    return {
        setupRpcBroker: mockSetupRpcBroker,
    };
});

const mockGenerateInboundQueueName = jest.fn();
const mockGenerateReplyQueueName = jest.fn();
const mockGenerateServiceRpcBindingPattern = jest.fn();
jest.mock("./utils/queueNaming", () => {
    return {
        generateInboundQueueName: mockGenerateInboundQueueName,
        generateReplyQueueName: mockGenerateReplyQueueName,
        generateServiceRpcBindingPattern: mockGenerateServiceRpcBindingPattern,
    };
});

import { MiddlewareFunction } from "@apogeelabs/hoppity";
import { RpcMiddlewareOptions } from "./types";

describe("hoppity-rpc > src > withRpcSupport", () => {
    let withRpcSupport: any,
        mockLogger: any,
        mockContext: any,
        mockTopology: any,
        result: any,
        expectedErr: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockLogger = {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        mockContext = {
            logger: mockLogger,
            middlewareNames: ["previous-middleware"],
            data: {},
        };
        mockTopology = {
            vhosts: {
                "/": {
                    exchanges: {
                        existing: { type: "direct" },
                    },
                    queues: {
                        existing: { options: {} },
                    },
                },
            },
        };
        mockGenerateReplyQueueName.mockReturnValue("rpc_test_service_test_instance_reply");
        mockGenerateInboundQueueName.mockReturnValue("rpc_test_service_test_instance_inbound");
        mockGenerateServiceRpcBindingPattern.mockReturnValue("rpc.test-service.#.request");
        mockSetupRpcBroker.mockResolvedValue(undefined);
    });

    describe("with withRpcSupport", () => {
        beforeEach(async () => {
            const mod = await import("./withRpcSupport");
            withRpcSupport = mod.withRpcSupport;
        });

        describe("when serviceName is missing", () => {
            let options: RpcMiddlewareOptions;

            beforeEach(() => {
                options = {
                    instanceId: "test-instance",
                    rpcExchange: "rpc_requests",
                } as RpcMiddlewareOptions;
                try {
                    withRpcSupport(options);
                } catch (error) {
                    expectedErr = error;
                }
            });

            it("should throw an error", () => {
                expect(expectedErr).toEqual(
                    new Error(
                        "withRpcSupport: serviceName is required and must be a non-empty string"
                    )
                );
            });
        });

        describe("when serviceName is empty string", () => {
            let options: RpcMiddlewareOptions;

            beforeEach(() => {
                options = {
                    serviceName: "",
                    instanceId: "test-instance",
                    rpcExchange: "rpc_requests",
                } as RpcMiddlewareOptions;
                try {
                    withRpcSupport(options);
                } catch (error) {
                    expectedErr = error;
                }
            });

            it("should throw an error", () => {
                expect(expectedErr).toEqual(
                    new Error(
                        "withRpcSupport: serviceName is required and must be a non-empty string"
                    )
                );
            });
        });

        describe("when serviceName is whitespace", () => {
            let options: RpcMiddlewareOptions;

            beforeEach(() => {
                options = {
                    serviceName: "   ",
                    instanceId: "test-instance",
                    rpcExchange: "rpc_requests",
                } as RpcMiddlewareOptions;
                try {
                    withRpcSupport(options);
                } catch (error) {
                    expectedErr = error;
                }
            });

            it("should throw an error", () => {
                expect(expectedErr).toEqual(
                    new Error(
                        "withRpcSupport: serviceName is required and must be a non-empty string"
                    )
                );
            });
        });

        describe("when instanceId is missing", () => {
            let options: RpcMiddlewareOptions;

            beforeEach(() => {
                options = {
                    serviceName: "test-service",
                    rpcExchange: "rpc_requests",
                } as RpcMiddlewareOptions;
                try {
                    withRpcSupport(options);
                } catch (error) {
                    expectedErr = error;
                }
            });

            it("should throw an error", () => {
                expect(expectedErr).toEqual(
                    new Error(
                        "withRpcSupport: instanceId is required and must be a non-empty string"
                    )
                );
            });
        });

        describe("when instanceId is empty string", () => {
            let options: RpcMiddlewareOptions;

            beforeEach(() => {
                options = {
                    serviceName: "test-service",
                    instanceId: "",
                    rpcExchange: "rpc_requests",
                } as RpcMiddlewareOptions;
                try {
                    withRpcSupport(options);
                } catch (error) {
                    expectedErr = error;
                }
            });

            it("should throw an error", () => {
                expect(expectedErr).toEqual(
                    new Error(
                        "withRpcSupport: instanceId is required and must be a non-empty string"
                    )
                );
            });
        });

        describe("when rpcExchange is empty string", () => {
            let options: RpcMiddlewareOptions;

            beforeEach(() => {
                options = {
                    serviceName: "test-service",
                    instanceId: "test-instance",
                    rpcExchange: "",
                } as RpcMiddlewareOptions;
                try {
                    withRpcSupport(options);
                } catch (error) {
                    expectedErr = error;
                }
            });

            it("should throw an error", () => {
                expect(expectedErr).toEqual(
                    new Error(
                        "withRpcSupport: rpcExchange must be a non-empty string when provided"
                    )
                );
            });
        });

        describe("when all required options are provided", () => {
            let middlewareFunction: MiddlewareFunction, options: RpcMiddlewareOptions;

            beforeEach(() => {
                options = {
                    serviceName: "test-service",
                    instanceId: "test-instance",
                    rpcExchange: "rpc_requests",
                };
                middlewareFunction = withRpcSupport(options);
            });

            it("should return a middleware function", () => {
                expect(typeof middlewareFunction).toBe("function");
            });

            describe("when the middleware function is called", () => {
                beforeEach(async () => {
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should log info about applying RPC middleware", () => {
                    expect(mockLogger.info).toHaveBeenCalledWith(
                        "[RpcSupport] Applying RPC middleware for service: test-service"
                    );
                });

                it("should log debug about previous middleware", () => {
                    expect(mockLogger.debug).toHaveBeenCalledWith(
                        "[RpcSupport] Previous middleware: previous-middleware"
                    );
                });

                it("should store RPC configuration in context", () => {
                    expect(mockContext.data.rpcConfig).toEqual({
                        serviceName: "test-service",
                        instanceId: "test-instance",
                        rpcExchange: "rpc_requests",
                        replyQueueName: "rpc_test_service_test_instance_reply",
                        inboundQueueName: "rpc_test_service_test_instance_inbound",
                    });
                });

                it("should call queue naming utilities", () => {
                    expect(mockGenerateReplyQueueName).toHaveBeenCalledWith(
                        "test-service",
                        "test-instance"
                    );
                    expect(mockGenerateInboundQueueName).toHaveBeenCalledWith(
                        "test-service",
                        "test-instance"
                    );
                    expect(mockGenerateServiceRpcBindingPattern).toHaveBeenCalledWith(
                        "test-service"
                    );
                });

                it("should return topology and onBrokerCreated callback", () => {
                    expect(result).toHaveProperty("topology");
                    expect(result).toHaveProperty("onBrokerCreated");
                    expect(typeof result.onBrokerCreated).toBe("function");
                });

                it("should return the cloned topology", () => {
                    expect(result.topology).not.toBe(mockTopology);
                });

                describe("when onBrokerCreated is called", () => {
                    let mockBroker: any;

                    beforeEach(async () => {
                        mockBroker = {
                            publish: jest.fn(),
                            subscribe: jest.fn(),
                        };
                        await result.onBrokerCreated(mockBroker);
                    });

                    it("should call setupRpcBroker with correct parameters", () => {
                        expect(mockSetupRpcBroker).toHaveBeenCalledWith(
                            mockBroker,
                            options,
                            mockLogger
                        );
                    });
                });
            });

            describe("when context has existing RPC configuration", () => {
                beforeEach(async () => {
                    mockContext.data.rpcConfig = {
                        serviceName: "existing-service",
                        instanceId: "existing-instance",
                    };
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should log a warning about existing RPC configuration", () => {
                    expect(mockLogger.warn).toHaveBeenCalledWith(
                        "[RpcSupport] Warning: RPC configuration already exists in context from previous middleware"
                    );
                });

                it("should log the existing configuration", () => {
                    expect(mockLogger.warn).toHaveBeenCalledWith("[RpcSupport] Existing config:", {
                        serviceName: "existing-service",
                        instanceId: "existing-instance",
                    });
                });

                it("should still store the new RPC configuration", () => {
                    expect(mockContext.data.rpcConfig).toEqual({
                        serviceName: "test-service",
                        instanceId: "test-instance",
                        rpcExchange: "rpc_requests",
                        replyQueueName: "rpc_test_service_test_instance_reply",
                        inboundQueueName: "rpc_test_service_test_instance_inbound",
                    });
                });
            });

            describe("when topology has no vhosts", () => {
                beforeEach(async () => {
                    mockTopology.vhosts = undefined;
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should create vhosts object", () => {
                    expect(result.topology.vhosts).toEqual({});
                });
            });

            describe("when vhost has no exchanges", () => {
                beforeEach(async () => {
                    mockTopology.vhosts["/"].exchanges = undefined;
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should create exchanges object", () => {
                    expect(result.topology.vhosts["/"].exchanges).toEqual({
                        rpc_requests: {
                            type: "topic",
                            options: {
                                durable: true,
                            },
                        },
                    });
                });
            });

            describe("when vhost has no queues", () => {
                beforeEach(async () => {
                    mockTopology.vhosts["/"].queues = undefined;
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should create queues object with reply and inbound queues", () => {
                    expect(result.topology.vhosts["/"].queues).toEqual({
                        rpc_test_service_test_instance_reply: {
                            options: {
                                exclusive: true,
                                autoDelete: true,
                            },
                        },
                        rpc_test_service_test_instance_inbound: {
                            options: {
                                exclusive: true,
                                autoDelete: true,
                            },
                        },
                    });
                });
            });

            describe("when vhost has no bindings", () => {
                beforeEach(async () => {
                    mockTopology.vhosts["/"].bindings = undefined;
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should create bindings object with inbound queue binding", () => {
                    expect(result.topology.vhosts["/"].bindings).toEqual({
                        rpc_test_service_test_instance_inbound_binding: {
                            source: "rpc_requests",
                            destination: "rpc_test_service_test_instance_inbound",
                            destinationType: "queue",
                            bindingKey: "rpc.test-service.#.request",
                        },
                    });
                });
            });

            describe("when vhost has no subscriptions", () => {
                beforeEach(async () => {
                    mockTopology.vhosts["/"].subscriptions = undefined;
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should create subscriptions object with inbound and reply subscriptions", () => {
                    expect(result.topology.vhosts["/"].subscriptions).toEqual({
                        rpc_test_service_test_instance_inbound_subscription: {
                            queue: "rpc_test_service_test_instance_inbound",
                            options: {
                                prefetch: 1,
                            },
                        },
                        rpc_test_service_test_instance_reply_subscription: {
                            queue: "rpc_test_service_test_instance_reply",
                            options: {
                                prefetch: 1,
                            },
                        },
                    });
                });
            });

            describe("when vhost has no publications", () => {
                beforeEach(async () => {
                    mockTopology.vhosts["/"].publications = undefined;
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should create publications object with request and reply publications", () => {
                    expect(result.topology.vhosts["/"].publications).toEqual({
                        rpc_request: {
                            exchange: "rpc_requests",
                        },
                        rpc_reply: {
                            exchange: "",
                            routingKey: "{{replyTo}}",
                            options: {
                                persistent: false,
                            },
                        },
                    });
                });
            });

            describe("when topology has multiple vhosts", () => {
                beforeEach(async () => {
                    mockTopology.vhosts = {
                        "/": {
                            exchanges: {},
                            queues: {},
                        },
                        "/test": {
                            exchanges: {},
                            queues: {},
                        },
                    };
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should add RPC infrastructure to all vhosts", () => {
                    expect(result.topology.vhosts["/"].exchanges).toHaveProperty("rpc_requests");
                    expect(result.topology.vhosts["/test"].exchanges).toHaveProperty(
                        "rpc_requests"
                    );
                });

                it("should log debug information for each vhost", () => {
                    expect(mockLogger.debug).toHaveBeenCalledWith(
                        "[RpcSupport] Added RPC infrastructure to vhost '/':"
                    );
                    expect(mockLogger.debug).toHaveBeenCalledWith(
                        "[RpcSupport] Added RPC infrastructure to vhost '/test':"
                    );
                });
            });

            describe("when context has no middleware names", () => {
                beforeEach(async () => {
                    mockContext.middlewareNames = [];
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should log debug with 'none' for previous middleware", () => {
                    expect(mockLogger.debug).toHaveBeenCalledWith(
                        "[RpcSupport] Previous middleware: none"
                    );
                });
            });
        });

        describe("when rpcExchange is not provided", () => {
            let middlewareFunction: MiddlewareFunction, options: RpcMiddlewareOptions;

            beforeEach(async () => {
                options = {
                    serviceName: "test-service",
                    instanceId: "test-instance",
                };
                middlewareFunction = withRpcSupport(options);
                result = await middlewareFunction(mockTopology, mockContext);
            });

            it("should use default rpcExchange value", () => {
                expect(mockContext.data.rpcConfig.rpcExchange).toBe("rpc_requests");
            });
        });

        describe("when rpcExchange is provided", () => {
            let middlewareFunction: MiddlewareFunction, options: RpcMiddlewareOptions;

            beforeEach(async () => {
                options = {
                    serviceName: "test-service",
                    instanceId: "test-instance",
                    rpcExchange: "custom_rpc_exchange",
                };
                middlewareFunction = withRpcSupport(options);
                result = await middlewareFunction(mockTopology, mockContext);
            });

            it("should use provided rpcExchange value", () => {
                expect(mockContext.data.rpcConfig.rpcExchange).toBe("custom_rpc_exchange");
            });
        });
    });
});

export default {};
