export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
        }],
    },
    testMatch: ['**/__tests__/**/*.test.ts'],
    forceExit: true,
    detectOpenHandles: true,
    testEnvironmentOptions: {},
    globals: {
        'ts-jest': {
            useESM: true,
        }
    },
    setupFiles: ['<rootDir>/jest.setup.js']
};