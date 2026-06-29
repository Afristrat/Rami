/**
 * Config Jest en JavaScript (CommonJS) — volontairement PAS en TypeScript.
 *
 * Une config `jest.config.ts` exige un loader TS (ts-node) pour être parsée sur
 * les runtimes sans support TypeScript natif. La CI tourne sur Node 20 (sans
 * strip-types), où jest-config échoue avec « 'ts-node' is required ». Le dev
 * local (Node ≥ 22.6) la chargeait nativement, masquant le problème.
 * En CommonJS `.cjs`, la config se charge sur toute version de Node, sans
 * dépendance supplémentaire. ts-jest reste le transform des tests eux-mêmes.
 *
 * @type {import('jest').Config}
 */
const config = {
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

module.exports = config
