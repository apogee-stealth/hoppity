/**
 * Utility functions for generating consistent queue names and routing keys
 * for RPC communication
 */

/**
 * Generates the name for a service's RPC reply queue
 *
 * @param serviceName - The name of the service
 * @param instanceId - The unique instance identifier
 * @returns The reply queue name
 */
export function generateReplyQueueName(serviceName: string, instanceId: string): string {
    const safeServiceName = serviceName.replace(/[^a-zA-Z0-9]/g, "_");
    const safeInstanceId = instanceId.replace(/[^a-zA-Z0-9]/g, "_");
    return `rpc_${safeServiceName}_${safeInstanceId}_reply`;
}

/**
 * Generates the name for a service's RPC inbound queue
 *
 * @param serviceName - The name of the service
 * @param instanceId - The unique instance identifier
 * @returns The inbound queue name
 */
export function generateInboundQueueName(serviceName: string, instanceId: string): string {
    const safeServiceName = serviceName.replace(/[^a-zA-Z0-9]/g, "_");
    const safeInstanceId = instanceId.replace(/[^a-zA-Z0-9]/g, "_");
    return `rpc_${safeServiceName}_${safeInstanceId}_inbound`;
}

/**
 * Generates the routing key for an RPC request
 *
 * @param rpcName - The name of the RPC method
 * @returns The routing key for the request
 */
export function generateRpcRoutingKey(rpcName: string): string {
    return `rpc.${rpcName}.request`;
}

/**
 * Generates the binding pattern for a service's RPC requests
 * This pattern will match all RPC requests for the given service
 *
 * @param serviceName - The name of the service
 * @returns The binding pattern for the service's RPC requests
 */
export function generateServiceRpcBindingPattern(serviceName: string): string {
    return `rpc.${serviceName}.#.request`;
}
