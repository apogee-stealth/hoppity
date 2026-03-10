/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockRestoreStock = jest.fn();
jest.mock("../../store", () => ({
    restoreStock: mockRestoreStock,
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

describe("catalog-service > messaging > handlers > onOrderCancelled", () => {
    let handler: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("onOrderCancelledHandler", () => {
        describe("when all items have known products", () => {
            beforeEach(async () => {
                const mod = await import("./onOrderCancelled");
                handler = mod.onOrderCancelledHandler.handler;

                mockRestoreStock.mockReturnValue(52);

                await handler(
                    {
                        orderId: "ORD-003",
                        items: [
                            {
                                productId: "gadget-1",
                                productName: "Gadget",
                                quantity: 2,
                                unitPrice: 17.99,
                                lineTotal: 35.98,
                            },
                        ],
                    },
                    {}
                );
            });

            it("should restore stock for each item", () => {
                expect(mockRestoreStock).toHaveBeenCalledTimes(1);
                expect(mockRestoreStock).toHaveBeenCalledWith("gadget-1", 2);
            });
        });

        describe("when an item has an unknown product", () => {
            beforeEach(async () => {
                const mod = await import("./onOrderCancelled");
                handler = mod.onOrderCancelledHandler.handler;

                mockRestoreStock.mockReturnValue(null);

                await handler(
                    {
                        orderId: "ORD-004",
                        items: [
                            {
                                productId: "unobtanium",
                                productName: "Unobtanium",
                                quantity: 1,
                                unitPrice: 0,
                                lineTotal: 0,
                            },
                        ],
                    },
                    {}
                );
            });

            it("should log a warning about the unknown product", () => {
                expect(mockLogger.warn).toHaveBeenCalledTimes(1);
                expect(mockLogger.warn).toHaveBeenCalledWith(
                    "orderCancelled: unknown product unobtanium — stock not adjusted"
                );
            });
        });
    });
});
