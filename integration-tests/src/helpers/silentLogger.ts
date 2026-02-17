import { Logger } from "@apogeelabs/hoppity";

const noop = () => {};

/** Logger that swallows everything. Keeps test output clean. */
export const silentLogger: Logger = {
    silly: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    critical: noop,
};
