/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from "./types";

/**
 * Default console-based logger implementation.
 * Provides a simple logging interface that maps to console methods.
 *
 * @class ConsoleLogger
 * @implements {Logger}
 */
export class ConsoleLogger implements Logger {
    /**
     * Log a silly message using console.log
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    silly(message: string, ...args: any[]): void {
        console.log(message, ...args);
    }

    /**
     * Log a debug message using console.log
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    debug(message: string, ...args: any[]): void {
        console.log(message, ...args);
    }

    /**
     * Log an info message using console.log
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    info(message: string, ...args: any[]): void {
        console.log(message, ...args);
    }

    /**
     * Log a warning message using console.warn
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    warn(message: string, ...args: any[]): void {
        console.warn(message, ...args);
    }

    /**
     * Log an error message using console.error
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    error(message: string, ...args: any[]): void {
        console.error(message, ...args);
    }

    /**
     * Log a critical error message using console.error
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    critical(message: string, ...args: any[]): void {
        console.error(message, ...args);
    }
}

/**
 * Default logger instance that can be used throughout the application.
 * This provides a consistent logging interface while maintaining the simplicity of console logging.
 */
export const defaultLogger = new ConsoleLogger();
