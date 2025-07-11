/* eslint-disable @typescript-eslint/no-explicit-any */

const mockValidateSubscriptionHandlers = jest.fn();
jest.mock("./validation", () => {
    return { validateSubscriptionHandlers: mockValidateSubscriptionHandlers };
});

const mockSubscription = {
    on: jest.fn(),
};

const mockBroker = {
    subscribe: jest.fn().mockResolvedValue(mockSubscription),
};

describe("hoppity-subscriptions > src > withSubscriptions", () => {
    let withSubscriptions: any, mockHandlers: any, mockTopology: any, result: any, mockContext: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockContext = {
            data: {} as any,
            logger: {
                info: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
            },
        };
        mockHandlers = {
            "test-subscription": jest.fn(),
            "another-subscription": jest.fn(),
        };
        mockTopology = {
            vhosts: {
                "/": {
                    subscriptions: {
                        "test-subscription": {},
                        "another-subscription": {},
                    },
                },
            },
        };
        mockValidateSubscriptionHandlers.mockReturnValue({
            isValid: true,
            missingSubscriptions: [],
            availableSubscriptions: ["test-subscription", "another-subscription"],
            invalidHandlers: [],
        });
    });

    describe("with the withSubscriptions function", () => {
        beforeEach(async () => {
            const mod = await import("./withSubscriptions");
            withSubscriptions = mod.withSubscriptions;
        });

        beforeEach(() => {
            const middleware = withSubscriptions(mockHandlers);
            result = middleware;
        });

        it("should return a middleware function", () => {
            expect(typeof result).toBe("function");
        });

        describe("when validation passes", () => {
            beforeEach(() => {
                const middleware = withSubscriptions(mockHandlers);
                result = middleware(mockTopology, mockContext);
            });

            it("should call validateSubscriptionHandlers with the expected arguments", () => {
                expect(mockValidateSubscriptionHandlers).toHaveBeenCalledWith(
                    mockTopology,
                    mockHandlers
                );
            });

            it("should track validated subscriptions in context data", () => {
                expect(mockContext.data.validatedSubscriptions).toEqual([
                    "test-subscription",
                    "another-subscription",
                ]);
            });

            it("should log info about validated subscriptions", () => {
                expect(mockContext.logger.info).toHaveBeenCalledWith(
                    "Validated 2 subscription handlers: test-subscription, another-subscription"
                );
            });

            it("should return topology unchanged", () => {
                expect(result.topology).toBe(mockTopology);
            });

            it("should return onBrokerCreated callback", () => {
                expect(typeof result.onBrokerCreated).toBe("function");
            });
        });

        describe("when validation fails", () => {
            beforeEach(() => {
                mockValidateSubscriptionHandlers.mockReturnValue({
                    isValid: false,
                    missingSubscriptions: ["missing-sub"],
                    availableSubscriptions: ["test-subscription"],
                    invalidHandlers: [],
                    errorMessage:
                        "Subscription validation failed: Missing subscriptions: missing-sub. Available subscriptions: test-subscription",
                });
                const middleware = withSubscriptions(mockHandlers);
                try {
                    middleware(mockTopology, mockContext);
                } catch (err) {
                    result = err;
                }
            });

            it("should throw an error with the validation message", () => {
                expect(result.toString()).toMatch(
                    "Subscription validation failed: Missing subscriptions: missing-sub. Available subscriptions: test-subscription"
                );
            });
        });
    });

    describe("with the onBrokerCreated callback", () => {
        let onBrokerCreated: any;

        beforeEach(async () => {
            const middleware = withSubscriptions(mockHandlers);
            result = middleware(mockTopology, mockContext);
            onBrokerCreated = result.onBrokerCreated;
        });

        describe("when setup succeeds", () => {
            beforeEach(async () => {
                await onBrokerCreated(mockBroker);
            });

            it("should subscribe to all handler subscriptions", () => {
                expect(mockBroker.subscribe).toHaveBeenCalledTimes(2);
                expect(mockBroker.subscribe).toHaveBeenNthCalledWith(1, "test-subscription");
                expect(mockBroker.subscribe).toHaveBeenNthCalledWith(2, "another-subscription");
            });

            it("should set up message event handlers", () => {
                expect(mockSubscription.on).toHaveBeenCalledWith("message", expect.any(Function));
            });

            it("should set up error event handlers", () => {
                expect(mockSubscription.on).toHaveBeenCalledWith("error", expect.any(Function));
            });

            it("should set up invalid_content event handlers", () => {
                expect(mockSubscription.on).toHaveBeenCalledWith(
                    "invalid_content",
                    expect.any(Function)
                );
            });

            it("should log success for each subscription", () => {
                expect(mockContext.logger.info).toHaveBeenCalledWith(
                    "Successfully set up subscription handler for 'test-subscription'"
                );
                expect(mockContext.logger.info).toHaveBeenCalledWith(
                    "Successfully set up subscription handler for 'another-subscription'"
                );
            });

            it("should log final success message", () => {
                expect(mockContext.logger.info).toHaveBeenCalledWith(
                    "Successfully set up 2 subscription handlers"
                );
            });
        });

        describe("when subscription setup fails", () => {
            let setupError: any;

            beforeEach(async () => {
                setupError = new Error("E_SUBSCRIPTION_SETUP_FAILED");
                mockBroker.subscribe.mockRejectedValueOnce(setupError);
                try {
                    await onBrokerCreated(mockBroker);
                } catch (err) {
                    result = err;
                }
            });

            it("should log error and re-throw", () => {
                expect(result.toString()).toMatch("E_SUBSCRIPTION_SETUP_FAILED");
                expect(mockContext.logger.error).toHaveBeenCalledWith(
                    "Failed to set up subscription handler for 'test-subscription':",
                    setupError
                );
            });
        });

        describe("with message event handler", () => {
            let messageHandler: any, mockMessage: any, mockContent: any, mockAckOrNack: any;

            beforeEach(async () => {
                mockMessage = { properties: { messageId: "MSG_123" } };
                mockContent = { data: "test data" };
                mockAckOrNack = jest.fn();
                await onBrokerCreated(mockBroker);
                // Find the message handler from the mock calls
                const messageCall = mockSubscription.on.mock.calls.find(
                    (call: any) => call[0] === "message"
                );
                if (!messageCall) {
                    throw new Error("Message handler not found in mock calls");
                }
                messageHandler = messageCall[1];
            });

            describe("when handler succeeds synchronously", () => {
                beforeEach(() => {
                    mockHandlers["test-subscription"].mockReturnValue(undefined);
                    messageHandler(mockMessage, mockContent, mockAckOrNack);
                });

                it("should call the handler with correct arguments", () => {
                    expect(mockHandlers["test-subscription"]).toHaveBeenCalledWith(
                        mockMessage,
                        mockContent,
                        mockAckOrNack,
                        mockBroker
                    );
                });

                it("should not call ackOrNack", () => {
                    expect(mockAckOrNack).not.toHaveBeenCalled();
                });
            });

            describe("when handler succeeds asynchronously", () => {
                beforeEach(async () => {
                    mockHandlers["test-subscription"].mockResolvedValue(undefined);
                    messageHandler(mockMessage, mockContent, mockAckOrNack);
                    // Wait for async handler to complete
                    await new Promise(resolve => setTimeout(resolve, 0));
                });

                it("should call the handler with correct arguments", () => {
                    expect(mockHandlers["test-subscription"]).toHaveBeenCalledWith(
                        mockMessage,
                        mockContent,
                        mockAckOrNack,
                        mockBroker
                    );
                });

                it("should not call ackOrNack", () => {
                    expect(mockAckOrNack).not.toHaveBeenCalled();
                });
            });

            describe("when handler throws synchronously", () => {
                let handlerError: any;

                describe("and the error is an Error instance", () => {
                    beforeEach(() => {
                        handlerError = new Error("E_HANDLER_SYNC_ERROR");
                        mockHandlers["test-subscription"].mockImplementation(() => {
                            throw handlerError;
                        });
                        messageHandler(mockMessage, mockContent, mockAckOrNack);
                    });

                    it("should log the error", () => {
                        expect(mockContext.logger.error).toHaveBeenCalledWith(
                            "Error in subscription handler for 'test-subscription':",
                            handlerError
                        );
                    });

                    it("should call ackOrNack with the error", () => {
                        expect(mockAckOrNack).toHaveBeenCalledWith(handlerError);
                    });
                });

                describe("and the error is not an Error instance", () => {
                    beforeEach(() => {
                        handlerError = "E_HANDLER_SYNC_ERROR";
                        mockHandlers["test-subscription"].mockImplementation(() => {
                            throw handlerError;
                        });
                        messageHandler(mockMessage, mockContent, mockAckOrNack);
                    });

                    it("should log the error", () => {
                        expect(mockContext.logger.error).toHaveBeenCalledWith(
                            "Error in subscription handler for 'test-subscription':",
                            handlerError
                        );
                    });

                    it("should call ackOrNack with the error", () => {
                        expect(mockAckOrNack).toHaveBeenCalledWith(new Error(handlerError));
                    });
                });
            });

            describe("when handler rejects asynchronously", () => {
                let handlerError: any;

                describe("and the error is an Error instance", () => {
                    beforeEach(async () => {
                        handlerError = new Error("E_HANDLER_ASYNC_ERROR");
                        mockHandlers["test-subscription"].mockRejectedValue(handlerError);
                        messageHandler(mockMessage, mockContent, mockAckOrNack);
                        // Wait for async handler to complete
                        await new Promise(resolve => setTimeout(resolve, 0));
                    });

                    it("should log the error", () => {
                        expect(mockContext.logger.error).toHaveBeenCalledWith(
                            "Error in subscription handler for 'test-subscription':",
                            handlerError
                        );
                    });

                    it("should call ackOrNack with the error", () => {
                        expect(mockAckOrNack).toHaveBeenCalledWith(handlerError);
                    });
                });

                describe("and the error is not an Error instance", () => {
                    beforeEach(async () => {
                        handlerError = "E_HANDLER_ASYNC_ERROR";
                        mockHandlers["test-subscription"].mockRejectedValue(handlerError);
                        messageHandler(mockMessage, mockContent, mockAckOrNack);
                        // Wait for async handler to complete
                        await new Promise(resolve => setTimeout(resolve, 0));
                    });

                    it("should log the error", () => {
                        expect(mockContext.logger.error).toHaveBeenCalledWith(
                            "Error in subscription handler for 'test-subscription':",
                            handlerError
                        );
                    });

                    it("should call ackOrNack with the error", () => {
                        expect(mockAckOrNack).toHaveBeenCalledWith(new Error(handlerError));
                    });
                });
            });

            describe("when handler returns non-Error", () => {
                beforeEach(() => {
                    mockHandlers["test-subscription"].mockImplementation(() => {
                        throw "string error";
                    });
                    messageHandler(mockMessage, mockContent, mockAckOrNack);
                });

                it("should call ackOrNack with Error wrapper", () => {
                    expect(mockAckOrNack).toHaveBeenCalledWith(new Error("string error"));
                });
            });
        });

        describe("with error event handler", () => {
            let errorHandler: any, subscriptionError: any;

            beforeEach(async () => {
                subscriptionError = new Error("E_SUBSCRIPTION_ERROR");
                await onBrokerCreated(mockBroker);
                const errorCall = mockSubscription.on.mock.calls.find(
                    (call: any) => call[0] === "error"
                );
                if (!errorCall) {
                    throw new Error("Error handler not found in mock calls");
                }
                errorHandler = errorCall[1];
                errorHandler(subscriptionError);
            });

            it("should log warning with error details", () => {
                expect(mockContext.logger.warn).toHaveBeenCalledWith(
                    "Subscription error for 'test-subscription':",
                    subscriptionError
                );
            });
        });

        describe("with invalid_content event handler", () => {
            let invalidContentHandler: any, contentError: any;

            beforeEach(async () => {
                contentError = new Error("E_INVALID_CONTENT");
                await onBrokerCreated(mockBroker);
                const invalidContentCall = mockSubscription.on.mock.calls.find(
                    (call: any) => call[0] === "invalid_content"
                );
                if (!invalidContentCall) {
                    throw new Error("Invalid content handler not found in mock calls");
                }
                invalidContentHandler = invalidContentCall[1];
                invalidContentHandler(contentError);
            });

            it("should log warning with content error details", () => {
                expect(mockContext.logger.warn).toHaveBeenCalledWith(
                    "Invalid content for subscription 'test-subscription':",
                    contentError
                );
            });
        });
    });
});

export default {};
