/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

describe("order-service > src > store", () => {
    let store: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("lookupProduct", () => {
        describe("when the product exists", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.lookupProduct("widget-1");
            });

            it("should return the product data", () => {
                expect(result).toEqual({
                    productId: "widget-1",
                    productName: "Widget",
                    unitPrice: 9.99,
                });
            });
        });

        describe("when the product does not exist", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.lookupProduct("turbo-encabulator");
            });

            it("should return null", () => {
                expect(result).toBeNull();
            });
        });
    });

    describe("createOrder", () => {
        describe("when all requested products are known", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.createOrder([
                    { productId: "widget-1", quantity: 2 },
                    { productId: "gadget-1", quantity: 1 },
                ]);
            });

            it("should assign ORD-001 as the first order ID", () => {
                expect(result.orderId).toBe("ORD-001");
            });

            it("should set status to active", () => {
                expect(result.status).toBe("active");
            });

            it("should resolve product names and unit prices in items", () => {
                expect(result.items).toEqual([
                    {
                        productId: "widget-1",
                        productName: "Widget",
                        quantity: 2,
                        unitPrice: 9.99,
                        lineTotal: 19.98,
                    },
                    {
                        productId: "gadget-1",
                        productName: "Gadget",
                        quantity: 1,
                        unitPrice: 17.99,
                        lineTotal: 17.99,
                    },
                ]);
            });

            it("should compute the correct order total", () => {
                expect(result.total).toBe(37.97);
            });
        });

        describe("when orders are created sequentially", () => {
            let first: any, second: any;

            beforeEach(async () => {
                store = await import("./store");
                first = store.createOrder([{ productId: "widget-1", quantity: 1 }]);
                second = store.createOrder([{ productId: "widget-1", quantity: 1 }]);
            });

            it("should assign ORD-001 to the first order", () => {
                expect(first.orderId).toBe("ORD-001");
            });

            it("should assign ORD-002 to the second order", () => {
                expect(second.orderId).toBe("ORD-002");
            });
        });

        describe("when a requested product is unknown", () => {
            let error: any;

            beforeEach(async () => {
                store = await import("./store");
                try {
                    store.createOrder([
                        { productId: "widget-1", quantity: 1 },
                        { productId: "flux-capacitor", quantity: 1 },
                    ]);
                } catch (err) {
                    error = err;
                }
            });

            it("should throw an error naming the unknown product", () => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe("Unknown product: flux-capacitor");
            });
        });
    });

    describe("getOrder", () => {
        describe("when the order exists", () => {
            let createdOrder: any, result: any;

            beforeEach(async () => {
                store = await import("./store");
                createdOrder = store.createOrder([{ productId: "widget-1", quantity: 1 }]);
                result = store.getOrder(createdOrder.orderId);
            });

            it("should return the order", () => {
                expect(result).toEqual(createdOrder);
            });
        });

        describe("when the order does not exist", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.getOrder("ORD-999");
            });

            it("should return null", () => {
                expect(result).toBeNull();
            });
        });
    });

    describe("cancelOrder", () => {
        describe("when the order exists", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                const created = store.createOrder([{ productId: "gadget-1", quantity: 2 }]);
                result = store.cancelOrder(created.orderId);
            });

            it("should return the updated order", () => {
                expect(result).not.toBeNull();
                expect(result.orderId).toBe("ORD-001");
            });

            it("should set the order status to cancelled", () => {
                expect(result.status).toBe("cancelled");
            });
        });

        describe("when the order does not exist", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.cancelOrder("ORD-404");
            });

            it("should return null", () => {
                expect(result).toBeNull();
            });
        });
    });
});
