/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

describe("hoppity-logger > src > withCustomLogger", () => {
    let mockLogger: any, mockTopology: any, mockContext: any, result: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
        mockTopology = {
            vhosts: {
                v1: {
                    queues: {
                        test_queue: {},
                    },
                },
            },
        };
        mockContext = {
            someOtherProperty: "EXISTING_VALUE",
        };
    });

    describe("with withCustomLogger", () => {
        describe("when called with valid options", () => {
            beforeEach(async () => {
                const mod = await import("./withCustomLogger");
                const middleware = mod.withCustomLogger({ logger: mockLogger });
                result = middleware(mockTopology, mockContext);
            });

            it("should set the custom logger on the context", () => {
                expect(mockContext.logger).toBe(mockLogger);
            });

            it("should preserve existing context properties", () => {
                expect(mockContext.someOtherProperty).toBe("EXISTING_VALUE");
            });

            it("should return the topology unchanged", () => {
                expect(result).toEqual({ topology: mockTopology });
            });

            it("should return the topology object reference", () => {
                expect(result.topology).toBe(mockTopology);
            });
        });

        describe("when called with a different logger instance", () => {
            let differentLogger: any;

            beforeEach(async () => {
                differentLogger = {
                    info: jest.fn(),
                    warn: jest.fn(),
                    error: jest.fn(),
                    debug: jest.fn(),
                    customMethod: jest.fn(),
                };
                const mod = await import("./withCustomLogger");
                const middleware = mod.withCustomLogger({ logger: differentLogger });
                result = middleware(mockTopology, mockContext);
            });

            it("should set the different logger on the context", () => {
                expect(mockContext.logger).toBe(differentLogger);
            });

            it("should return the topology unchanged", () => {
                expect(result).toEqual({ topology: mockTopology });
            });
        });

        describe("when called with an empty context", () => {
            beforeEach(async () => {
                mockContext = {};
                const mod = await import("./withCustomLogger");
                const middleware = mod.withCustomLogger({ logger: mockLogger });
                result = middleware(mockTopology, mockContext);
            });

            it("should set the custom logger on the empty context", () => {
                expect(mockContext.logger).toBe(mockLogger);
            });

            it("should return the topology unchanged", () => {
                expect(result).toEqual({ topology: mockTopology });
            });
        });

        describe("when called with a complex topology", () => {
            let complexTopology: any;

            beforeEach(async () => {
                complexTopology = {
                    vhosts: {
                        v1: {
                            queues: {
                                queue1: { durable: true },
                                queue2: { durable: false },
                            },
                            exchanges: {
                                exchange1: { type: "topic" },
                            },
                            bindings: [{ source: "exchange1", destination: "queue1" }],
                        },
                    },
                };
                const mod = await import("./withCustomLogger");
                const middleware = mod.withCustomLogger({ logger: mockLogger });
                result = middleware(complexTopology, mockContext);
            });

            it("should set the custom logger on the context", () => {
                expect(mockContext.logger).toBe(mockLogger);
            });

            it("should return the complex topology unchanged", () => {
                expect(result).toEqual({ topology: complexTopology });
            });
        });
    });
});
