import { Config } from '@jest/types';

const config: Config.InitialOptions = {
    testEnvironment: 'node',
    rootDir: './',
    coverageDirectory: './coverage',
    detectOpenHandles: true,
    clearMocks: true,
    testTimeout: 50000,
    testMatch: [
        './**/*.test[s].ts',
    ],
    transform: {
        '^.+\\.ts$': ['ts-jest', {}]
    },
    moduleNameMapper: {
        '^@slack-building-blocks$': '<rootDir>/src/@slack-building-blocks'
    },
};

export default config;
