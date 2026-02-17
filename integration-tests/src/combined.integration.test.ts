/* eslint-disable @typescript-eslint/no-explicit-any */
import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { RpcBroker, withRpcSupport } from "@apogeelabs/hoppity-rpc";
import { withSubscriptions } from "@apogeelabs/hoppity-subscriptions";
import { randomUUID } from "crypto";
import { createTestTopology } from "./helpers/createTestTopology";
import { silentLogger } from "./helpers/silentLogger";

describe("combined: multiple middleware on one broker", () => {
    describe("when logger + rpc + subscriptions middleware are all applied", () => {
        let serverBroker: RpcBroker;
        let clientBroker: RpcBroker;
        let rpcResult: any;
        let subscriptionMessages: any[];
        let subscriptionReceived: Promise<void>;
        let resolveSubscription: () => void;
        const RPC_EXCHANGE = "COMBINED_RPC_EXCHANGE";

        beforeAll(async () => {
            subscriptionMessages = [];
            subscriptionReceived = new Promise<void>(resolve => {
                resolveSubscription = resolve;
            });

            // Build a server broker with RPC + subscriptions
            const serverTopology = createTestTopology();
            const serverVhost = serverTopology.vhosts!["/"] as any;
            serverVhost.exchanges = {
                combined_events_exchange: {
                    type: "topic",
                    options: { durable: false, autoDelete: true },
                },
            };
            serverVhost.queues = {
                combined_events_queue: { options: { durable: false, autoDelete: true } },
            };
            serverVhost.bindings = {
                combined_events_binding: {
                    source: "combined_events_exchange",
                    destination: "combined_events_queue",
                    destinationType: "queue",
                    bindingKey: "#",
                },
            };
            serverVhost.publications = {
                combined_events_pub: { exchange: "combined_events_exchange" },
            };
            serverVhost.subscriptions = {
                combined_events_sub: { queue: "combined_events_queue" },
            };

            serverBroker = (await hoppity
                .withTopology(serverTopology)
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withRpcSupport({
                        serviceName: "COMBINED_SERVER",
                        instanceId: randomUUID(),
                        rpcExchange: RPC_EXCHANGE,
                        defaultTimeout: 10_000,
                    })
                )
                .use(
                    withSubscriptions({
                        combined_events_sub: (_message, content, ackOrNack) => {
                            subscriptionMessages.push(content);
                            ackOrNack();
                            resolveSubscription();
                        },
                    })
                )
                .build()) as RpcBroker;

            // Register an RPC handler on the server
            serverBroker.addRpcListener(
                "COMBINED_SERVER.greet",
                async (payload: { name: string }) => {
                    return { greeting: `HELLO_${payload.name}` };
                }
            );

            await new Promise(r => setTimeout(r, 500));

            // Build a client broker with just RPC
            clientBroker = (await hoppity
                .withTopology(createTestTopology())
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withRpcSupport({
                        serviceName: "COMBINED_CLIENT",
                        instanceId: randomUUID(),
                        rpcExchange: RPC_EXCHANGE,
                        defaultTimeout: 10_000,
                    })
                )
                .build()) as RpcBroker;

            // Exercise both RPC and subscription on the same broker
            rpcResult = await clientBroker.request("COMBINED_SERVER.greet", { name: "MCFLY" });
            await serverBroker.publish("combined_events_pub", {
                event: "FLUX_CAPACITOR_ENGAGED",
            });
            await subscriptionReceived;
        });

        afterAll(async () => {
            if (clientBroker) {
                await clientBroker.shutdown();
            }
            if (serverBroker) {
                await serverBroker.shutdown();
            }
        });

        it("should complete the RPC round-trip", () => {
            expect(rpcResult).toEqual({ greeting: "HELLO_MCFLY" });
        });

        it("should deliver the subscription message", () => {
            expect(subscriptionMessages).toHaveLength(1);
            expect(subscriptionMessages[0]).toEqual({
                event: "FLUX_CAPACITOR_ENGAGED",
            });
        });
    });
});
