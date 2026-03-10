/**
 * Shared custom middleware plugins used by both RPC services.
 *
 * `withBasicServiceComms` is a custom hoppity middleware (not part of the
 * hoppity package ecosystem) that demonstrates how to write your own
 * middleware to extend broker topology and capabilities.
 */
export { withBasicServiceComms } from "./withBasicServiceComms";
export type { BasicServiceCommsOptions, BasicServiceComms } from "./withBasicServiceComms";
