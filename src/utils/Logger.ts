/**
 * Lightweight logger for development debugging
 * All logging is completely removed in production builds via __DEV__ constant
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type LogFunction = (message?: any, ...optionalParams: any[]) => void;

type LogLevelConfig = 'error' | 'warn' | 'info' | 'debug' | 'trace';
type LevelsConfig = {
    default: LogLevelConfig;
    [namespacePrefix: string]: LogLevelConfig;
};
import jsonLevels from './levels.json' assert { type: 'json' };
const levels = jsonLevels as LevelsConfig;

export type LogLevelValue = 0 | 1 | 2 | 3 | 4;
export class LogLevel {
    static readonly ERROR: LogLevelValue = 0;
    static readonly WARN: LogLevelValue = 1;
    static readonly INFO: LogLevelValue = 2;
    static readonly DEBUG: LogLevelValue = 3;
    static readonly TRACE: LogLevelValue = 4;
}

const levelWeights: Record<LogLevelConfig, LogLevelValue> = {
    error: LogLevel.ERROR,
    warn: LogLevel.WARN,
    info: LogLevel.INFO,
    debug: LogLevel.DEBUG,
    trace: LogLevel.TRACE,
};

const levelLabel: Record<LogLevelValue, string> = {
    0: 'ERROR',
    1: 'WARN',
    2: 'INFO',
    3: 'DEBUG',
    4: 'TRACE',
};

const levelLog: Record<LogLevelValue, LogFunction> = {
    0: console.error,
    1: console.error,
    2: console.log,
    3: console.log,
    4: console.log,
};

/**
 * Logger class that provides conditional logging based on build environment
 * In production builds, all logging code is eliminated by the bundler
 *
 * Matches the full console API signatures for compatibility with printf-style formatting
 * and all console features
 */
class Logger {
    private namespace: string;
    private level: LogLevelValue;

    constructor(namespace: string) {
        this.namespace = namespace;
        if (__DEV__) {
            let matchedLevel: LogLevelConfig = levels.default;
            let longestMatch = 0;

            for (const [prefix, level] of Object.entries(levels)) {
                if (
                    prefix !== 'default' &&
                    namespace.startsWith(prefix) &&
                    prefix.length > longestMatch
                ) {
                    matchedLevel = level;
                    longestMatch = prefix.length;
                }
            }

            this.level = levelWeights[matchedLevel];
        } else {
            this.level = levelWeights.warn;
        }
    }

    private shouldLog(level: LogLevelValue): boolean {
        return level <= this.level;
    }

    private doLog(level: LogLevelValue, message?: any, ...optionalParams: any[]) {
        const prefix = `[${this.namespace}:${levelLabel[level]}]`;
        if (typeof message === 'string') {
            // Preserve printf-style formatting by combining prefix with format string
            levelLog[level](`${prefix} ${message}`, ...optionalParams);
        } else {
            // No formatting needed, use regular logging
            levelLog[level](prefix, message, ...optionalParams);
        }
    }

    private log(level: LogLevelValue, message?: any, ...optionalParams: any[]) {
        if (this.shouldLog(level)) {
            this.doLog(level, message, ...optionalParams);
        }
    }

    /**
     * Log debug information (verbose output for development)
     * Supports printf-style formatting: logger.debug('Value: %s, Count: %d', value, count)
     */
    trace(message?: any, ...optionalParams: any[]): void {
        if (__DEV__) {
            this.log(LogLevel.TRACE, message, ...optionalParams);
        }
    }

    /**
     * Log debug information (verbose output for development)
     * Supports printf-style formatting: logger.debug('Value: %s, Count: %d', value, count)
     */
    debug(message?: any, ...optionalParams: any[]): void {
        if (__DEV__) {
            this.log(LogLevel.DEBUG, message, ...optionalParams);
        }
    }

    /**
     * Log general information
     * Supports printf-style formatting: logger.info('User %s logged in', username)
     */
    info(message?: any, ...optionalParams: any[]): void {
        if (__DEV__) {
            this.log(LogLevel.INFO, message, ...optionalParams);
        }
    }

    /**
     * Log warnings
     * Supports printf-style formatting: logger.warn('Timeout after %dms', timeout)
     */
    warn(message?: any, ...optionalParams: any[]): void {
        this.log(LogLevel.WARN, message, ...optionalParams);
    }

    /**
     * Log errors
     * Supports printf-style formatting: logger.error('Failed to load %s: %o', file, error)
     */
    error(message?: any, ...optionalParams: any[]): void {
        this.log(LogLevel.ERROR, message, ...optionalParams);
    }

    private getTimeLabel(level: LogLevelValue, label: string): string {
        return `[${this.namespace}:${levelLabel[level]}] ${label}`;
    }

    private doTime(level: LogLevelValue, label: string): void {
        console.time(this.getTimeLabel(level, label));
    }

    private doTimeEnd(level: LogLevelValue, label: string): void {
        console.timeEnd(this.getTimeLabel(level, label));
    }

    /**
     * Log with timing information
     * Useful for performance debugging
     */
    timeLevel(level: LogLevelValue, label: string): void {
        if (__DEV__) {
            if (this.shouldLog(level)) {
                this.doTime(level, label);
            }
        }
    }

    /**
     * End timing and log duration
     */
    timeEndLevel(level: LogLevelValue, label: string): void {
        if (__DEV__) {
            if (this.shouldLog(level)) {
                this.doTimeEnd(level, label);
            }
        }
    }

    /**
     * Log with timing information
     * Useful for performance debugging
     */
    time(label: string): void {
        this.doTime(LogLevel.INFO, label);
    }

    /**
     * End timing and log duration
     */
    timeEnd(label: string): void {
        this.doTimeEnd(LogLevel.INFO, label);
    }

    private logDir(level: LogLevelValue, message?: any, obj?: any, options?: any) {
        this.doLog(level, 'DIR %s', message);
        console.dir(obj, options);
    }

    /**
     * Display an interactive list of object properties
     * Useful for exploring complex objects in development
     * @param obj - The object to inspect
     * @param options - Optional display options
     */
    dirLevel(level: LogLevelValue, message?: any, obj?: any, options?: any): void {
        if (__DEV__) {
            if (this.shouldLog(level)) {
                this.logDir(level, message, obj, options);
            }
        }
    }

    /**
     * Display an interactive list of object properties
     * Useful for exploring complex objects in development
     * @param obj - The object to inspect
     * @param options - Optional display options
     */
    dir(message?: any, obj?: any, options?: any): void {
        this.logDir(LogLevel.INFO, message, obj, options);
    }

    /**
     * Clear the console
     */
    clear(): void {
        console.clear();
    }
}

/**
 * Create a logger instance with a specific namespace
 * @param namespace - The namespace for this logger (e.g., 'Cache', 'TileFetcher')
 * @returns A new Logger instance with the specified namespace
 * @example
 * const logger = createLogger('MyModule');
 * logger.debug('Module initialized');
 */
export const createLogger = (namespace: string): Logger => new Logger(namespace);

export { Logger };
