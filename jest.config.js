module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/', '/test/', '/coverage/', '/src/utils/Logger.ts'],
    testMatch: ['**/test/**/*.test.ts', '**/__tests__/**/*.test.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/test/browser/'],
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/test/__mocks__/styleMock.js',
        '@glandais/elevation': '<rootDir>/test/__mocks__/@glandais/elevation.ts',
    },
    transformIgnorePatterns: ['node_modules/(?!(@glandais/elevation)/)'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.d.ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
