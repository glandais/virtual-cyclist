// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).__DEV__ = true;

// Global mock for Logger to silence console output during tests
// Only applies to imports from '@/index/utils/Logger' and '@/index/utils'
// The Logger.test.ts file will override this mock for its own testing
vi.mock('@/utils/Logger', () => ({
    createLogger: vi.fn(() => ({
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        timeLevel: vi.fn(),
        timeEndLevel: vi.fn(),
        time: vi.fn(),
        timeEnd: vi.fn(),
        dirLevel: vi.fn(),
        dir: vi.fn(),
        clear: vi.fn(),
    })),
    Logger: vi.fn().mockImplementation(() => ({
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        timeLevel: vi.fn(),
        timeEndLevel: vi.fn(),
        time: vi.fn(),
        timeEnd: vi.fn(),
        dirLevel: vi.fn(),
        dir: vi.fn(),
        clear: vi.fn(),
    })),
    LogLevel: {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4,
    },
}));
