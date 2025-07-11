/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockConsole = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Mock console methods
Object.defineProperty(global, "console", {
    value: mockConsole,
    writable: true,
});

import { ConsoleLogger, defaultLogger } from "./consoleLogger";

describe("packages > hoppity > src > consoleLogger", () => {
    let logger: ConsoleLogger;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        logger = new ConsoleLogger();
    });

    describe("with ConsoleLogger class", () => {
        describe("when calling silly", () => {
            beforeEach(() => {
                logger.silly("SILLY_MESSAGE", "EXTRA_ARG");
            });

            it("should call console.log with the message and args", () => {
                expect(mockConsole.log).toHaveBeenCalledTimes(1);
                expect(mockConsole.log).toHaveBeenCalledWith("SILLY_MESSAGE", "EXTRA_ARG");
            });
        });

        describe("when calling debug", () => {
            beforeEach(() => {
                logger.debug("DEBUG_MESSAGE", "EXTRA_ARG1", "EXTRA_ARG2");
            });

            it("should call console.log with the message and args", () => {
                expect(mockConsole.log).toHaveBeenCalledTimes(1);
                expect(mockConsole.log).toHaveBeenCalledWith(
                    "DEBUG_MESSAGE",
                    "EXTRA_ARG1",
                    "EXTRA_ARG2"
                );
            });
        });

        describe("when calling info", () => {
            beforeEach(() => {
                logger.info("INFO_MESSAGE");
            });

            it("should call console.log with the message", () => {
                expect(mockConsole.log).toHaveBeenCalledTimes(1);
                expect(mockConsole.log).toHaveBeenCalledWith("INFO_MESSAGE");
            });
        });

        describe("when calling warn", () => {
            beforeEach(() => {
                logger.warn("WARN_MESSAGE", "EXTRA_ARG");
            });

            it("should call console.warn with the message and args", () => {
                expect(mockConsole.warn).toHaveBeenCalledTimes(1);
                expect(mockConsole.warn).toHaveBeenCalledWith("WARN_MESSAGE", "EXTRA_ARG");
            });
        });

        describe("when calling error", () => {
            beforeEach(() => {
                logger.error("ERROR_MESSAGE", "EXTRA_ARG1", "EXTRA_ARG2");
            });

            it("should call console.error with the message and args", () => {
                expect(mockConsole.error).toHaveBeenCalledTimes(1);
                expect(mockConsole.error).toHaveBeenCalledWith(
                    "ERROR_MESSAGE",
                    "EXTRA_ARG1",
                    "EXTRA_ARG2"
                );
            });
        });

        describe("when calling critical", () => {
            beforeEach(() => {
                logger.critical("CRITICAL_MESSAGE");
            });

            it("should call console.error with the message", () => {
                expect(mockConsole.error).toHaveBeenCalledTimes(1);
                expect(mockConsole.error).toHaveBeenCalledWith("CRITICAL_MESSAGE");
            });
        });
    });

    describe("with defaultLogger export", () => {
        describe("when calling silly", () => {
            beforeEach(() => {
                defaultLogger.silly("DEFAULT_SILLY", "EXTRA");
            });

            it("should call console.log with the message and args", () => {
                expect(mockConsole.log).toHaveBeenCalledTimes(1);
                expect(mockConsole.log).toHaveBeenCalledWith("DEFAULT_SILLY", "EXTRA");
            });
        });

        describe("when calling debug", () => {
            beforeEach(() => {
                defaultLogger.debug("DEFAULT_DEBUG");
            });

            it("should call console.log with the message", () => {
                expect(mockConsole.log).toHaveBeenCalledTimes(1);
                expect(mockConsole.log).toHaveBeenCalledWith("DEFAULT_DEBUG");
            });
        });

        describe("when calling info", () => {
            beforeEach(() => {
                defaultLogger.info("DEFAULT_INFO", "EXTRA1", "EXTRA2");
            });

            it("should call console.log with the message and args", () => {
                expect(mockConsole.log).toHaveBeenCalledTimes(1);
                expect(mockConsole.log).toHaveBeenCalledWith("DEFAULT_INFO", "EXTRA1", "EXTRA2");
            });
        });

        describe("when calling warn", () => {
            beforeEach(() => {
                defaultLogger.warn("DEFAULT_WARN");
            });

            it("should call console.warn with the message", () => {
                expect(mockConsole.warn).toHaveBeenCalledTimes(1);
                expect(mockConsole.warn).toHaveBeenCalledWith("DEFAULT_WARN");
            });
        });

        describe("when calling error", () => {
            beforeEach(() => {
                defaultLogger.error("DEFAULT_ERROR", "EXTRA");
            });

            it("should call console.error with the message and args", () => {
                expect(mockConsole.error).toHaveBeenCalledTimes(1);
                expect(mockConsole.error).toHaveBeenCalledWith("DEFAULT_ERROR", "EXTRA");
            });
        });

        describe("when calling critical", () => {
            beforeEach(() => {
                defaultLogger.critical("DEFAULT_CRITICAL", "EXTRA1", "EXTRA2");
            });

            it("should call console.error with the message and args", () => {
                expect(mockConsole.error).toHaveBeenCalledTimes(1);
                expect(mockConsole.error).toHaveBeenCalledWith(
                    "DEFAULT_CRITICAL",
                    "EXTRA1",
                    "EXTRA2"
                );
            });
        });
    });
});
