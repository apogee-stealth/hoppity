import hoppity from "./hoppity";
import {
    BrokerCreatedCallback,
    BuilderInterface,
    MiddlewareFunction,
    MiddlewareResult,
    MiddlewareContext,
    BrokerWithExtensions,
    Logger,
} from "./types";
import { ConsoleLogger, defaultLogger } from "./consoleLogger";

export default hoppity;

export type {
    BrokerCreatedCallback,
    BuilderInterface,
    MiddlewareFunction,
    MiddlewareResult,
    MiddlewareContext,
    BrokerWithExtensions,
    Logger,
};

export { ConsoleLogger, defaultLogger };
