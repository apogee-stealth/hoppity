/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

import { Orders } from "./orders";

describe("bookstore-contracts > orders", () => {
    describe("Orders.events.orderCreated schema", () => {
        describe("when payload is valid", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.events.orderCreated.schema.safeParse({
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
                });
            });

            it("should parse successfully", () => {
                expect(result.success).toBe(true);
            });

            it("should return the full payload", () => {
                expect(result.data).toEqual({
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
                });
            });
        });

        describe("when orderId is missing", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.events.orderCreated.schema.safeParse({
                    items: [],
                    total: 0,
                });
            });

            it("should fail validation", () => {
                expect(result.success).toBe(false);
            });
        });

        describe("when items array contains an item with non-positive quantity", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.events.orderCreated.schema.safeParse({
                    orderId: "ORD-001",
                    items: [
                        {
                            productId: "widget-1",
                            productName: "Widget",
                            quantity: 0,
                            unitPrice: 9.99,
                            lineTotal: 0,
                        },
                    ],
                    total: 0,
                });
            });

            it("should fail validation", () => {
                expect(result.success).toBe(false);
            });
        });

        describe("when items array contains an item with non-integer quantity", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.events.orderCreated.schema.safeParse({
                    orderId: "ORD-001",
                    items: [
                        {
                            productId: "widget-1",
                            productName: "Widget",
                            quantity: 1.5,
                            unitPrice: 9.99,
                            lineTotal: 14.985,
                        },
                    ],
                    total: 14.985,
                });
            });

            it("should fail validation", () => {
                expect(result.success).toBe(false);
            });
        });
    });

    describe("Orders.events.orderCancelled schema", () => {
        describe("when payload is valid", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.events.orderCancelled.schema.safeParse({
                    orderId: "ORD-002",
                    items: [
                        {
                            productId: "gadget-1",
                            productName: "Gadget",
                            quantity: 1,
                            unitPrice: 17.99,
                            lineTotal: 17.99,
                        },
                    ],
                });
            });

            it("should parse successfully", () => {
                expect(result.success).toBe(true);
            });
        });

        describe("when items field is missing", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.events.orderCancelled.schema.safeParse({
                    orderId: "ORD-002",
                });
            });

            it("should fail validation", () => {
                expect(result.success).toBe(false);
            });
        });
    });

    describe("Orders.commands.cancelOrder schema", () => {
        describe("when payload is valid", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.commands.cancelOrder.schema.safeParse({
                    orderId: "ORD-003",
                });
            });

            it("should parse successfully", () => {
                expect(result.success).toBe(true);
            });
        });

        describe("when orderId is missing", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.commands.cancelOrder.schema.safeParse({});
            });

            it("should fail validation", () => {
                expect(result.success).toBe(false);
            });
        });
    });

    describe("Orders.rpc.createOrder request schema", () => {
        describe("when request is valid", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.rpc.createOrder.requestSchema.safeParse({
                    items: [{ productId: "widget-1", quantity: 3 }],
                });
            });

            it("should parse successfully", () => {
                expect(result.success).toBe(true);
            });
        });

        describe("when items array is empty", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.rpc.createOrder.requestSchema.safeParse({
                    items: [],
                });
            });

            it("should parse successfully — schema allows empty items array", () => {
                expect(result.success).toBe(true);
            });
        });

        describe("when an item has a non-positive quantity", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.rpc.createOrder.requestSchema.safeParse({
                    items: [{ productId: "widget-1", quantity: -1 }],
                });
            });

            it("should fail validation", () => {
                expect(result.success).toBe(false);
            });
        });

        describe("when items field is missing entirely", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.rpc.createOrder.requestSchema.safeParse({});
            });

            it("should fail validation", () => {
                expect(result.success).toBe(false);
            });
        });
    });

    describe("Orders.rpc.createOrder response schema", () => {
        describe("when response is valid with active status", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.rpc.createOrder.responseSchema.safeParse({
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
                    status: "active",
                });
            });

            it("should parse successfully", () => {
                expect(result.success).toBe(true);
            });
        });

        describe("when response is valid with cancelled status", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.rpc.createOrder.responseSchema.safeParse({
                    orderId: "ORD-001",
                    items: [],
                    total: 0,
                    status: "cancelled",
                });
            });

            it("should parse successfully", () => {
                expect(result.success).toBe(true);
            });
        });

        describe("when status is an unknown value", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.rpc.createOrder.responseSchema.safeParse({
                    orderId: "ORD-001",
                    items: [],
                    total: 0,
                    status: "pending",
                });
            });

            it("should fail validation", () => {
                expect(result.success).toBe(false);
            });
        });
    });

    describe("Orders.rpc.getOrderSummary request schema", () => {
        describe("when request is valid", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.rpc.getOrderSummary.requestSchema.safeParse({
                    orderId: "ORD-042",
                });
            });

            it("should parse successfully", () => {
                expect(result.success).toBe(true);
            });
        });

        describe("when orderId is missing", () => {
            let result: any;

            beforeEach(() => {
                result = Orders.rpc.getOrderSummary.requestSchema.safeParse({});
            });

            it("should fail validation", () => {
                expect(result.success).toBe(false);
            });
        });
    });

    describe("Orders domain metadata", () => {
        describe("routing keys and publication names", () => {
            it("should produce expected routing key for orderCreated event", () => {
                expect(Orders.events.orderCreated.routingKey).toBe("orders.event.order_created");
            });

            it("should produce expected routing key for orderCancelled event", () => {
                expect(Orders.events.orderCancelled.routingKey).toBe(
                    "orders.event.order_cancelled"
                );
            });

            it("should produce expected routing key for cancelOrder command", () => {
                expect(Orders.commands.cancelOrder.routingKey).toBe("orders.command.cancel_order");
            });

            it("should produce expected routing key for createOrder RPC", () => {
                expect(Orders.rpc.createOrder.routingKey).toBe("orders.rpc.create_order");
            });

            it("should produce expected routing key for getOrderSummary RPC", () => {
                expect(Orders.rpc.getOrderSummary.routingKey).toBe("orders.rpc.get_order_summary");
            });
        });
    });
});
