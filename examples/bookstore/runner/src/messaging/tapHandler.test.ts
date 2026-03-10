/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

describe("runner > src > messaging > tapHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("awaitTapEvent", () => {
        describe("when a matching tapHandler call arrives before the timeout", () => {
            let result: any;

            beforeEach(async () => {
                const mod = await import("./tapHandler");

                // Short timeout — the tapHandler call below resolves it synchronously
                const waitPromise = mod.awaitTapEvent("orders.event.order_created", 100);

                const mockMessage = { fields: { routingKey: "orders.event.order_created" } };
                mod.tapHandler(mockMessage, { orderId: "ORD-001" }, jest.fn(), {} as any);

                result = await waitPromise;
            });

            it("should resolve with the message content", () => {
                expect(result).toEqual({ orderId: "ORD-001" });
            });
        });

        describe("when the timeout fires before a matching event arrives", () => {
            let error: any;

            beforeEach(async () => {
                const mod = await import("./tapHandler");

                try {
                    // 50ms real timeout — no matching tapHandler call fires, so it times out fast
                    await mod.awaitTapEvent("orders.event.order_created", 50);
                } catch (err) {
                    error = err;
                }
            });

            it("should reject with a timeout error naming the routing key and duration", () => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain("orders.event.order_created");
                expect(error.message).toContain("50ms");
            });
        });
    });

    describe("tapHandler", () => {
        describe("when the routing key matches a pending waiter", () => {
            let mockAckOrNack: any;

            beforeEach(async () => {
                const mod = await import("./tapHandler");

                // Short timeout — tapHandler call below resolves it synchronously
                mod.awaitTapEvent("orders.event.order_cancelled", 100);

                mockAckOrNack = jest.fn();
                const mockMessage = { fields: { routingKey: "orders.event.order_cancelled" } };

                mod.tapHandler(
                    mockMessage,
                    { orderId: "ORD-002", items: [] },
                    mockAckOrNack,
                    {} as any
                );
            });

            it("should call ackOrNack", () => {
                expect(mockAckOrNack).toHaveBeenCalledTimes(1);
            });
        });

        describe("when the routing key does not match any pending waiter", () => {
            let mockAckOrNack: any;

            beforeEach(async () => {
                const mod = await import("./tapHandler");

                mockAckOrNack = jest.fn();
                const mockMessage = { fields: { routingKey: "orders.event.some_other_event" } };

                mod.tapHandler(mockMessage, { orderId: "ORD-003" }, mockAckOrNack, {} as any);
            });

            it("should still call ackOrNack so the message is acknowledged", () => {
                expect(mockAckOrNack).toHaveBeenCalledTimes(1);
            });
        });

        describe("when message.fields is missing", () => {
            let mockAckOrNack: any;

            beforeEach(async () => {
                const mod = await import("./tapHandler");

                mockAckOrNack = jest.fn();
                // fields is undefined — routingKey falls back to ""
                const mockMessage = {};

                mod.tapHandler(mockMessage as any, {}, mockAckOrNack, {} as any);
            });

            it("should still call ackOrNack rather than throwing", () => {
                expect(mockAckOrNack).toHaveBeenCalledTimes(1);
            });
        });
    });
});
