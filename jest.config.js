/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: {
        // Override 'esnext' from tsconfig.json — Jest requires CommonJS
        module: 'CommonJS',
        esModuleInterop: true,
        strict: false,
      },
    },
  },
  moduleNameMapper: {
    // Handle absolute imports if added later
    '^@/(.*)$': '<rootDir>/$1',
  },
};
