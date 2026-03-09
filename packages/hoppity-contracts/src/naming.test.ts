/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

import {
    toSnakeCase,
    getExchangeName,
    getRoutingKey,
    getQueueName,
    getBindingName,
    getPublicationName,
    getSubscriptionName,
} from "./naming";

describe("hoppity-contracts > src > naming", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("toSnakeCase", () => {
        let result: string;

        describe("when given a simple camelCase string", () => {
            beforeEach(() => {
                result = toSnakeCase("availabilityByLocation");
            });

            it("should convert to snake_case", () => {
                expect(result).toBe("availability_by_location");
            });
        });

        describe("when given a PascalCase string", () => {
            beforeEach(() => {
                result = toSnakeCase("DonatedInventory");
            });

            it("should convert to snake_case", () => {
                expect(result).toBe("donated_inventory");
            });
        });

        describe("when given a string with consecutive capitals (acronym)", () => {
            beforeEach(() => {
                result = toSnakeCase("getHTTPResponse");
            });

            it("should treat the acronym as a single segment", () => {
                expect(result).toBe("get_http_response");
            });
        });

        describe("when given a leading-acronym PascalCase string", () => {
            beforeEach(() => {
                result = toSnakeCase("XMLParser");
            });

            it("should convert correctly", () => {
                expect(result).toBe("xml_parser");
            });
        });

        describe("when given an already-snake-case string", () => {
            beforeEach(() => {
                result = toSnakeCase("already_snake_case");
            });

            it("should return it unchanged (lowercased)", () => {
                expect(result).toBe("already_snake_case");
            });
        });

        describe("when given a single-letter word at the boundary", () => {
            beforeEach(() => {
                result = toSnakeCase("getAValue");
            });

            it("should handle single-letter words correctly", () => {
                expect(result).toBe("get_a_value");
            });
        });

        describe("when given a fully uppercase acronym string", () => {
            beforeEach(() => {
                result = toSnakeCase("RPC");
            });

            it("should return lowercased with no underscores", () => {
                expect(result).toBe("rpc");
            });
        });
    });

    describe("getExchangeName", () => {
        let result: string;

        describe("when operation type is event", () => {
            beforeEach(() => {
                result = getExchangeName("donated_inventory", "event");
            });

            it("should return the domain name as the exchange name", () => {
                expect(result).toBe("donated_inventory");
            });
        });

        describe("when operation type is command", () => {
            beforeEach(() => {
                result = getExchangeName("donated_inventory", "command");
            });

            it("should return the domain name as the exchange name", () => {
                expect(result).toBe("donated_inventory");
            });
        });

        describe("when operation type is rpc", () => {
            beforeEach(() => {
                result = getExchangeName("donated_inventory", "rpc");
            });

            it("should return the domain name suffixed with _rpc", () => {
                expect(result).toBe("donated_inventory_rpc");
            });
        });
    });

    describe("getRoutingKey", () => {
        let result: string;

        describe("when given an event operation with camelCase name", () => {
            beforeEach(() => {
                result = getRoutingKey("donated_inventory", "event", "itemCreated");
            });

            it("should return the full dot-delimited routing key with snake_case name", () => {
                expect(result).toBe("donated_inventory.event.item_created");
            });
        });

        describe("when given a command operation", () => {
            beforeEach(() => {
                result = getRoutingKey("inventory", "command", "reserveItem");
            });

            it("should return the full dot-delimited routing key", () => {
                expect(result).toBe("inventory.command.reserve_item");
            });
        });

        describe("when given an rpc operation", () => {
            beforeEach(() => {
                result = getRoutingKey("pricing", "rpc", "getQuote");
            });

            it("should return the full dot-delimited routing key", () => {
                expect(result).toBe("pricing.rpc.get_quote");
            });
        });
    });

    describe("getQueueName", () => {
        let result: string;

        describe("when given all components with a camelCase operation name", () => {
            beforeEach(() => {
                result = getQueueName("warehouse", "donated_inventory", "event", "itemCreated");
            });

            it("should return the underscore-delimited queue name", () => {
                expect(result).toBe("warehouse_donated_inventory_event_item_created");
            });
        });

        describe("when given an rpc operation", () => {
            beforeEach(() => {
                result = getQueueName("pricing_service", "pricing", "rpc", "getQuote");
            });

            it("should return the underscore-delimited queue name", () => {
                expect(result).toBe("pricing_service_pricing_rpc_get_quote");
            });
        });
    });

    describe("getBindingName", () => {
        let result: string;

        describe("when given a queue name", () => {
            beforeEach(() => {
                result = getBindingName("warehouse_donated_inventory_event_item_created");
            });

            it("should append _binding to the queue name", () => {
                expect(result).toBe("warehouse_donated_inventory_event_item_created_binding");
            });
        });
    });

    describe("getPublicationName", () => {
        let result: string;

        describe("when given an event operation", () => {
            beforeEach(() => {
                result = getPublicationName("donated_inventory", "event", "itemCreated");
            });

            it("should return the underscore-delimited publication name", () => {
                expect(result).toBe("donated_inventory_event_item_created");
            });
        });

        describe("when given an rpc operation", () => {
            beforeEach(() => {
                result = getPublicationName("pricing", "rpc", "getQuote");
            });

            it("should return the underscore-delimited publication name", () => {
                expect(result).toBe("pricing_rpc_get_quote");
            });
        });
    });

    describe("getSubscriptionName", () => {
        let result: string;

        describe("when given an event operation", () => {
            beforeEach(() => {
                result = getSubscriptionName("donated_inventory", "event", "itemCreated");
            });

            it("should return the underscore-delimited subscription name", () => {
                expect(result).toBe("donated_inventory_event_item_created");
            });
        });

        describe("when given a command operation", () => {
            beforeEach(() => {
                result = getSubscriptionName("inventory", "command", "reserveItem");
            });

            it("should return the underscore-delimited subscription name", () => {
                expect(result).toBe("inventory_command_reserve_item");
            });
        });
    });
});
