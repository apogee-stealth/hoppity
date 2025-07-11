import { BrokerConfig } from "rascal";
import { Logger, MiddlewareFunction, MiddlewareResult } from "@apogeelabs/hoppity";

/**
 * Options for the withCustomLogger middleware
 */
export interface WithCustomLoggerOptions {
    /**
     * The custom logger instance to use
     */
    logger: Logger;
}

/**
 * Middleware that sets a custom logger on the context.
 * This allows downstream middleware to use the provided logger instead of the default console logger.
 *
 * @param {WithCustomLoggerOptions} options - Configuration options including the custom logger
 * @returns {MiddlewareFunction} - Middleware function that sets the custom logger
 *
 * @example
 * ```typescript
 * import winston from 'winston';
 * import { withCustomLogger } from '@apogeelabs/hoppity-logger';
 *
 * const logger = winston.createLogger({
 *   level: 'info',
 *   format: winston.format.json(),
 *   transports: [new winston.transports.Console()]
 * });
 *
 * const broker = await hoppity
 *   .use(withCustomLogger({ logger }))
 *   .use(myOtherMiddleware)
 *   .build();
 * ```
 */
export function withCustomLogger(options: WithCustomLoggerOptions): MiddlewareFunction {
    return (topology: BrokerConfig, context): MiddlewareResult => {
        // Set the custom logger on the context
        context.logger = options.logger;

        // Return the topology unchanged
        return { topology };
    };
}
