import type { Ref } from 'vue';
import { watch } from 'vue';
import { Config, DEFAULT_CONFIG } from '~/types';

const STORAGE_KEY = 'virtual-cyclist-config';
const DEBOUNCE_MS = 1000;

// Serializable version of Config with Set converted to Array
interface SerializableConfig extends Omit<Config, 'selectedFields'> {
    selectedFields: string[];
}

/**
 * Convert Config to a JSON-serializable format
 */
const serializeConfig = (config: Config): SerializableConfig => {
    return {
        ...config,
        selectedFields: Array.from(config.selectedFields),
    };
};

/**
 * Convert serializable format back to Config
 */
const deserializeConfig = (data: SerializableConfig): Config => {
    return {
        ...data,
        selectedFields: new Set(data.selectedFields),
    };
};

/**
 * Load config from localStorage
 */
export const loadConfig = (): Config => {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as SerializableConfig;
            return deserializeConfig(parsed);
        }
    } catch (error) {
        console.warn('Failed to load config from localStorage:', error);
    }
    return structuredClone(DEFAULT_CONFIG);
};

/**
 * Save config to localStorage
 */
export const saveConfig = (config: Config): void => {
    try {
        const serialized = serializeConfig(config);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
        console.warn('Failed to save config to localStorage:', error);
    }
};

/**
 * Set up auto-save with debouncing
 */
export const useConfigPersistence = (config: Ref<Config>) => {
    let timeoutId: number | undefined;

    watch(
        config,
        newConfig => {
            // Clear previous timeout
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }

            // Debounce save
            timeoutId = window.setTimeout(() => {
                saveConfig(newConfig);
            }, DEBOUNCE_MS);
        },
        { deep: true }
    );
};
