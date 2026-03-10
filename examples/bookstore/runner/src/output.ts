/**
 * TUI formatting helpers for the bookstore demo runner.
 *
 * All output goes through these helpers to keep the main flow readable
 * and ensure consistent visual structure across steps.
 */

const LINE_WIDTH = 56;

/** Prints a step header with a step number and title. */
export function printStepHeader(stepNum: number, title: string): void {
    const label = `Step ${stepNum}: ${title}`;
    const padding = Math.max(0, LINE_WIDTH - label.length - 4);
    console.log(`\n━━━ ${label} ${"━".repeat(padding)}`);
}

/** Prints an outbound message/request arrow. */
export function printSend(message: string): void {
    console.log(`  → ${message}`);
}

/** Prints an inbound response. */
export function printReceive(message: string): void {
    console.log(`  ← ${message}`);
}

/** Prints an event notification with the lightning bolt prefix from the brief. */
export function printEvent(message: string): void {
    console.log(`  ⚡ ${message}`);
}

/** Prints a command send (fire-and-forget). */
export function printCommand(message: string): void {
    console.log(`  ⬦ ${message}`);
}

/** Prints a separator between major sections. */
export function printSeparator(): void {
    console.log(`\n${"─".repeat(LINE_WIDTH)}`);
}

interface ProductStock {
    productId: string;
    productName: string;
    stock: number;
}

/**
 * Prints before/after stock levels for all products.
 * Shows each product's stock delta on a single line.
 */
export function printStockLevels(
    before: ProductStock[],
    after: ProductStock[],
    label: string
): void {
    console.log(`     ${label}`);
    const afterByProductId = new Map(after.map(p => [p.productId, p]));
    for (const beforeProduct of before) {
        const afterProduct = afterByProductId.get(beforeProduct.productId);
        const afterStock = afterProduct?.stock ?? beforeProduct.stock;
        const delta = afterStock - beforeProduct.stock;
        const deltaStr = delta === 0 ? "(no change)" : delta > 0 ? `+${delta}` : `${delta}`;
        console.log(
            `     ${beforeProduct.productName.padEnd(10)} ${beforeProduct.stock} → ${afterStock}  (${deltaStr})`
        );
    }
}

/** Prints current stock levels without a before/after comparison. */
export function printCurrentStock(products: ProductStock[], label: string): void {
    console.log(`     ${label}`);
    for (const p of products) {
        console.log(`     ${p.productName.padEnd(10)} stock: ${p.stock}`);
    }
}

/** Formats an order summary as a readable string. */
export function formatOrderSummary(order: {
    orderId: string;
    items: Array<{ quantity: number; productName: string }>;
    total: number;
    status: string;
}): string {
    const itemsStr = order.items.map(i => `${i.quantity}x ${i.productName}`).join(", ");
    return `${order.orderId} | Status: ${order.status} | Items: ${itemsStr} | Total: $${order.total.toFixed(2)}`;
}
