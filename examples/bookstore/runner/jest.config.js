// jest.config.js
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs" } }],
    },
    moduleNameMapper: {
        "^@apogeelabs/hoppity-contracts$":
            "<rootDir>/../../../packages/hoppity-contracts/src/index.ts",
        "^@apogeelabs/hoppity-operations$":
            "<rootDir>/../../../packages/hoppity-operations/src/index.ts",
        "^@apogeelabs/hoppity$": "<rootDir>/../../../packages/hoppity/src/index.ts",
        "^@bookstore/contracts$": "<rootDir>/../packages/bookstore-contracts/src/index.ts",
    },
    transformIgnorePatterns: ["/node_modules/(?!(@vite|vite)/)"],
};
