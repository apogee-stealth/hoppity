/* eslint-disable @typescript-eslint/no-explicit-any */
import hoppity from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { DelayedPublishBroker, withDelayedPublish } from "@apogeelabs/hoppity-delayed-publish";
import { randomUUID } from "crypto";
import { createTestTopology } from "./helpers/createTestTopology";
import { silentLogger } from "./helpers/silentLogger";

describe("delayed-publish: message arrives after TTL expiry", () => {
    describe("when a message is published with a 2s delay", () => {
        let broker: DelayedPublishBroker;
        let receivedContent: any;
        let publishedAt: number;
        let receivedAt: number;
        const SERVICE_NAME = `DELAYED_TEST_${Date.now()}`;

        beforeAll(async () => {
            const topology = createTestTopology();
            const vhost = topology.vhosts!["/"] as any;

            // Set up the destination exchange/queue that the delayed message will be re-published to
            vhost.exchanges = {
                delayed_dest_exchange: {
                    type: "topic",
                    options: { durable: false, autoDelete: true },
                },
            };
            vhost.queues = {
                delayed_dest_queue: { options: { durable: false, autoDelete: true } },
            };
            vhost.bindings = {
                delayed_dest_binding: {
                    source: "delayed_dest_exchange",
                    destination: "delayed_dest_queue",
                    destinationType: "queue",
                    bindingKey: "#",
                },
            };
            vhost.publications = {
                delayed_dest_pub: { exchange: "delayed_dest_exchange" },
            };
            vhost.subscriptions = {
                delayed_dest_sub: { queue: "delayed_dest_queue" },
            };

            broker = (await hoppity
                .withTopology(topology)
                .use(withCustomLogger({ logger: silentLogger }))
                .use(
                    withDelayedPublish({
                        serviceName: SERVICE_NAME,
                        instanceId: randomUUID(),
                        defaultDelay: 2000,
                    })
                )
                .build()) as DelayedPublishBroker;

            // Set up a listener on the destination queue
            const messageReceived = new Promise<void>((resolve, reject) => {
                const timer = setTimeout(
                    () => reject(new Error("Timed out waiting for delayed message")),
                    15_000
                );
                broker.subscribe("delayed_dest_sub").then(sub => {
                    sub.on("message", (_msg, content, ackOrNack) => {
                        clearTimeout(timer);
                        receivedContent = content;
                        receivedAt = Date.now();
                        ackOrNack();
                        resolve();
                    });
                });
            });

            publishedAt = Date.now();
            await broker.delayedPublish("delayed_dest_pub", {
                order: "PIZZA_MARGHERITA",
                table: 42,
            });
            await messageReceived;
        }, 30_000);

        afterAll(async () => {
            if (broker) {
                await broker.shutdown();
            }
        });

        it("should deliver the message with the correct content", () => {
            expect(receivedContent).toEqual({
                order: "PIZZA_MARGHERITA",
                table: 42,
            });
        });

        it("should deliver the message after at least 1.5s", () => {
            const elapsed = receivedAt - publishedAt;
            expect(elapsed).toBeGreaterThanOrEqual(1500);
        });
    });
});
