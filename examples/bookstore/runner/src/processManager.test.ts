/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

// Mocked child process — configured per scenario in beforeEach
const mockChild = {
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn(),
    once: jest.fn(),
    kill: jest.fn(),
};

const mockSpawn = jest.fn();
jest.mock("node:child_process", () => ({
    spawn: mockSpawn,
}));

describe("runner > src > processManager", () => {
    let processManager: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        jest.useFakeTimers();
        mockSpawn.mockReturnValue(mockChild);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("spawnService", () => {
        describe("when [READY] appears in stdout", () => {
            let result: any, error: any;

            beforeEach(async () => {
                mockChild.stdout.on.mockImplementation((_event: any, cb: any) => {
                    cb(Buffer.from("[order-service] connected\n[READY]\n"));
                });

                processManager = await import("./processManager");
                try {
                    result = await processManager.spawnService(
                        "order-service",
                        "/fake/path.ts",
                        10000
                    );
                } catch (err) {
                    error = err;
                }
            });

            it("should resolve without error", () => {
                expect(error).toBeUndefined();
                expect(result).toBeUndefined();
            });
        });

        describe("when [READY] is embedded in a line with other content", () => {
            let result: any, error: any;

            beforeEach(async () => {
                mockChild.stdout.on.mockImplementation((_event: any, cb: any) => {
                    cb(Buffer.from("Service started [READY] and listening\n"));
                });

                processManager = await import("./processManager");
                try {
                    result = await processManager.spawnService(
                        "catalog-service",
                        "/fake/path.ts",
                        10000
                    );
                } catch (err) {
                    error = err;
                }
            });

            it("should resolve because includes() checks for [READY] anywhere in the line", () => {
                expect(error).toBeUndefined();
                expect(result).toBeUndefined();
            });
        });

        describe("when stdout data arrives without a trailing newline (buffered)", () => {
            let resolvePromise: any, error: any;

            beforeEach(async () => {
                let stdoutCallback: any;
                mockChild.stdout.on.mockImplementation((_event: any, cb: any) => {
                    stdoutCallback = cb;
                });

                processManager = await import("./processManager");
                resolvePromise = processManager.spawnService(
                    "order-service",
                    "/fake/path.ts",
                    10000
                );

                // Send partial data without newline — stays in buffer, no [READY] yet
                stdoutCallback(Buffer.from("Connecting..."));
                // Now send the rest with the [READY] line
                stdoutCallback(Buffer.from(" done\n[READY]\n"));

                try {
                    await resolvePromise;
                } catch (err) {
                    error = err;
                }
            });

            it("should resolve once [READY] appears after buffering partial lines", () => {
                expect(error).toBeUndefined();
            });
        });

        describe("when the timeout fires before [READY]", () => {
            let error: any;

            beforeEach(async () => {
                // stdout handler never fires — service hangs
                mockChild.stdout.on.mockImplementation(() => {});

                processManager = await import("./processManager");
                const promise = processManager.spawnService("slow-service", "/fake/path.ts", 5000);

                jest.advanceTimersByTime(5000);

                try {
                    await promise;
                } catch (err) {
                    error = err;
                }
            });

            it("should reject with a timeout error naming the service", () => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain("slow-service");
                expect(error.message).toContain("did not print [READY]");
                expect(error.message).toContain("5000ms");
            });
        });

        describe("when the child process emits an error event", () => {
            let error: any;

            beforeEach(async () => {
                mockChild.stdout.on.mockImplementation(() => {});
                mockChild.on.mockImplementation((event: any, cb: any) => {
                    if (event === "error") {
                        cb(new Error("ENOENT: tsx not found"));
                    }
                });

                processManager = await import("./processManager");
                try {
                    await processManager.spawnService("order-service", "/fake/path.ts", 10000);
                } catch (err) {
                    error = err;
                }
            });

            it("should reject with a spawn failure error", () => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain("Failed to spawn order-service");
                expect(error.message).toContain("ENOENT: tsx not found");
            });
        });

        describe("when the child process exits before printing [READY]", () => {
            let error: any;

            beforeEach(async () => {
                mockChild.stdout.on.mockImplementation(() => {});
                mockChild.on.mockImplementation((event: any, cb: any) => {
                    if (event === "exit") {
                        cb(1, null);
                    }
                });

                processManager = await import("./processManager");
                try {
                    await processManager.spawnService("catalog-service", "/fake/path.ts", 10000);
                } catch (err) {
                    error = err;
                }
            });

            it("should reject with an exit-before-ready error", () => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain("catalog-service");
                expect(error.message).toContain("exited before [READY]");
                expect(error.message).toContain("code: 1");
            });
        });
    });

    describe("killAll", () => {
        describe("when no processes have been spawned", () => {
            let result: any, error: any;

            beforeEach(async () => {
                processManager = await import("./processManager");
                try {
                    result = await processManager.killAll();
                } catch (err) {
                    error = err;
                }
            });

            it("should resolve immediately", () => {
                expect(error).toBeUndefined();
                expect(result).toBeUndefined();
            });
        });

        describe("when managed processes exist and they exit after SIGTERM", () => {
            let result: any, error: any;

            beforeEach(async () => {
                // Spawn a child so managedProcesses has an entry
                mockChild.stdout.on.mockImplementation((_event: any, cb: any) => {
                    cb(Buffer.from("[READY]\n"));
                });

                processManager = await import("./processManager");
                await processManager.spawnService("order-service", "/fake/path.ts", 10000);

                // Reset mocks before killAll so we can configure once() freshly
                mockChild.once.mockReset();
                mockChild.kill.mockReset();

                mockChild.once.mockImplementation((_event: any, cb: any) => {
                    cb();
                });

                try {
                    result = await processManager.killAll();
                } catch (err) {
                    error = err;
                }
            });

            it("should send SIGTERM to managed processes", () => {
                expect(mockChild.kill).toHaveBeenCalledWith("SIGTERM");
            });

            it("should resolve once all processes exit", () => {
                expect(error).toBeUndefined();
                expect(result).toBeUndefined();
            });
        });

        describe("when a process ignores SIGTERM and the safety timeout fires", () => {
            let result: any, error: any;

            beforeEach(async () => {
                mockChild.stdout.on.mockImplementation((_event: any, cb: any) => {
                    cb(Buffer.from("[READY]\n"));
                });

                processManager = await import("./processManager");
                await processManager.spawnService("stubborn-service", "/fake/path.ts", 10000);

                mockChild.once.mockReset();
                mockChild.kill.mockReset();

                // once("exit") callback never fires — process ignores SIGTERM
                mockChild.once.mockImplementation(() => {});

                const killPromise = processManager.killAll();
                jest.advanceTimersByTime(3000);

                try {
                    result = await killPromise;
                } catch (err) {
                    error = err;
                }
            });

            it("should resolve via the safety timeout rather than hanging forever", () => {
                expect(error).toBeUndefined();
                expect(result).toBeUndefined();
            });
        });
    });
});
