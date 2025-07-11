/* eslint-disable @typescript-eslint/no-explicit-any */

const mockRascalBuilder = jest.fn();
jest.mock("./RascalBuilder", () => {
    return {
        RascalBuilder: mockRascalBuilder,
    };
});

export default {};

describe("packages > hoppity > src > hoppity", () => {
    let mockBuilderInstance: any, mockTopology: any, mockMiddleware: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockBuilderInstance = {
            use: jest.fn().mockReturnThis(),
            build: jest.fn().mockResolvedValue("BROKER_INSTANCE"),
        };
        mockRascalBuilder.mockImplementation(() => mockBuilderInstance);
        mockTopology = {
            vhosts: {
                "/": {
                    exchanges: {
                        "test-exchange": {
                            type: "topic",
                        },
                    },
                },
            },
        };
        mockMiddleware = jest.fn().mockReturnValue({
            topology: mockTopology,
        });
    });

    describe("with the hoppity object", () => {
        let hoppityModule: any;

        beforeEach(async () => {
            const mod = await import("./hoppity");
            hoppityModule = mod.default;
        });

        it("should export an object with withTopology and use methods", () => {
            expect(hoppityModule).toBeDefined();
            expect(typeof hoppityModule.withTopology).toBe("function");
            expect(typeof hoppityModule.use).toBe("function");
        });
    });

    describe("with withTopology", () => {
        let result: any;

        beforeEach(async () => {
            const mod = await import("./hoppity");
            result = mod.default.withTopology(mockTopology);
        });

        it("should create a new RascalBuilder instance with the provided topology", () => {
            expect(mockRascalBuilder).toHaveBeenCalledTimes(1);
            expect(mockRascalBuilder).toHaveBeenCalledWith(mockTopology);
        });

        it("should return the RascalBuilder instance", () => {
            expect(result).toBe(mockBuilderInstance);
        });

        describe("when called with an empty topology", () => {
            beforeEach(async () => {
                mockRascalBuilder.mockClear();
                const mod = await import("./hoppity");
                result = mod.default.withTopology({});
            });

            it("should create a new RascalBuilder instance with empty topology", () => {
                expect(mockRascalBuilder).toHaveBeenCalledTimes(1);
                expect(mockRascalBuilder).toHaveBeenCalledWith({});
            });
        });
    });

    describe("with use", () => {
        let result: any;

        beforeEach(async () => {
            const mod = await import("./hoppity");
            result = mod.default.use(mockMiddleware);
        });

        it("should create a new RascalBuilder instance with default empty topology", () => {
            expect(mockRascalBuilder).toHaveBeenCalledTimes(1);
            expect(mockRascalBuilder).toHaveBeenCalledWith();
        });

        it("should call use on the builder instance with the provided middleware", () => {
            expect(mockBuilderInstance.use).toHaveBeenCalledTimes(1);
            expect(mockBuilderInstance.use).toHaveBeenCalledWith(mockMiddleware);
        });

        it("should return the result of the builder's use method", () => {
            expect(result).toBe(mockBuilderInstance);
        });
    });

    describe("with method chaining", () => {
        let result: any;

        beforeEach(async () => {
            const mod = await import("./hoppity");
            result = mod.default.use(mockMiddleware).use(mockMiddleware);
        });

        it("should create a single RascalBuilder instance", () => {
            expect(mockRascalBuilder).toHaveBeenCalledTimes(1);
        });

        it("should call use twice on the builder instance", () => {
            expect(mockBuilderInstance.use).toHaveBeenCalledTimes(2);
            expect(mockBuilderInstance.use).toHaveBeenNthCalledWith(1, mockMiddleware);
            expect(mockBuilderInstance.use).toHaveBeenNthCalledWith(2, mockMiddleware);
        });

        it("should return the builder instance for chaining", () => {
            expect(result).toBe(mockBuilderInstance);
        });
    });
});
