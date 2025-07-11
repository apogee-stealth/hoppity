/* eslint-disable @typescript-eslint/no-explicit-any */
export default {};

const mockCloneDeep = jest.fn();
jest.mock("lodash", () => {
    return {
        cloneDeep: mockCloneDeep,
    };
});

const mockSetupDelayedPublishBroker = jest.fn();
jest.mock("./setupDelayedPublishBroker", () => {
    return {
        setupDelayedPublishBroker: mockSetupDelayedPublishBroker,
    };
});

import type { MiddlewareFunction, MiddlewareResult } from "@apogeelabs/hoppity";
import type { DelayedPublishOptions } from "./types";
import { withDelayedPublish } from "./withDelayedPublish";

describe("packages > hoppity-delayed-publish > src > withDelayedPublish", () => {
    let mockLogger: any,
        mockContext: any,
        mockTopology: any,
        mockBroker: any,
        middlewareFunction: MiddlewareFunction,
        result: MiddlewareResult;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockLogger = {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
        };
        mockContext = {
            logger: mockLogger,
            middlewareNames: ["test-middleware"],
            data: {},
        };
        mockTopology = {
            vhosts: {
                "/": {
                    queues: {},
                    publications: {},
                    subscriptions: {},
                },
                "/test": {
                    queues: {},
                    publications: {},
                    subscriptions: {},
                },
            },
        };
        mockBroker = {
            publish: jest.fn(),
            subscribe: jest.fn(),
        };
        mockCloneDeep.mockReturnValue(mockTopology);
        mockSetupDelayedPublishBroker.mockResolvedValue(undefined);
    });

    describe("withDelayedPublish", () => {
        describe("when serviceName is missing", () => {
            it("should throw an error", () => {
                const options = {
                    instanceId: "INSTANCE_ID",
                } as DelayedPublishOptions;

                expect(() => withDelayedPublish(options)).toThrow(
                    "withDelayedPublish: serviceName is required and must be a non-empty string"
                );
            });
        });

        describe("when serviceName is empty string", () => {
            it("should throw an error", () => {
                const options = {
                    serviceName: "",
                    instanceId: "INSTANCE_ID",
                } as DelayedPublishOptions;

                expect(() => withDelayedPublish(options)).toThrow(
                    "withDelayedPublish: serviceName is required and must be a non-empty string"
                );
            });
        });

        describe("when serviceName is whitespace only", () => {
            it("should throw an error", () => {
                const options = {
                    serviceName: "   ",
                    instanceId: "INSTANCE_ID",
                } as DelayedPublishOptions;

                expect(() => withDelayedPublish(options)).toThrow(
                    "withDelayedPublish: serviceName is required and must be a non-empty string"
                );
            });
        });

        describe("when instanceId is missing", () => {
            it("should throw an error", () => {
                const options = {
                    serviceName: "SERVICE_NAME",
                } as DelayedPublishOptions;

                expect(() => withDelayedPublish(options)).toThrow(
                    "withDelayedPublish: instanceId is required and must be a non-empty string"
                );
            });
        });

        describe("when instanceId is empty string", () => {
            it("should throw an error", () => {
                const options = {
                    serviceName: "SERVICE_NAME",
                    instanceId: "",
                } as DelayedPublishOptions;

                expect(() => withDelayedPublish(options)).toThrow(
                    "withDelayedPublish: instanceId is required and must be a non-empty string"
                );
            });
        });

        describe("when instanceId is whitespace only", () => {
            it("should throw an error", () => {
                const options = {
                    serviceName: "SERVICE_NAME",
                    instanceId: "   ",
                } as DelayedPublishOptions;

                expect(() => withDelayedPublish(options)).toThrow(
                    "withDelayedPublish: instanceId is required and must be a non-empty string"
                );
            });
        });

        describe("when options are valid", () => {
            let options: DelayedPublishOptions;

            beforeEach(() => {
                options = {
                    serviceName: "PIZZA_SERVICE",
                    instanceId: "INSTANCE_8675309",
                    defaultDelay: 60000,
                    logger: mockLogger,
                };
                middlewareFunction = withDelayedPublish(options);
            });

            it("should return a middleware function", () => {
                expect(typeof middlewareFunction).toBe("function");
            });

            describe("when the middleware function is called", () => {
                beforeEach(async () => {
                    result = await middlewareFunction(mockTopology, mockContext);
                });

                it("should log info message about applying middleware", () => {
                    expect(mockLogger.info).toHaveBeenCalledWith(
                        "[DelayedPublish] Applying delayed publish middleware for service: PIZZA_SERVICE"
                    );
                });

                it("should log debug message about previous middleware", () => {
                    expect(mockLogger.debug).toHaveBeenCalledWith(
                        "[DelayedPublish] Previous middleware: test-middleware"
                    );
                });

                it("should clone the topology", () => {
                    expect(mockCloneDeep).toHaveBeenCalledWith(mockTopology);
                });

                it("should store delayed publish configuration in context", () => {
                    expect(mockContext.data.delayedPublishConfig).toEqual({
                        serviceName: "PIZZA_SERVICE",
                        instanceId: "INSTANCE_8675309",
                        defaultDelay: 60000,
                        waitQueueName: "PIZZA_SERVICE_wait",
                        readyQueueName: "PIZZA_SERVICE_ready",
                        errorQueueName: "PIZZA_SERVICE_delayed_errors",
                    });
                });

                it("should return topology and onBrokerCreated callback", () => {
                    expect(result).toEqual({
                        topology: mockTopology,
                        onBrokerCreated: expect.any(Function),
                    });
                });

                describe("when topology has no vhosts", () => {
                    beforeEach(async () => {
                        mockTopology.vhosts = undefined;
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should create vhosts object", () => {
                        expect(mockTopology.vhosts).toEqual({});
                    });
                });

                describe("when vhost has no queues", () => {
                    beforeEach(async () => {
                        mockTopology.vhosts["/"].queues = undefined;
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should create queues object", () => {
                        expect(mockTopology.vhosts["/"].queues).toEqual({
                            PIZZA_SERVICE_wait: {
                                options: {
                                    durable: false,
                                    autoDelete: false,
                                    arguments: {
                                        "x-dead-letter-exchange": "",
                                        "x-dead-letter-routing-key": "PIZZA_SERVICE_ready",
                                    },
                                },
                            },
                            PIZZA_SERVICE_ready: {
                                options: {
                                    durable: false,
                                    autoDelete: false,
                                },
                            },
                            PIZZA_SERVICE_delayed_errors: {
                                options: {
                                    durable: false,
                                    autoDelete: false,
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

                    it("should create publications object", () => {
                        expect(mockTopology.vhosts["/"].publications).toEqual({
                            PIZZA_SERVICE_delayed_wait: {
                                exchange: "",
                                routingKey: "PIZZA_SERVICE_wait",
                                options: {
                                    persistent: false,
                                },
                            },
                        });
                    });
                });

                describe("when vhost has no subscriptions", () => {
                    beforeEach(async () => {
                        mockTopology.vhosts["/"].subscriptions = undefined;
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should create subscriptions object", () => {
                        expect(mockTopology.vhosts["/"].subscriptions).toEqual({
                            PIZZA_SERVICE_ready_subscription: {
                                queue: "PIZZA_SERVICE_ready",
                                options: {
                                    prefetch: 1,
                                },
                            },
                        });
                    });
                });

                describe("when vhost has existing queues", () => {
                    beforeEach(async () => {
                        mockTopology.vhosts["/"].queues = {
                            existing_queue: { options: {} },
                        };
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should add delayed publish queues to existing queues", () => {
                        expect(mockTopology.vhosts["/"].queues).toEqual({
                            existing_queue: { options: {} },
                            PIZZA_SERVICE_wait: {
                                options: {
                                    durable: false,
                                    autoDelete: false,
                                    arguments: {
                                        "x-dead-letter-exchange": "",
                                        "x-dead-letter-routing-key": "PIZZA_SERVICE_ready",
                                    },
                                },
                            },
                            PIZZA_SERVICE_ready: {
                                options: {
                                    durable: false,
                                    autoDelete: false,
                                },
                            },
                            PIZZA_SERVICE_delayed_errors: {
                                options: {
                                    durable: false,
                                    autoDelete: false,
                                },
                            },
                        });
                    });
                });

                describe("when vhost has existing publications", () => {
                    beforeEach(async () => {
                        mockTopology.vhosts["/"].publications = {
                            existing_publication: { exchange: "test" },
                        };
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should add delayed publish publication to existing publications", () => {
                        expect(mockTopology.vhosts["/"].publications).toEqual({
                            existing_publication: { exchange: "test" },
                            PIZZA_SERVICE_delayed_wait: {
                                exchange: "",
                                routingKey: "PIZZA_SERVICE_wait",
                                options: {
                                    persistent: false,
                                },
                            },
                        });
                    });
                });

                describe("when vhost has existing subscriptions", () => {
                    beforeEach(async () => {
                        mockTopology.vhosts["/"].subscriptions = {
                            existing_subscription: { queue: "test" },
                        };
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should add delayed publish subscription to existing subscriptions", () => {
                        expect(mockTopology.vhosts["/"].subscriptions).toEqual({
                            existing_subscription: { queue: "test" },
                            PIZZA_SERVICE_ready_subscription: {
                                queue: "PIZZA_SERVICE_ready",
                                options: {
                                    prefetch: 1,
                                },
                            },
                        });
                    });
                });

                describe("when multiple vhosts exist", () => {
                    beforeEach(async () => {
                        mockTopology.vhosts = {
                            "/": { queues: {}, publications: {}, subscriptions: {} },
                            "/test": { queues: {}, publications: {}, subscriptions: {} },
                        };
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should add delayed publish infrastructure to all vhosts", () => {
                        expect(mockTopology.vhosts["/"].queues).toHaveProperty(
                            "PIZZA_SERVICE_wait"
                        );
                        expect(mockTopology.vhosts["/test"].queues).toHaveProperty(
                            "PIZZA_SERVICE_wait"
                        );
                    });

                    it("should log debug messages for each vhost", () => {
                        expect(mockLogger.debug).toHaveBeenCalledWith(
                            "[DelayedPublish] Added delayed publish infrastructure to vhost '/':"
                        );
                        expect(mockLogger.debug).toHaveBeenCalledWith(
                            "[DelayedPublish] Added delayed publish infrastructure to vhost '/test':"
                        );
                    });
                });

                describe("when context has no middleware names", () => {
                    beforeEach(async () => {
                        mockContext.middlewareNames = [];
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should log debug message with 'none'", () => {
                        expect(mockLogger.debug).toHaveBeenCalledWith(
                            "[DelayedPublish] Previous middleware: none"
                        );
                    });
                });

                describe("when context has existing delayed publish config", () => {
                    beforeEach(async () => {
                        mockContext.data.delayedPublishConfig = {
                            serviceName: "EXISTING_SERVICE",
                            instanceId: "EXISTING_INSTANCE",
                        };
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should log warning about existing configuration", () => {
                        expect(mockLogger.warn).toHaveBeenCalledWith(
                            "[DelayedPublish] Warning: Delayed publish configuration already exists in context from previous middleware"
                        );
                    });

                    it("should log existing configuration", () => {
                        expect(mockLogger.warn).toHaveBeenCalledWith(
                            "[DelayedPublish] Existing config:",
                            {
                                serviceName: "EXISTING_SERVICE",
                                instanceId: "EXISTING_INSTANCE",
                            }
                        );
                    });
                });

                describe("when defaultDelay is not provided", () => {
                    beforeEach(async () => {
                        delete options.defaultDelay;
                        middlewareFunction = withDelayedPublish(options);
                        result = await middlewareFunction(mockTopology, mockContext);
                    });

                    it("should use default delay of 30000", () => {
                        expect(mockContext.data.delayedPublishConfig.defaultDelay).toBe(30000);
                    });
                });

                describe("when onBrokerCreated callback is called", () => {
                    beforeEach(async () => {
                        await result.onBrokerCreated!(mockBroker);
                    });

                    it("should call setupDelayedPublishBroker with broker and options", () => {
                        expect(mockSetupDelayedPublishBroker).toHaveBeenCalledWith(
                            mockBroker,
                            options,
                            mockLogger
                        );
                    });

                    describe("when context has no logger", () => {
                        beforeEach(async () => {
                            // Create a new middleware function with a fresh context that has a no-op logger
                            const newContext = {
                                middlewareNames: ["test-middleware"],
                                data: {},
                                logger: {
                                    silly: jest.fn(),
                                    debug: jest.fn(),
                                    info: jest.fn(),
                                    warn: jest.fn(),
                                    error: jest.fn(),
                                    critical: jest.fn(),
                                },
                            };
                            result = await middlewareFunction(mockTopology, newContext);
                            await result.onBrokerCreated!(mockBroker);
                        });

                        it("should use logger from options", () => {
                            expect(mockSetupDelayedPublishBroker).toHaveBeenCalledWith(
                                mockBroker,
                                options,
                                options.logger
                            );
                        });
                    });

                    describe("when context logger is falsy in onBrokerCreated callback", () => {
                        beforeEach(async () => {
                            // Create a middleware function that will have a falsy logger in the callback
                            const middlewareWithFalsyLogger = (topology: any, context: any) => {
                                // Call the original middleware function
                                const result = middlewareFunction(topology, context);

                                // Override the onBrokerCreated callback to test fallback logic
                                if (result.onBrokerCreated) {
                                    const originalCallback = result.onBrokerCreated;
                                    result.onBrokerCreated = async (broker: any) => {
                                        // Temporarily make context.logger falsy to test the fallback
                                        const originalLogger = context.logger;
                                        context.logger = null;

                                        try {
                                            await originalCallback(broker);
                                        } finally {
                                            // Restore the original logger
                                            context.logger = originalLogger;
                                        }
                                    };
                                }

                                return result;
                            };

                            const newContext = {
                                middlewareNames: ["test-middleware"],
                                data: {},
                                logger: {
                                    silly: jest.fn(),
                                    debug: jest.fn(),
                                    info: jest.fn(),
                                    warn: jest.fn(),
                                    error: jest.fn(),
                                    critical: jest.fn(),
                                },
                            };

                            result = await middlewareWithFalsyLogger(mockTopology, newContext);
                            await result.onBrokerCreated!(mockBroker);
                        });

                        it("should use logger from options when context logger is falsy", () => {
                            expect(mockSetupDelayedPublishBroker).toHaveBeenCalledWith(
                                mockBroker,
                                options,
                                options.logger
                            );
                        });
                    });
                });
            });
        });
    });
});
