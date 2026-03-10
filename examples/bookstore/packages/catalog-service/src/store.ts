/**
 * In-memory catalog store. Seeded at startup with known products and stock counts.
 * Catalog-service only tracks stock — product names and prices live in order-service.
 * We carry names/prices here only so getStockLevels can return readable output.
 */
interface ProductEntry {
    productId: string;
    productName: string;
    unitPrice: number;
    stock: number;
}

const catalog = new Map<string, ProductEntry>([
    ["widget-1", { productId: "widget-1", productName: "Widget", unitPrice: 9.99, stock: 100 }],
    ["gadget-1", { productId: "gadget-1", productName: "Gadget", unitPrice: 17.99, stock: 50 }],
]);

/**
 * Decrements stock for a product by the given quantity.
 * Logs a warning if the product is unknown or stock goes negative.
 * Returns the new stock level, or null if the product is unknown.
 */
export function decrementStock(productId: string, quantity: number): number | null {
    const entry = catalog.get(productId);
    if (!entry) {
        return null;
    }
    entry.stock = Math.max(0, entry.stock - quantity);
    return entry.stock;
}

/**
 * Restores stock for a product by the given quantity.
 * Returns the new stock level, or null if the product is unknown.
 */
export function restoreStock(productId: string, quantity: number): number | null {
    const entry = catalog.get(productId);
    if (!entry) {
        return null;
    }
    entry.stock = entry.stock + quantity;
    return entry.stock;
}

/**
 * Returns all products with their current stock levels.
 */
export function getAllProducts(): Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    stock: number;
}> {
    return Array.from(catalog.values()).map(entry => ({ ...entry }));
}
