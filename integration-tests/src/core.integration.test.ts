/* eslint-disable @typescript-eslint/no-explicit-any */
import hoppity, { MiddlewareFunction } from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { BrokerAsPromised } from "rascal";
import { createTestTopology } from "./helpers/createTestTopology";
import { waitForMessage } from "./helpers/waitForMessage";
import { silentLogger } from "./helpers/silentLogger";

describe("core: builder -> real broker -> real topology", () => {
    describe("when building a broker with base topology", () => {
        let broker: BrokerAsPromised;
        let receivedMessage: any;

        beforeAll(async () => {
            const topology = createTestTopology();
            const vhost = topology.vhosts!["/"] as any;
            vhost.exchanges = {
                core_test_exchange: {
                    type: "topic",
                    options: { durable: false, autoDelete: true },
                },
            };
            vhost.queues = {
                core_test_queue: { options: { durable: false, autoDelete: true } },
            };
            vhost.bindings = {
                core_test_binding: {
                    source: "core_test_exchange",
                    destination: "core_test_queue",
                    destinationType: "queue",
                    bindingKey: "#",
                },
            };
            vhost.publications = {
                core_test_pub: { exchange: "core_test_exchange" },
            };
            vhost.subscriptions = {
                core_test_sub: { queue: "core_test_queue" },
            };

            broker = await hoppity.withTopology(topology).build();

            const messagePromise = waitForMessage(broker, "core_test_sub");
            await broker.publish("core_test_pub", { greeting: "HELLO_RABBIT" });
            receivedMessage = await messagePromise;
        });

        afterAll(async () => {
            if (broker) await broker.shutdown();
        });

        it("should create a broker", () => {
            expect(broker).toBeDefined();
        });

        it("should publish and receive a message through the real broker", () => {
            expect(receivedMessage).toEqual({ greeting: "HELLO_RABBIT" });
        });
    });

    describe("when applying middleware that modifies topology", () => {
        let broker: BrokerAsPromised;
        let receivedMessage: any;
        let callbackFired: boolean;

        beforeAll(async () => {
            callbackFired = false;

            const addTopology: MiddlewareFunction = (topology, _context) => {
                const modified = structuredClone(topology);
                const vhost = modified.vhosts!["/"] as any;
                vhost.exchanges = {
                    mw_test_exchange: {
                        type: "fanout",
                        options: { durable: false, autoDelete: true },
                    },
                };
                vhost.queues = {
                    mw_test_queue: { options: { durable: false, autoDelete: true } },
                };
                vhost.bindings = {
                    mw_test_binding: {
                        source: "mw_test_exchange",
                        destination: "mw_test_queue",
                        destinationType: "queue",
                        bindingKey: "",
                    },
                };
                vhost.publications = {
                    mw_test_pub: { exchange: "mw_test_exchange" },
                };
                vhost.subscriptions = {
                    mw_test_sub: { queue: "mw_test_queue" },
                };

                return {
                    topology: modified,
                    onBrokerCreated: async () => {
                        callbackFired = true;
                    },
                };
            };

            broker = await hoppity
                .withTopology(createTestTopology())
                .use(withCustomLogger({ logger: silentLogger }))
                .use(addTopology)
                .build();

            const messagePromise = waitForMessage(broker, "mw_test_sub");
            await broker.publish("mw_test_pub", { source: "MIDDLEWARE" });
            receivedMessage = await messagePromise;
        });

        afterAll(async () => {
            if (broker) {
                await broker.shutdown();
            }
        });

        it("should create a broker with middleware-defined topology", () => {
            expect(broker).toBeDefined();
        });

        it("should route messages through middleware-created exchanges and queues", () => {
            expect(receivedMessage).toEqual({ source: "MIDDLEWARE" });
        });

        it("should fire the onBrokerCreated callback", () => {
            expect(callbackFired).toBe(true);
        });
    });
});
