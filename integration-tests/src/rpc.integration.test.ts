/* eslint-disable @typescript-eslint/no-explicit-any */
import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { RpcBroker, withRpcSupport } from "@apogeelabs/hoppity-rpc";
import { randomUUID } from "crypto";
import { createTestTopology } from "./helpers/createTestTopology";
import { silentLogger } from "./helpers/silentLogger";

describe("rpc: request/response round-trip", () => {
    describe("when a handler is registered and a request is made", () => {
        let handlerBroker: RpcBroker;
        let requesterBroker: RpcBroker;
        let rpcResult: any;
        const RPC_EXCHANGE = "RPC_ROUNDTRIP_EXCHANGE";

        beforeAll(async () => {
            // Build the handler broker
            handlerBroker = (await hoppity
                .withTopology(createTestTopology())
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withRpcSupport({
                        serviceName: "RPC_HANDLER_SVC",
                        instanceId: randomUUID(),
                        rpcExchange: RPC_EXCHANGE,
                        defaultTimeout: 10_000,
                    })
                )
                .build()) as RpcBroker;

            // Register an echo handler — rpcName must include the handler's serviceName
            // so the routing key (rpc.RPC_HANDLER_SVC.echo.request) matches the binding (rpc.RPC_HANDLER_SVC.#.request)
            handlerBroker.addRpcListener(
                "RPC_HANDLER_SVC.echo",
                async (payload: { message: string }) => {
                    return { echoed: payload.message, handler: "RPC_HANDLER_SVC" };
                }
            );

            // Small delay to let the subscription settle
            await new Promise(r => setTimeout(r, 500));

            // Build the requester broker
            requesterBroker = (await hoppity
                .withTopology(createTestTopology())
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withRpcSupport({
                        serviceName: "RPC_REQUESTER_SVC",
                        instanceId: randomUUID(),
                        rpcExchange: RPC_EXCHANGE,
                        defaultTimeout: 10_000,
                    })
                )
                .build()) as RpcBroker;

            rpcResult = await requesterBroker.request("RPC_HANDLER_SVC.echo", {
                message: "TALK_TO_ME_GOOSE",
            });
        });

        afterAll(async () => {
            if (requesterBroker) {
                await requesterBroker.shutdown();
            }
            if (handlerBroker) {
                await handlerBroker.shutdown();
            }
        });

        it("should receive the response from the handler", () => {
            expect(rpcResult).toEqual({
                echoed: "TALK_TO_ME_GOOSE",
                handler: "RPC_HANDLER_SVC",
            });
        });
    });

    describe("when no handler is registered for the RPC method", () => {
        let requesterBroker: RpcBroker;
        let rpcError: Error;
        const RPC_EXCHANGE = "RPC_TIMEOUT_EXCHANGE";

        beforeAll(async () => {
            requesterBroker = (await hoppity
                .withTopology(createTestTopology())
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withRpcSupport({
                        serviceName: "RPC_LONELY_SVC",
                        instanceId: randomUUID(),
                        rpcExchange: RPC_EXCHANGE,
                        defaultTimeout: 3_000,
                    })
                )
                .build()) as RpcBroker;

            try {
                await requesterBroker.request("ghost_method", {
                    message: "ANYONE_HOME",
                });
            } catch (err) {
                rpcError = err as Error;
            }
        });

        afterAll(async () => {
            if (requesterBroker) {
                await requesterBroker.shutdown();
            }
        });

        it("should reject with a timeout error", () => {
            expect(rpcError).toBeDefined();
        });
    });

    describe("when the handler service is running but has no matching handler", () => {
        let handlerBroker: RpcBroker;
        let requesterBroker: RpcBroker;
        let rpcError: Error;
        const RPC_EXCHANGE = "RPC_NOT_FOUND_EXCHANGE";

        beforeAll(async () => {
            // Handler service is up, but only has a handler for "RPC_NOTFOUND_SVC.existingMethod"
            handlerBroker = (await hoppity
                .withTopology(createTestTopology())
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withRpcSupport({
                        serviceName: "RPC_NOTFOUND_SVC",
                        instanceId: randomUUID(),
                        rpcExchange: RPC_EXCHANGE,
                        defaultTimeout: 10_000,
                    })
                )
                .build()) as RpcBroker;

            handlerBroker.addRpcListener(
                "RPC_NOTFOUND_SVC.existingMethod",
                async () => ({ found: true })
            );

            await new Promise(r => setTimeout(r, 500));

            requesterBroker = (await hoppity
                .withTopology(createTestTopology())
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withRpcSupport({
                        serviceName: "RPC_NOTFOUND_REQUESTER",
                        instanceId: randomUUID(),
                        rpcExchange: RPC_EXCHANGE,
                        defaultTimeout: 5_000,
                    })
                )
                .build()) as RpcBroker;

            try {
                // Request a method the handler doesn't have registered
                await requesterBroker.request("RPC_NOTFOUND_SVC.bogusMethod", {
                    message: "E_RABBIT_HOLE",
                });
            } catch (err) {
                rpcError = err as Error;
            }
        });

        afterAll(async () => {
            if (requesterBroker) {
                await requesterBroker.shutdown();
            }
            if (handlerBroker) {
                await handlerBroker.shutdown();
            }
        });

        it("should reject with a METHOD_NOT_FOUND error", () => {
            expect(rpcError).toBeDefined();
            expect(rpcError.message).toContain("not found");
        });
    });

    describe("when the handler processes multiple sequential requests", () => {
        let handlerBroker: RpcBroker;
        let requesterBroker: RpcBroker;
        let results: any[];
        const RPC_EXCHANGE = "RPC_MULTI_EXCHANGE";

        beforeAll(async () => {
            handlerBroker = (await hoppity
                .withTopology(createTestTopology())
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withRpcSupport({
                        serviceName: "RPC_MULTI_HANDLER",
                        instanceId: randomUUID(),
                        rpcExchange: RPC_EXCHANGE,
                        defaultTimeout: 10_000,
                    })
                )
                .build()) as RpcBroker;

            handlerBroker.addRpcListener(
                "RPC_MULTI_HANDLER.add",
                async (payload: { a: number; b: number }) => {
                    return { sum: payload.a + payload.b };
                }
            );

            await new Promise(r => setTimeout(r, 500));

            requesterBroker = (await hoppity
                .withTopology(createTestTopology())
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withRpcSupport({
                        serviceName: "RPC_MULTI_REQUESTER",
                        instanceId: randomUUID(),
                        rpcExchange: RPC_EXCHANGE,
                        defaultTimeout: 10_000,
                    })
                )
                .build()) as RpcBroker;

            results = [];
            results.push(await requesterBroker.request("RPC_MULTI_HANDLER.add", { a: 2, b: 3 }));
            results.push(await requesterBroker.request("RPC_MULTI_HANDLER.add", { a: 40, b: 2 }));
            results.push(
                await requesterBroker.request("RPC_MULTI_HANDLER.add", { a: 8675, b: 309 })
            );
        });

        afterAll(async () => {
            if (requesterBroker) {
                await requesterBroker.shutdown();
            }
            if (handlerBroker) {
                await handlerBroker.shutdown();
            }
        });

        it("should return correct results for each request", () => {
            expect(results).toEqual([{ sum: 5 }, { sum: 42 }, { sum: 8984 }]);
        });
    });
});
