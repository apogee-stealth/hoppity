/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

describe("catalog-service > src > store", () => {
    let store: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("decrementStock", () => {
        describe("when the product exists and has sufficient stock", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.decrementStock("widget-1", 3);
            });

            it("should return the new stock level", () => {
                expect(result).toBe(97);
            });
        });

        describe("when decrementing would push stock below zero", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.decrementStock("gadget-1", 9999);
            });

            it("should clamp stock to zero rather than going negative", () => {
                expect(result).toBe(0);
            });
        });

        describe("when the product is unknown", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.decrementStock("unobtanium", 1);
            });

            it("should return null", () => {
                expect(result).toBeNull();
            });
        });
    });

    describe("restoreStock", () => {
        describe("when the product exists", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                store.decrementStock("widget-1", 5);
                result = store.restoreStock("widget-1", 5);
            });

            it("should return the restored stock level", () => {
                expect(result).toBe(100);
            });
        });

        describe("when the product is unknown", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.restoreStock("unobtanium", 10);
            });

            it("should return null", () => {
                expect(result).toBeNull();
            });
        });
    });

    describe("getAllProducts", () => {
        describe("on fresh module load", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                result = store.getAllProducts();
            });

            it("should return both seed products", () => {
                expect(result).toHaveLength(2);
            });

            it("should include widget-1 with initial stock of 100", () => {
                expect(result).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ productId: "widget-1", stock: 100 }),
                    ])
                );
            });

            it("should include gadget-1 with initial stock of 50", () => {
                expect(result).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ productId: "gadget-1", stock: 50 }),
                    ])
                );
            });

            it("should return copies so that mutations do not affect the store", () => {
                result[0].stock = 9999;
                const fresh = store.getAllProducts();
                expect(fresh[0].stock).not.toBe(9999);
            });
        });

        describe("after stock changes", () => {
            let result: any;

            beforeEach(async () => {
                store = await import("./store");
                store.decrementStock("widget-1", 10);
                store.restoreStock("gadget-1", 5);
                result = store.getAllProducts();
            });

            it("should reflect the decremented widget-1 stock", () => {
                const widget = result.find((p: any) => p.productId === "widget-1");
                expect(widget.stock).toBe(90);
            });

            it("should reflect the restored gadget-1 stock", () => {
                const gadget = result.find((p: any) => p.productId === "gadget-1");
                expect(gadget.stock).toBe(55);
            });
        });
    });
});
