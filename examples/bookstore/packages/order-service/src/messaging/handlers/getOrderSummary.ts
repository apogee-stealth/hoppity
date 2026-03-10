import { onRpc } from "@apogeelabs/hoppity-operations";
import { Orders } from "@bookstore/contracts";
import { getOrder } from "../../store";

/**
 * Handles getOrderSummary RPC — looks up the order and returns its current state.
 * Throws if the order is not found so the caller gets an RPC error response
 * rather than a silent null.
 */
export const getOrderSummaryHandler = onRpc(
    Orders.rpc.getOrderSummary,
    async (request, _context) => {
        const order = getOrder(request.orderId);
        if (!order) {
            throw new Error(`Order not found: ${request.orderId}`);
        }
        return order;
    }
);
