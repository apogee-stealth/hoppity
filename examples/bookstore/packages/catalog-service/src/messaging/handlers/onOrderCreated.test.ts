/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockDecrementStock = jest.fn();
jest.mock("../../store", () => ({
    decrementStock: mockDecrementStock,
}));

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
    critical: jest.fn(),
};
jest.mock("../../logger", () => ({
    logger: mockLogger,
}));

describe("catalog-service > messaging > handlers > onOrderCreated", () => {
    let handler: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("onOrderCreatedHandler", () => {
        describe("when all items have known products", () => {
            beforeEach(async () => {
                const mod = await import("./onOrderCreated");
                handler = mod.onOrderCreatedHandler.handler;

                mockDecrementStock.mockReturnValue(97);

                await handler(
                    {
                        orderId: "ORD-001",
                        items: [
                            {
                                productId: "widget-1",
                                productName: "Widget",
                                quantity: 3,
                                unitPrice: 9.99,
                                lineTotal: 29.97,
                            },
                        ],
                        total: 29.97,
                    },
                    {}
                );
            });

            it("should decrement stock for each item", () => {
                expect(mockDecrementStock).toHaveBeenCalledTimes(1);
                expect(mockDecrementStock).toHaveBeenCalledWith("widget-1", 3);
            });
        });

        describe("when an item has an unknown product", () => {
            beforeEach(async () => {
                const mod = await import("./onOrderCreated");
                handler = mod.onOrderCreatedHandler.handler;

                mockDecrementStock.mockReturnValue(null);

                await handler(
                    {
                        orderId: "ORD-002",
                        items: [
                            {
                                productId: "unobtanium",
                                productName: "Unobtanium",
                                quantity: 1,
                                unitPrice: 0,
                                lineTotal: 0,
                            },
                        ],
                        total: 0,
                    },
                    {}
                );
            });

            it("should log a warning about the unknown product", () => {
                expect(mockLogger.warn).toHaveBeenCalledTimes(1);
                expect(mockLogger.warn).toHaveBeenCalledWith(
                    "orderCreated: unknown product unobtanium — stock not adjusted"
                );
            });
        });
    });
});
