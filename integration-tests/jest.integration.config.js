module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/**/*.integration.test.ts"],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    globalSetup: "<rootDir>/src/setup/globalSetup.ts",
    globalTeardown: "<rootDir>/src/setup/globalTeardown.ts",
    testTimeout: 60_000,
    maxWorkers: 1,
};
