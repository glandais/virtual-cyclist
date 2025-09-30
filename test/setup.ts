// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).__DEV__ = true;

// Global mock for Logger to silence console output during tests
// Only applies to imports from '../src/utils/Logger' and '../src/utils'
// The Logger.test.ts file will override this mock for its own testing
jest.mock('../src/utils/Logger', () => ({
    createLogger: jest.fn(() => ({
        trace: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        timeLevel: jest.fn(),
        timeEndLevel: jest.fn(),
        time: jest.fn(),
        timeEnd: jest.fn(),
        dirLevel: jest.fn(),
        dir: jest.fn(),
        clear: jest.fn(),
    })),
    Logger: jest.fn().mockImplementation(() => ({
        trace: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        timeLevel: jest.fn(),
        timeEndLevel: jest.fn(),
        time: jest.fn(),
        timeEnd: jest.fn(),
        dirLevel: jest.fn(),
        dir: jest.fn(),
        clear: jest.fn(),
    })),
    LogLevel: {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4,
    },
}));
