module.exports = {
    clearMocks: true,
    moduleFileExtensions: ['js', 'ts'],
    testEnvironment: 'node',
    testMatch: ['**/*.spec.ts'],
    testRunner: 'jest-circus/runner',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    moduleNameMapper: {
        '^@actions/github$': '<rootDir>/__mocks__/@actions/github.ts',
    },
    verbose: true,
};
