/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockCreateOrder = jest.fn();
jest.mock("../../store", () => ({
    createOrder: mockCreateOrder,
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

describe("order-service > messaging > handlers > createOrder", () => {
    let handler: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("createOrderHandler", () => {
        describe("when the order is created successfully", () => {
            let result: any;
            let mockBroker: any;

            beforeEach(async () => {
                const mod = await import("./createOrder");
                handler = mod.createOrderHandler.handler;

                mockCreateOrder.mockReturnValue({
                    orderId: "ORD-001",
                    items: [
                        {
                            productId: "widget-1",
                            productName: "Widget",
                            quantity: 2,
                            unitPrice: 9.99,
                            lineTotal: 19.98,
                        },
                    ],
                    total: 19.98,
                    status: "active",
                });

                mockBroker = { publishEvent: jest.fn().mockResolvedValue(undefined) };

                result = await handler(
                    { items: [{ productId: "widget-1", quantity: 2 }] },
                    { broker: mockBroker }
                );
            });

            it("should return the created order", () => {
                expect(result).toEqual({
                    orderId: "ORD-001",
                    items: [
                        {
                            productId: "widget-1",
                            productName: "Widget",
                            quantity: 2,
                            unitPrice: 9.99,
                            lineTotal: 19.98,
                        },
                    ],
                    total: 19.98,
                    status: "active",
                });
            });

            it("should publish the orderCreated event", () => {
                expect(mockBroker.publishEvent).toHaveBeenCalledTimes(1);
                expect(mockBroker.publishEvent).toHaveBeenCalledWith(
                    expect.objectContaining({ routingKey: "orders.event.order_created" }),
                    {
                        orderId: "ORD-001",
                        items: [
                            {
                                productId: "widget-1",
                                productName: "Widget",
                                quantity: 2,
                                unitPrice: 9.99,
                                lineTotal: 19.98,
                            },
                        ],
                        total: 19.98,
                    }
                );
            });
        });
    });
});
