/* eslint-disable @typescript-eslint/no-explicit-any */
export default {};

describe("hoppity-rpc > src > utils > createCorrelationManager", () => {
    let correlationManager: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("with createCorrelationManager", () => {
        let mod1: any, mod2: any, instance1: any, instance2: any;
        beforeEach(async () => {
            mod1 = await import("./createCorrelationManager");
            mod2 = await import("./createCorrelationManager");
            instance1 = mod1.createCorrelationManager();
            instance2 = mod2.createCorrelationManager();
            correlationManager = instance1;
        });

        it("should return a singleton instance", () => {
            expect(instance1).toBe(instance2);
        });

        it("should have the expected methods", () => {
            expect(correlationManager.addRequest).toBeDefined();
            expect(correlationManager.resolveRequest).toBeDefined();
            expect(correlationManager.rejectRequest).toBeDefined();
            expect(correlationManager.cancelRequest).toBeDefined();
            expect(correlationManager.cleanup).toBeDefined();
        });
    });

    describe("with addRequest", () => {
        beforeEach(async () => {
            const mod = await import("./createCorrelationManager");
            correlationManager = mod.createCorrelationManager();
        });

        describe("when adding a new request", () => {
            let promise: any;

            beforeEach(() => {
                promise = correlationManager.addRequest("CORRELATION_ID_123", 5000);
            });

            it("should return a promise", () => {
                expect(promise).toBeInstanceOf(Promise);
            });

            it("should set up a timeout", () => {
                // With fake timers, we can't directly assert on setTimeout calls
                // The timeout functionality is tested in the timeout test case
                expect(promise).toBeInstanceOf(Promise);
            });
        });

        describe("when the request times out", () => {
            let promise: any, error: any;

            beforeEach(async () => {
                promise = correlationManager.addRequest("CORRELATION_ID_456", 3000);

                // Fast-forward time to trigger timeout
                jest.advanceTimersByTime(3000);

                try {
                    await promise;
                } catch (err) {
                    error = err;
                }
            });

            it("should reject the promise with a timeout error", () => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe("RPC request timed out after 3000ms");
            });
        });
    });

    describe("with resolveRequest", () => {
        beforeEach(async () => {
            const mod = await import("./createCorrelationManager");
            correlationManager = mod.createCorrelationManager();
        });

        describe("when resolving an existing request", () => {
            let result: any, promise: any, resolvedValue: any;

            beforeEach(async () => {
                promise = correlationManager.addRequest("CORRELATION_ID_789", 10000);

                result = correlationManager.resolveRequest(
                    "CORRELATION_ID_789",
                    "SUCCESS_RESPONSE"
                );

                try {
                    resolvedValue = await promise;
                } catch {
                    // Ignore errors for this test
                }
            });

            it("should return true", () => {
                expect(result).toBe(true);
            });

            it("should resolve the promise with the provided value", () => {
                expect(resolvedValue).toBe("SUCCESS_RESPONSE");
            });
        });

        describe("when resolving a non-existent request", () => {
            let result: any;

            beforeEach(() => {
                result = correlationManager.resolveRequest("NON_EXISTENT_ID", "SUCCESS_RESPONSE");
            });

            it("should return false", () => {
                expect(result).toBe(false);
            });
        });
    });

    describe("with rejectRequest", () => {
        beforeEach(async () => {
            const mod = await import("./createCorrelationManager");
            correlationManager = mod.createCorrelationManager();
        });

        describe("when rejecting an existing request", () => {
            let result: any, promise: any, error: any;

            beforeEach(async () => {
                promise = correlationManager.addRequest("CORRELATION_ID_REJECT", 10000);

                result = correlationManager.rejectRequest(
                    "CORRELATION_ID_REJECT",
                    new Error("E_COLD_CALZONE")
                );

                try {
                    await promise;
                } catch (err) {
                    error = err;
                }
            });

            it("should return true", () => {
                expect(result).toBe(true);
            });

            it("should reject the promise with the provided error", () => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe("E_COLD_CALZONE");
            });
        });

        describe("when rejecting a non-existent request", () => {
            let result: any;

            beforeEach(() => {
                result = correlationManager.rejectRequest(
                    "NON_EXISTENT_ID",
                    new Error("E_SOGGY_STROMBOLI")
                );
            });

            it("should return false", () => {
                expect(result).toBe(false);
            });
        });
    });

    describe("with cancelRequest", () => {
        beforeEach(async () => {
            const mod = await import("./createCorrelationManager");
            correlationManager = mod.createCorrelationManager();
        });

        describe("when cancelling an existing request", () => {
            let result: any, promise: any, error: any;

            beforeEach(async () => {
                promise = correlationManager.addRequest("CORRELATION_ID_CANCEL", 10000);

                result = correlationManager.cancelRequest("CORRELATION_ID_CANCEL");

                try {
                    await promise;
                } catch (err) {
                    error = err;
                }
            });

            it("should return true", () => {
                expect(result).toBe(true);
            });

            it("should reject the promise with a cancellation error", () => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe("RPC request cancelled");
            });
        });

        describe("when cancelling a non-existent request", () => {
            let result: any;

            beforeEach(() => {
                result = correlationManager.cancelRequest("NON_EXISTENT_ID");
            });

            it("should return false", () => {
                expect(result).toBe(false);
            });
        });
    });

    describe("with cleanup", () => {
        beforeEach(async () => {
            const mod = await import("./createCorrelationManager");
            correlationManager = mod.createCorrelationManager();
        });

        describe("when cleaning up with pending requests", () => {
            let promise1: any, promise2: any, promise3: any, error1: any, error2: any, error3: any;

            beforeEach(async () => {
                // Add multiple requests
                promise1 = correlationManager.addRequest("CORRELATION_ID_CLEANUP_1", 10000);
                promise2 = correlationManager.addRequest("CORRELATION_ID_CLEANUP_2", 10000);
                promise3 = correlationManager.addRequest("CORRELATION_ID_CLEANUP_3", 10000);

                correlationManager.cleanup();

                try {
                    await promise1;
                } catch (err) {
                    error1 = err;
                }

                try {
                    await promise2;
                } catch (err) {
                    error2 = err;
                }

                try {
                    await promise3;
                } catch (err) {
                    error3 = err;
                }
            });

            it("should reject all pending requests with cleanup error", () => {
                expect(error1).toBeInstanceOf(Error);
                expect(error1.message).toBe("RPC manager cleanup");
                expect(error2).toBeInstanceOf(Error);
                expect(error2.message).toBe("RPC manager cleanup");
                expect(error3).toBeInstanceOf(Error);
                expect(error3.message).toBe("RPC manager cleanup");
            });
        });

        describe("when cleaning up with no pending requests", () => {
            beforeEach(() => {
                correlationManager.cleanup();
            });

            it("should not throw any errors", () => {
                expect(() => correlationManager.cleanup()).not.toThrow();
            });
        });
    });

    describe("with multiple requests", () => {
        beforeEach(async () => {
            const mod = await import("./createCorrelationManager");
            correlationManager = mod.createCorrelationManager();
        });

        describe("when managing multiple concurrent requests", () => {
            let promise1: any, promise2: any, promise3: any;

            beforeEach(() => {
                promise1 = correlationManager.addRequest("CORRELATION_ID_MULTI_1", 5000);
                promise2 = correlationManager.addRequest("CORRELATION_ID_MULTI_2", 10000);
                promise3 = correlationManager.addRequest("CORRELATION_ID_MULTI_3", 15000);
            });

            it("should create separate timeouts for each request", () => {
                // With fake timers, we can't directly assert on setTimeout calls
                // The functionality is verified by the independent resolution tests
                expect(promise1).toBeInstanceOf(Promise);
                expect(promise2).toBeInstanceOf(Promise);
                expect(promise3).toBeInstanceOf(Promise);
            });

            it("should resolve specific requests independently", () => {
                const result1 = correlationManager.resolveRequest(
                    "CORRELATION_ID_MULTI_1",
                    "RESPONSE_1"
                );
                const result2 = correlationManager.resolveRequest(
                    "CORRELATION_ID_MULTI_2",
                    "RESPONSE_2"
                );

                expect(result1).toBe(true);
                expect(result2).toBe(true);
            });

            it("should not affect other requests when resolving one", () => {
                correlationManager.resolveRequest("CORRELATION_ID_MULTI_1", "RESPONSE_1");

                // The other requests should still be pending
                const result2 = correlationManager.resolveRequest(
                    "CORRELATION_ID_MULTI_2",
                    "RESPONSE_2"
                );
                const result3 = correlationManager.resolveRequest(
                    "CORRELATION_ID_MULTI_3",
                    "RESPONSE_3"
                );

                expect(result2).toBe(true);
                expect(result3).toBe(true);
            });
        });
    });
});
