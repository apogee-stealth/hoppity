import { Logger } from "@apogeelabs/hoppity";

/**
 * Simple structured logger implementing the hoppity Logger interface.
 * In a real app, you'd use Winston, Pino, etc. — this demonstrates
 * how to wire up withCustomLogger with any Logger-compatible object.
 */
export const logger: Logger = {
    silly: (message: string, ...args: unknown[]) => console.debug(`[SILLY] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) => console.debug(`[DEBUG] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => console.info(`[INFO] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => console.warn(`[WARN] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => console.error(`[ERROR] ${message}`, ...args),
    critical: (message: string, ...args: unknown[]) =>
        console.error(`[CRITICAL] ${message}`, ...args),
};
