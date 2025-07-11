/* eslint-disable @typescript-eslint/no-explicit-any */

import { BrokerConfig } from "rascal";
import { SubscriptionHandlers, ValidationResult } from "./types";

describe("hoppity-subscriptions > src > validation", () => {
    let mockTopology: BrokerConfig, mockHandlers: SubscriptionHandlers, result: ValidationResult;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockTopology = {
            vhosts: {
                "/": {
                    subscriptions: {
                        "test-subscription": {
                            queue: "test-queue",
                        },
                        "another-subscription": {
                            queue: "another-queue",
                        },
                    },
                },
            },
        };
        mockHandlers = {
            "test-subscription": jest.fn(),
            "another-subscription": jest.fn(),
        };
    });

    describe("with validateSubscriptionHandlers", () => {
        describe("when everything goes splendiferously", () => {
            beforeEach(async () => {
                const mod = await import("./validation");
                result = mod.validateSubscriptionHandlers(mockTopology, mockHandlers);
            });

            it("should return a valid result", () => {
                expect(result.isValid).toBe(true);
            });

            it("should return empty missingSubscriptions array", () => {
                expect(result.missingSubscriptions).toEqual([]);
            });

            it("should return empty invalidHandlers array", () => {
                expect(result.invalidHandlers).toEqual([]);
            });

            it("should return available subscriptions from topology", () => {
                expect(result.availableSubscriptions).toEqual([
                    "test-subscription",
                    "another-subscription",
                ]);
            });

            it("should not return an error message", () => {
                expect(result.errorMessage).toBeUndefined();
            });
        });

        describe("when handlers have missing subscriptions", () => {
            beforeEach(async () => {
                mockHandlers = {
                    "missing-subscription": jest.fn(),
                    "another-missing": jest.fn(),
                };
                const mod = await import("./validation");
                result = mod.validateSubscriptionHandlers(mockTopology, mockHandlers);
            });

            it("should return an invalid result", () => {
                expect(result.isValid).toBe(false);
            });

            it("should return missing subscription names", () => {
                expect(result.missingSubscriptions).toEqual([
                    "missing-subscription",
                    "another-missing",
                ]);
            });

            it("should return empty invalidHandlers array", () => {
                expect(result.invalidHandlers).toEqual([]);
            });

            it("should return available subscriptions from topology", () => {
                expect(result.availableSubscriptions).toEqual([
                    "test-subscription",
                    "another-subscription",
                ]);
            });

            it("should return an error message with missing subscriptions", () => {
                expect(result.errorMessage).toContain(
                    "Missing subscriptions: missing-subscription, another-missing"
                );
            });

            it("should include available subscriptions in error message", () => {
                expect(result.errorMessage).toContain(
                    "Available subscriptions: test-subscription, another-subscription"
                );
            });
        });

        describe("when handlers contain non-function values", () => {
            beforeEach(async () => {
                mockHandlers = {
                    "test-subscription": jest.fn(),
                    "invalid-handler": "not-a-function" as any,
                    "another-invalid": 42 as any,
                };
                const mod = await import("./validation");
                result = mod.validateSubscriptionHandlers(mockTopology, mockHandlers);
            });

            it("should return an invalid result", () => {
                expect(result.isValid).toBe(false);
            });

            it("should return missing subscription names for invalid handlers", () => {
                expect(result.missingSubscriptions).toEqual(["invalid-handler", "another-invalid"]);
            });

            it("should return invalid handler names", () => {
                expect(result.invalidHandlers).toEqual(["invalid-handler", "another-invalid"]);
            });

            it("should return an error message with invalid handlers", () => {
                expect(result.errorMessage).toContain(
                    "Invalid handlers (not functions): invalid-handler, another-invalid"
                );
            });
        });

        describe("when multiple validation errors occur", () => {
            beforeEach(async () => {
                mockHandlers = {
                    "missing-subscription": jest.fn(),
                    "invalid-handler": "not-a-function" as any,
                };
                const mod = await import("./validation");
                result = mod.validateSubscriptionHandlers(mockTopology, mockHandlers);
            });

            it("should return an invalid result", () => {
                expect(result.isValid).toBe(false);
            });

            it("should return all missing subscription names", () => {
                expect(result.missingSubscriptions).toEqual([
                    "missing-subscription",
                    "invalid-handler",
                ]);
            });

            it("should return all invalid handler names", () => {
                expect(result.invalidHandlers).toEqual(["invalid-handler"]);
            });

            it("should return an error message with all validation errors", () => {
                expect(result.errorMessage).toContain(
                    "Missing subscriptions: missing-subscription, invalid-handler"
                );
                expect(result.errorMessage).toContain(
                    "Invalid handlers (not functions): invalid-handler"
                );
            });
        });

        describe("when topology has no vhosts", () => {
            beforeEach(async () => {
                mockTopology = {};
                mockHandlers = {
                    "any-subscription": jest.fn(),
                };
                const mod = await import("./validation");
                result = mod.validateSubscriptionHandlers(mockTopology, mockHandlers);
            });

            it("should return an invalid result", () => {
                expect(result.isValid).toBe(false);
            });

            it("should return handler keys as missing subscriptions", () => {
                expect(result.missingSubscriptions).toEqual(["any-subscription"]);
            });

            it("should return empty availableSubscriptions array", () => {
                expect(result.availableSubscriptions).toEqual([]);
            });
        });

        describe("when vhost has no subscriptions", () => {
            beforeEach(async () => {
                mockTopology = {
                    vhosts: {
                        "/": {},
                    },
                };
                mockHandlers = {
                    "any-subscription": jest.fn(),
                };
                const mod = await import("./validation");
                result = mod.validateSubscriptionHandlers(mockTopology, mockHandlers);
            });

            it("should return an invalid result", () => {
                expect(result.isValid).toBe(false);
            });

            it("should return handler keys as missing subscriptions", () => {
                expect(result.missingSubscriptions).toEqual(["any-subscription"]);
            });

            it("should return empty availableSubscriptions array", () => {
                expect(result.availableSubscriptions).toEqual([]);
            });
        });

        describe("when topology has multiple vhosts", () => {
            beforeEach(async () => {
                mockTopology = {
                    vhosts: {
                        "/": {
                            subscriptions: {
                                "vhost1-subscription": {
                                    queue: "vhost1-queue",
                                },
                            },
                        },
                        "/vhost2": {
                            subscriptions: {
                                "vhost2-subscription": {
                                    queue: "vhost2-queue",
                                },
                            },
                        },
                    },
                };
                mockHandlers = {
                    "vhost1-subscription": jest.fn(),
                    "vhost2-subscription": jest.fn(),
                };
                const mod = await import("./validation");
                result = mod.validateSubscriptionHandlers(mockTopology, mockHandlers);
            });

            it("should return a valid result", () => {
                expect(result.isValid).toBe(true);
            });

            it("should return all available subscriptions from all vhosts", () => {
                expect(result.availableSubscriptions).toEqual([
                    "vhost1-subscription",
                    "vhost2-subscription",
                ]);
            });
        });

        describe("when handlers object is empty", () => {
            beforeEach(async () => {
                mockHandlers = {};
                const mod = await import("./validation");
                result = mod.validateSubscriptionHandlers(mockTopology, mockHandlers);
            });

            it("should return a valid result", () => {
                expect(result.isValid).toBe(true);
            });

            it("should return empty missingSubscriptions array", () => {
                expect(result.missingSubscriptions).toEqual([]);
            });

            it("should return empty invalidHandlers array", () => {
                expect(result.invalidHandlers).toEqual([]);
            });
        });
    });
});

export default {};
