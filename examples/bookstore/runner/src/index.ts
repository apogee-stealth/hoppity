import { getBroker } from "./messaging/broker";
import { spawnService, killAll } from "./processManager";
import { config } from "./config";
import {
    printStepHeader,
    printSend,
    printReceive,
    printEvent,
    printCommand,
    printSeparator,
    printStockLevels,
    printCurrentStock,
    formatOrderSummary,
} from "./output";
import { OrdersDomain, CatalogDomain } from "@bookstore/contracts";

/**
 * Bookstore Demo Runner
 *
 * Spawns order-service and catalog-service, then executes a scripted flow
 * demonstrating contracts and typed operations.
 *
 * Set 1 — Create & Query:
 *   createOrder (RPC) → orderCreated (event) → getOrderSummary (RPC)
 *
 * Set 2 — Cancel & Query:
 *   cancelOrder (command) → orderCancelled (event) → getOrderSummary (RPC)
 *
 * Note: v1 removed the outbound tap exchange, so event observation is replaced
 * with a brief pause to allow catalog-service time to process the event before
 * querying stock levels.
 */

async function pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Bookstore Example — Hoppity v1 Contract-Driven Demo");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // --- Phase 1: Spawn services and wait for readiness ---
    console.log("Spawning services...\n");

    try {
        await Promise.all([
            spawnService(
                "order-service",
                config.services.orderService,
                config.serviceReadyTimeoutMs
            ),
            spawnService(
                "catalog-service",
                config.services.catalogService,
                config.serviceReadyTimeoutMs
            ),
        ]);
    } catch (err) {
        console.error("\nFailed to start services:", err instanceof Error ? err.message : err);
        await killAll();
        process.exit(1);
    }

    console.log("\nBoth services ready. Connecting runner broker...\n");

    let broker;
    try {
        broker = await getBroker();
    } catch (err) {
        console.error("Failed to connect runner broker:", err instanceof Error ? err.message : err);
        await killAll();
        process.exit(1);
    }

    const shutdown = async () => {
        console.log("\nShutting down...");
        try {
            await broker.shutdown();
        } catch {
            // Non-fatal
        }
        await killAll();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    try {
        // --- Phase 2: Initial stock snapshot ---
        printSeparator();
        console.log("\n  Initial Stock Levels");
        const initialStock = await broker.request(CatalogDomain.rpc.getStockLevels, {});
        printCurrentStock(initialStock.products, "Before any orders:");

        // ───────────────────────────────────────────────────────────
        // SET 1: Create & Query
        // ───────────────────────────────────────────────────────────

        printStepHeader(1, "Create Order (RPC)");
        printSend("createOrder RPC → order-service");
        const createdOrder = await broker.request(OrdersDomain.rpc.createOrder, {
            items: [
                { productId: "widget-1", quantity: 3 },
                { productId: "gadget-1", quantity: 1 },
            ],
        });
        printReceive(
            `Order ${createdOrder.orderId} created (${createdOrder.items.length} items, $${createdOrder.total.toFixed(2)})`
        );

        const orderId = createdOrder.orderId;

        printStepHeader(2, "Order Created Event (waiting for catalog-service)");
        printSend("Pausing to allow catalog-service to process orderCreated...");
        // Give catalog-service time to receive and process the orderCreated event
        // before querying stock. Without the outbound tap, we use a timed pause.
        await pause(2000);
        printEvent(`catalog-service received orderCreated — stock decremented`);

        const stockAfterCreate = await broker.request(CatalogDomain.rpc.getStockLevels, {});
        printStockLevels(
            initialStock.products,
            stockAfterCreate.products,
            `Stock changes after ${orderId}:`
        );

        printStepHeader(3, "Get Order Summary (RPC)");
        printSend(`getOrderSummary RPC for ${orderId}`);
        const summaryAfterCreate = await broker.request(OrdersDomain.rpc.getOrderSummary, {
            orderId,
        });
        printReceive(formatOrderSummary(summaryAfterCreate));

        await pause(1000);

        // ───────────────────────────────────────────────────────────
        // SET 2: Cancel & Query
        // ───────────────────────────────────────────────────────────

        printStepHeader(4, "Cancel Order (Command)");
        printCommand(`cancelOrder command → order-service (orderId: ${orderId})`);
        await broker.sendCommand(OrdersDomain.commands.cancelOrder, { orderId });
        printReceive("Command sent (fire-and-forget)");

        printStepHeader(5, "Order Cancelled Event (waiting for catalog-service)");
        printSend("Pausing to allow catalog-service to process orderCancelled...");
        // Same timed-pause approach as step 2
        await pause(2000);
        printEvent(`catalog-service received orderCancelled — stock restored`);

        const stockAfterCancel = await broker.request(CatalogDomain.rpc.getStockLevels, {});
        printStockLevels(
            stockAfterCreate.products,
            stockAfterCancel.products,
            `Stock restoration after cancellation of ${orderId}:`
        );

        printStepHeader(6, "Get Order Summary (RPC)");
        printSend(`getOrderSummary RPC for ${orderId} (after cancellation)`);
        const summaryAfterCancel = await broker.request(OrdersDomain.rpc.getOrderSummary, {
            orderId,
        });
        printReceive(formatOrderSummary(summaryAfterCancel));

        // --- Done ---
        printSeparator();
        console.log("\n  Demo complete. All 6 steps finished successfully.");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    } catch (err) {
        console.error("\nDemo flow failed:", err instanceof Error ? err.message : err);
        await shutdown();
        return;
    }

    await shutdown();
}

main();
