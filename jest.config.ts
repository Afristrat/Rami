import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^server-only$": "<rootDir>/tests/__mocks__/empty.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/tests/unit/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        // ts-jest nécessite CommonJS
        module: "CommonJS",
        moduleResolution: "node",
      },
    }],
  },
}

export default config
