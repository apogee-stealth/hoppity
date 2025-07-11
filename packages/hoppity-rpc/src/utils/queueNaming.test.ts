/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

import {
    generateReplyQueueName,
    generateInboundQueueName,
    generateRpcRoutingKey,
    generateServiceRpcBindingPattern,
} from "./queueNaming";

describe("hoppity-rpc > src > utils > queueNaming", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("with generateReplyQueueName", () => {
        let result: string;

        describe("when called with standard service name and instance ID", () => {
            beforeEach(() => {
                result = generateReplyQueueName("USER_SERVICE", "INSTANCE_8675309");
            });

            it("should return the expected reply queue name format", () => {
                expect(result).toBe("rpc_USER_SERVICE_INSTANCE_8675309_reply");
            });
        });

        describe("when called with service name containing hyphens and underscores", () => {
            beforeEach(() => {
                result = generateReplyQueueName("user-auth_service", "INSTANCE_123");
            });

            it("should return the expected reply queue name format", () => {
                expect(result).toBe("rpc_user_auth_service_INSTANCE_123_reply");
            });
        });

        describe("when called with empty inputs", () => {
            beforeEach(() => {
                result = generateReplyQueueName("", "");
            });

            it("should return the expected reply queue name format", () => {
                expect(result).toBe("rpc___reply");
            });
        });
    });

    describe("with generateInboundQueueName", () => {
        let result: string;

        describe("when called with standard service name and instance ID", () => {
            beforeEach(() => {
                result = generateInboundQueueName("ORDER_SERVICE", "INSTANCE_90210");
            });

            it("should return the expected inbound queue name format", () => {
                expect(result).toBe("rpc_ORDER_SERVICE_INSTANCE_90210_inbound");
            });
        });

        describe("when called with service name containing special characters", () => {
            beforeEach(() => {
                result = generateInboundQueueName("order-processing@service", "INSTANCE_456");
            });

            it("should return the expected inbound queue name format", () => {
                expect(result).toBe("rpc_order_processing_service_INSTANCE_456_inbound");
            });
        });

        describe("when called with empty inputs", () => {
            beforeEach(() => {
                result = generateInboundQueueName("", "");
            });

            it("should return the expected inbound queue name format", () => {
                expect(result).toBe("rpc___inbound");
            });
        });
    });

    describe("with generateRpcRoutingKey", () => {
        let result: string;

        describe("when called with standard RPC method name", () => {
            beforeEach(() => {
                result = generateRpcRoutingKey("getUserProfile");
            });

            it("should return the expected routing key format", () => {
                expect(result).toBe("rpc.getUserProfile.request");
            });
        });

        describe("when called with RPC name containing various formats", () => {
            beforeEach(() => {
                result = generateRpcRoutingKey("create_user_account_v2");
            });

            it("should return the expected routing key format", () => {
                expect(result).toBe("rpc.create_user_account_v2.request");
            });
        });

        describe("when called with empty RPC name", () => {
            beforeEach(() => {
                result = generateRpcRoutingKey("");
            });

            it("should return the expected routing key format", () => {
                expect(result).toBe("rpc..request");
            });
        });
    });

    describe("with generateServiceRpcBindingPattern", () => {
        let result: string;

        describe("when called with standard service name", () => {
            beforeEach(() => {
                result = generateServiceRpcBindingPattern("USER_SERVICE");
            });

            it("should return the expected binding pattern format", () => {
                expect(result).toBe("rpc.USER_SERVICE.#.request");
            });
        });

        describe("when called with service name containing special characters", () => {
            beforeEach(() => {
                result = generateServiceRpcBindingPattern("api-service@domain");
            });

            it("should return the expected binding pattern format", () => {
                expect(result).toBe("rpc.api-service@domain.#.request");
            });
        });

        describe("when called with empty service name", () => {
            beforeEach(() => {
                result = generateServiceRpcBindingPattern("");
            });

            it("should return the expected binding pattern format", () => {
                expect(result).toBe("rpc..#.request");
            });
        });
    });
});
