/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockGetAllProducts = jest.fn();
jest.mock("../../store", () => ({
    getAllProducts: mockGetAllProducts,
}));

describe("catalog-service > messaging > handlers > getStockLevels", () => {
    let handler: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("getStockLevelsHandler", () => {
        describe("when products are available", () => {
            let result: any;

            beforeEach(async () => {
                const mod = await import("./getStockLevels");
                handler = mod.getStockLevelsHandler.handler;

                mockGetAllProducts.mockReturnValue([
                    {
                        productId: "widget-1",
                        productName: "Widget",
                        unitPrice: 9.99,
                        stock: 97,
                    },
                    {
                        productId: "gadget-1",
                        productName: "Gadget",
                        unitPrice: 17.99,
                        stock: 49,
                    },
                ]);

                result = await handler({}, {});
            });

            it("should return a products array wrapping all store products", () => {
                expect(result).toEqual({
                    products: [
                        {
                            productId: "widget-1",
                            productName: "Widget",
                            unitPrice: 9.99,
                            stock: 97,
                        },
                        {
                            productId: "gadget-1",
                            productName: "Gadget",
                            unitPrice: 17.99,
                            stock: 49,
                        },
                    ],
                });
            });
        });

        describe("when the catalog is empty", () => {
            let result: any;

            beforeEach(async () => {
                const mod = await import("./getStockLevels");
                handler = mod.getStockLevelsHandler.handler;

                mockGetAllProducts.mockReturnValue([]);

                result = await handler({}, {});
            });

            it("should return an empty products array", () => {
                expect(result).toEqual({ products: [] });
            });
        });
    });
});
