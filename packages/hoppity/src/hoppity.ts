import { BrokerConfig } from "rascal";
import { RascalBuilder } from "./RascalBuilder";
import { BuilderInterface, Hoppity, MiddlewareFunction } from "./types";

/**
 * Implementation of the Rascal wrapper that provides the main API for the middleware pipeline.
 *
 * This object serves as the primary entry point for using the enhanced Rascal functionality.
 * It provides a fluent API for building complex broker configurations with middleware.
 */
const hoppity: Hoppity = {
    /**
     * Creates a builder instance with an initial topology configuration.
     * If you have topology to start with, you need to call this method _first_, before calling `use()`.
     *
     * @param {BrokerConfig} topology - Initial topology configuration
     * @returns {BuilderInterface} - Builder instance for chaining middleware
     */
    withTopology(topology: BrokerConfig): BuilderInterface {
        return new RascalBuilder(topology);
    },

    /**
     * Creates a builder instance with an empty topology and adds the first middleware.
     *
     * @param {MiddlewareFunction} middleware - The first middleware to add
     * @returns {BuilderInterface} - Builder instance for chaining additional middleware
     */
    use(middleware: MiddlewareFunction): BuilderInterface {
        return new RascalBuilder().use(middleware);
    },
};

export default hoppity;
