/**
 * Naming utilities for hoppity-contracts.
 *
 * All topology artifact names are derived mechanically from domain + operation
 * metadata. Nothing is hard-coded by callers. These functions are the single
 * source of truth for the naming scheme.
 */

/**
 * Converts a camelCase (or PascalCase) string to snake_case.
 *
 * Handles consecutive capitals correctly so that acronyms like "HTTP" or "RPC"
 * collapse to a single lowercase segment rather than producing multiple
 * underscores: "getHTTPResponse" → "get_http_response".
 *
 * Already-snake-case input is returned unchanged (aside from lowercasing).
 */
export function toSnakeCase(value: string): string {
    // Insert a separator before any uppercase letter that is:
    //   (a) preceded by a lowercase letter or digit, OR
    //   (b) followed by a lowercase letter and preceded by another uppercase
    //       (handles the interior of acronyms like "HTTPResponse" → "http_response")
    return value
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .toLowerCase();
}

/**
 * Returns the RabbitMQ exchange name for a domain + operation type.
 *
 * Events and commands share a single topic exchange per domain.
 * RPC operations get their own exchange to keep request/reply mechanics
 * isolated from pub/sub routing.
 *
 * @example
 * getExchangeName("donated_inventory", "event")   // → "donated_inventory"
 * getExchangeName("donated_inventory", "command") // → "donated_inventory"
 * getExchangeName("donated_inventory", "rpc")     // → "donated_inventory_rpc"
 */
export function getExchangeName(
    domain: string,
    operationType: "event" | "command" | "rpc"
): string {
    return operationType === "rpc" ? `${domain}_rpc` : domain;
}

/**
 * Returns the topic routing key for a domain operation.
 *
 * @example
 * getRoutingKey("donated_inventory", "event", "created") // → "donated_inventory.event.created"
 * getRoutingKey("inventory", "command", "reserveItem")   // → "inventory.command.reserve_item"
 */
export function getRoutingKey(
    domain: string,
    operationType: string,
    operationName: string
): string {
    return `${domain}.${operationType}.${toSnakeCase(operationName)}`;
}

/**
 * Returns the queue name for a service consuming a domain operation.
 *
 * @example
 * getQueueName("warehouse", "donated_inventory", "event", "created")
 *   // → "warehouse_donated_inventory_event_created"
 */
export function getQueueName(
    service: string,
    domain: string,
    operationType: string,
    operationName: string
): string {
    return `${service}_${domain}_${operationType}_${toSnakeCase(operationName)}`;
}

/**
 * Returns the binding name for a given queue name.
 *
 * @example
 * getBindingName("warehouse_donated_inventory_event_created")
 *   // → "warehouse_donated_inventory_event_created_binding"
 */
export function getBindingName(queueName: string): string {
    return `${queueName}_binding`;
}

/**
 * Returns the publication name for a domain operation.
 *
 * This is the name used in `broker.publish(publicationName, message)`.
 *
 * @example
 * getPublicationName("donated_inventory", "event", "created")
 *   // → "donated_inventory_event_created"
 */
export function getPublicationName(
    domain: string,
    operationType: string,
    operationName: string
): string {
    return `${domain}_${operationType}_${toSnakeCase(operationName)}`;
}

/**
 * Returns the subscription name for a domain operation.
 *
 * This is the name used when attaching a message handler.
 *
 * @example
 * getSubscriptionName("donated_inventory", "event", "created")
 *   // → "donated_inventory_event_created"
 */
export function getSubscriptionName(
    domain: string,
    operationType: string,
    operationName: string
): string {
    return `${domain}_${operationType}_${toSnakeCase(operationName)}`;
}
