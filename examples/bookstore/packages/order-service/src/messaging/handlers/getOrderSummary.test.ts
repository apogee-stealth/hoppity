/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockGetOrder = jest.fn();
jest.mock("../../store", () => ({
    getOrder: mockGetOrder,
}));

describe("order-service > messaging > handlers > getOrderSummary", () => {
    let handler: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("getOrderSummaryHandler", () => {
        describe("when the order exists", () => {
            let result: any;

            beforeEach(async () => {
                const mod = await import("./getOrderSummary");
                handler = mod.getOrderSummaryHandler.handler;

                mockGetOrder.mockReturnValue({
                    orderId: "ORD-007",
                    items: [],
                    total: 0,
                    status: "active",
                });

                result = await handler({ orderId: "ORD-007" }, {});
            });

            it("should return the order", () => {
                expect(result).toEqual({
                    orderId: "ORD-007",
                    items: [],
                    total: 0,
                    status: "active",
                });
            });
        });

        describe("when the order does not exist", () => {
            let error: any;

            beforeEach(async () => {
                const mod = await import("./getOrderSummary");
                handler = mod.getOrderSummaryHandler.handler;

                mockGetOrder.mockReturnValue(null);

                try {
                    await handler({ orderId: "ORD-404" }, {});
                } catch (err) {
                    error = err;
                }
            });

            it("should throw an error identifying the missing order", () => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe("Order not found: ORD-404");
            });
        });
    });
});
