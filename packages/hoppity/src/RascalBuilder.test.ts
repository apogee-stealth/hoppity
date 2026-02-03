/* eslint-disable @typescript-eslint/no-explicit-any */
const mockBrokerAsPromised = {
    create: jest.fn(),
};

jest.mock("rascal", () => {
    return {
        BrokerAsPromised: mockBrokerAsPromised,
    };
});

describe("packages > hoppity > src > RascalBuilder", () => {
    let instance: any, topology: any, mwFn: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        mockBrokerAsPromised.create.mockReturnValue({
            shutdown: jest.fn().mockResolvedValue(undefined),
        });

        topology = {
            vhosts: {
                "/": {
                    connection: {
                        url: "amqp://localhost:5672",
                    },
                    exchanges: {
                        someExchange: {
                            type: "topic",
                            options: {
                                durable: false,
                                autoDelete: false,
                            },
                        },
                    },
                    queues: {
                        someQueue: {
                            options: {
                                durable: false,
                            },
                        },
                    },
                    bindings: {
                        someBinding: {
                            source: "someExchange",
                            destination: "someQueue",
                            destinationType: "queue",
                            bindingKey: "someRoutingKey",
                        },
                    },
                    subscriptions: {
                        someSubscription: {
                            queue: "someQueue",
                        },
                    },
                    publications: {
                        somePublication: {
                            exchange: "someExchange",
                            routingKey: "someRoutingKey",
                            options: {
                                persistent: false,
                            },
                        },
                    },
                },
            },
        };
    });

    describe("when instantiating", () => {
        describe("when topology is provided", () => {
            beforeEach(async () => {
                const mod = await import("./RascalBuilder");
                instance = new mod.RascalBuilder(topology);
            });

            it("should set the topology", () => {
                expect(instance.topology).toEqual(topology);
            });
        });

        describe("when topology is not provided", () => {
            beforeEach(async () => {
                const mod = await import("./RascalBuilder");
                instance = new mod.RascalBuilder();
            });

            it("should set the topology to an empty object", () => {
                expect(instance.topology).toEqual({});
            });
        });
    });

    describe("when invoking `use`", () => {
        beforeEach(async () => {
            const mod = await import("./RascalBuilder");
            instance = new mod.RascalBuilder(topology);
            mwFn = jest.fn();
            instance.use(mwFn);
        });

        it("should add the middleware to the pipeline", () => {
            expect(instance.middlewareFunctions).toHaveLength(1);
            expect(instance.middlewareFunctions[0]).toEqual(mwFn);
        });
    });

    describe("when invoking `build`", () => {
        let onBrokerCreated: any,
            broker: any,
            passedTopology: any,
            passedContext: any,
            getModifiedTopology: any,
            errResult: any,
            errMwFn: any,
            rawContext: any;

        beforeEach(() => {
            getModifiedTopology = function () {
                const clonedTopology = structuredClone(topology);
                clonedTopology.vhosts["/"].publications.mwPublication = {
                    exchange: "calzoneExchange",
                };
                return clonedTopology;
            };
            onBrokerCreated = jest.fn();
            mwFn = jest.fn().mockImplementationOnce((topology: any, context: any) => {
                passedTopology = structuredClone(topology);
                passedContext = structuredClone(context);
                rawContext = context;
                return {
                    topology: getModifiedTopology(),
                    onBrokerCreated,
                };
            });
        });

        describe("and things go beautifully without middleware in play", () => {
            beforeEach(async () => {
                const mod = await import("./RascalBuilder");
                instance = new mod.RascalBuilder(topology);
                broker = await instance.build();
            });

            it("should still create a broker", () => {
                expect(broker).toEqual(mockBrokerAsPromised.create.mock.results[0].value);
                expect(mockBrokerAsPromised.create).toHaveBeenCalledTimes(1);
                expect(mockBrokerAsPromised.create).toHaveBeenCalledWith(topology);
            });
        });

        describe("and things go beautifully with middleware in play", () => {
            describe("and the middleware is not anonymous (has a name set)", () => {
                beforeEach(async () => {
                    const mod = await import("./RascalBuilder");
                    instance = new mod.RascalBuilder(structuredClone(topology));
                    instance.use(mwFn);
                    broker = await instance.build();
                });

                it("should execute the middleware pipeline", () => {
                    expect(mwFn).toHaveBeenCalledTimes(1);
                    expect(mwFn).toHaveBeenCalledWith(passedTopology, passedContext);
                });

                it("should include the expected middleware name in the context", () => {
                    expect(rawContext.middlewareNames).toEqual(["mockConstructor"]);
                });

                it("should create the broker", () => {
                    expect(mockBrokerAsPromised.create).toHaveBeenCalledTimes(1);
                    expect(mockBrokerAsPromised.create).toHaveBeenCalledWith(getModifiedTopology());
                    expect(broker).toEqual(mockBrokerAsPromised.create.mock.results[0].value);
                });

                it("should execute the callbacks", () => {
                    expect(mwFn).toHaveBeenCalledTimes(1);
                    expect(onBrokerCreated).toHaveBeenCalledTimes(1);
                    expect(onBrokerCreated).toHaveBeenCalledWith(broker);
                });
            });

            describe("and the middleware is anonymous (has no name set)", () => {
                beforeEach(async () => {
                    const mod = await import("./RascalBuilder");
                    instance = new mod.RascalBuilder(structuredClone(topology));
                    instance.use(function (topology: any, context: any) {
                        passedTopology = structuredClone(topology);
                        passedContext = structuredClone(context);
                        rawContext = context;
                        return {
                            topology: getModifiedTopology(),
                            onBrokerCreated,
                        };
                    });
                    broker = await instance.build();
                });

                it("should include the expected middleware name in the context", () => {
                    expect(rawContext.middlewareNames).toEqual(["middleware_0"]);
                });

                it("should create the broker", () => {
                    expect(mockBrokerAsPromised.create).toHaveBeenCalledTimes(1);
                    expect(mockBrokerAsPromised.create).toHaveBeenCalledWith(getModifiedTopology());
                    expect(broker).toEqual(mockBrokerAsPromised.create.mock.results[0].value);
                });
            });
        });

        describe("and things go horribly wrong thanks to the broker", () => {
            describe("and the broker throws an Error instance", () => {
                beforeEach(async () => {
                    mockBrokerAsPromised.create.mockReset();
                    mockBrokerAsPromised.create.mockImplementationOnce(() => {
                        throw new Error("E_NO_EPSTEIN_FILES");
                    });
                    const mod = await import("./RascalBuilder");
                    instance = new mod.RascalBuilder(structuredClone(topology));
                    instance.use(mwFn);
                    try {
                        broker = await instance.build();
                    } catch (error) {
                        errResult = error;
                    }
                });

                it("should throw an error", () => {
                    expect(errResult.message).toContain(
                        "Broker creation failed. Pipeline executed 1 middleware(s)."
                    );
                    expect(errResult.cause).toEqual(new Error("E_NO_EPSTEIN_FILES"));
                });
            });

            describe("and the broker doesn't throw an Error instance", () => {
                beforeEach(async () => {
                    mockBrokerAsPromised.create.mockReset();
                    mockBrokerAsPromised.create.mockImplementationOnce(() => {
                        throw "E_NO_EPSTEIN_FILES";
                    });
                    const mod = await import("./RascalBuilder");
                    instance = new mod.RascalBuilder(structuredClone(topology));
                    instance.use(mwFn);
                    try {
                        broker = await instance.build();
                    } catch (error) {
                        errResult = error;
                    }
                });

                it("should throw an error", () => {
                    expect(errResult.message).toContain(
                        "Broker creation failed. Pipeline executed 1 middleware(s)."
                    );
                    expect(errResult.cause).toEqual("E_NO_EPSTEIN_FILES");
                });
            });
        });

        describe("when the middleware throws an error", () => {
            describe("and the error is an Error instance", () => {
                beforeEach(async () => {
                    errMwFn = () => {
                        throw new Error("E_NO_BUDGET_CUTS");
                    };
                    const mod = await import("./RascalBuilder");
                    instance = new mod.RascalBuilder(structuredClone(topology));
                    instance.use(errMwFn);
                    try {
                        broker = await instance.build();
                    } catch (error) {
                        errResult = error;
                    }
                });

                it("should throw an error", () => {
                    expect(errResult.message).toContain(
                        "Broker creation failed. Pipeline executed 0 middleware(s). Original error: Middleware 1 (errMwFn) failed: E_NO_BUDGET_CUTS"
                    );
                });
            });

            describe("and the error is not an Error instance", () => {
                beforeEach(async () => {
                    errMwFn = jest.fn().mockImplementationOnce(() => {
                        throw "E_NO_BUDGET_CUTS";
                    });
                    const mod = await import("./RascalBuilder");
                    instance = new mod.RascalBuilder(structuredClone(topology));
                    instance.use(errMwFn);
                    try {
                        broker = await instance.build();
                    } catch (error) {
                        errResult = error;
                    }
                });

                it("should throw an error", () => {
                    expect(errResult.message).toContain(
                        "Broker creation failed. Pipeline executed 0 middleware(s). Original error: Middleware 1 (mockConstructor) failed: E_NO_BUDGET_CUTS"
                    );
                });
            });
        });

        describe("when the middleware onBrokerCreated callback throws an error", () => {
            describe("and the error is an Error instance", () => {
                let mockBrokerInstance: any;

                beforeEach(async () => {
                    errMwFn = jest.fn().mockImplementationOnce((topology: any, _context: any) => {
                        return {
                            topology,
                            onBrokerCreated: jest.fn().mockImplementationOnce(() => {
                                throw new Error("E_PALANTIR");
                            }),
                        };
                    });
                    const mod = await import("./RascalBuilder");
                    instance = new mod.RascalBuilder(structuredClone(topology));
                    instance.use(errMwFn);
                    mockBrokerInstance =
                        mockBrokerAsPromised.create.mock.results[0]?.value ??
                        mockBrokerAsPromised.create();
                    mockBrokerInstance.shutdown.mockClear();
                    try {
                        broker = await instance.build();
                    } catch (error) {
                        errResult = error;
                    }
                });

                it("should throw an error", () => {
                    expect(errResult.message).toContain(
                        "Broker creation failed. Pipeline executed 1 middleware(s). Original error: Middleware callback 1 failed: E_PALANTIR"
                    );
                });

                it("should shutdown the broker to avoid leaking connections", () => {
                    expect(mockBrokerInstance.shutdown).toHaveBeenCalledTimes(1);
                });
            });

            describe("and the error is not an Error instance", () => {
                let mockBrokerInstance: any;

                beforeEach(async () => {
                    errMwFn = jest.fn().mockImplementationOnce((topology: any, _context: any) => {
                        return {
                            topology,
                            onBrokerCreated: jest.fn().mockImplementationOnce(() => {
                                throw "E_PALANTIR";
                            }),
                        };
                    });
                    const mod = await import("./RascalBuilder");
                    instance = new mod.RascalBuilder(structuredClone(topology));
                    instance.use(errMwFn);
                    mockBrokerInstance =
                        mockBrokerAsPromised.create.mock.results[0]?.value ??
                        mockBrokerAsPromised.create();
                    mockBrokerInstance.shutdown.mockClear();
                    try {
                        broker = await instance.build();
                    } catch (error) {
                        errResult = error;
                    }
                });

                it("should throw an error", () => {
                    expect(errResult.message).toContain(
                        "Broker creation failed. Pipeline executed 1 middleware(s). Original error: Middleware callback 1 failed: E_PALANTIR"
                    );
                });

                it("should shutdown the broker to avoid leaking connections", () => {
                    expect(mockBrokerInstance.shutdown).toHaveBeenCalledTimes(1);
                });
            });

            describe("and broker.shutdown() also throws", () => {
                beforeEach(async () => {
                    mockBrokerAsPromised.create.mockReset();
                    mockBrokerAsPromised.create.mockReturnValue({
                        shutdown: jest.fn().mockRejectedValue(new Error("E_SHUTDOWN_FAILED")),
                    });
                    errMwFn = jest.fn().mockImplementationOnce((topology: any, _context: any) => {
                        return {
                            topology,
                            onBrokerCreated: jest.fn().mockImplementationOnce(() => {
                                throw new Error("E_PALANTIR");
                            }),
                        };
                    });
                    const mod = await import("./RascalBuilder");
                    instance = new mod.RascalBuilder(structuredClone(topology));
                    instance.use(errMwFn);
                    try {
                        broker = await instance.build();
                    } catch (error) {
                        errResult = error;
                    }
                });

                it("should propagate the shutdown error", () => {
                    expect(errResult.message).toContain("E_SHUTDOWN_FAILED");
                });
            });
        });
    });
});
