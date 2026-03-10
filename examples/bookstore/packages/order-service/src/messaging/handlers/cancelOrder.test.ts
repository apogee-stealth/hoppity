/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockCancelOrder = jest.fn();
jest.mock("../../store", () => ({
    cancelOrder: mockCancelOrder,
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

describe("order-service > messaging > handlers > cancelOrder", () => {
    let handler: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("cancelOrderHandler", () => {
        describe("when the order exists", () => {
            let mockBroker: any;

            beforeEach(async () => {
                const mod = await import("./cancelOrder");
                handler = mod.cancelOrderHandler.handler;

                mockCancelOrder.mockReturnValue({
                    orderId: "ORD-003",
                    items: [
                        {
                            productId: "gadget-1",
                            productName: "Gadget",
                            quantity: 1,
                            unitPrice: 17.99,
                            lineTotal: 17.99,
                        },
                    ],
                    total: 17.99,
                    status: "cancelled",
                });

                mockBroker = { publishEvent: jest.fn().mockResolvedValue(undefined) };

                await handler({ orderId: "ORD-003" }, { broker: mockBroker });
            });

            it("should publish the orderCancelled event with the order items", () => {
                expect(mockBroker.publishEvent).toHaveBeenCalledTimes(1);
                expect(mockBroker.publishEvent).toHaveBeenCalledWith(
                    expect.objectContaining({ routingKey: "orders.event.order_cancelled" }),
                    {
                        orderId: "ORD-003",
                        items: [
                            {
                                productId: "gadget-1",
                                productName: "Gadget",
                                quantity: 1,
                                unitPrice: 17.99,
                                lineTotal: 17.99,
                            },
                        ],
                    }
                );
            });
        });

        describe("when the order does not exist", () => {
            let mockBroker: any;

            beforeEach(async () => {
                const mod = await import("./cancelOrder");
                handler = mod.cancelOrderHandler.handler;

                mockCancelOrder.mockReturnValue(null);

                mockBroker = { publishEvent: jest.fn() };

                await handler({ orderId: "ORD-999" }, { broker: mockBroker });
            });

            it("should log a warning about the missing order", () => {
                expect(mockLogger.warn).toHaveBeenCalledTimes(1);
                expect(mockLogger.warn).toHaveBeenCalledWith(
                    "cancelOrder: order not found — ORD-999"
                );
            });

            it("should not publish any event", () => {
                expect(mockBroker.publishEvent).not.toHaveBeenCalled();
            });
        });
    });
});
