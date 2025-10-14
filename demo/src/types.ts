import type {
    BikeProperties,
    CyclistProperties,
    EnhanceOptions,
    FieldDefinition,
    Path,
} from '@lib/types';

export interface DemoFieldDefinition extends FieldDefinition {
    color: string;
}

export interface CategoryConfig {
    name: string;
    axis: string;
    unit: string;
    fields: Record<string, DemoFieldDefinition>;
}

export interface AppState {
    currentPath: Path | null;
    isProcessing: boolean;
    config: Config;
}

export interface WindDemo {
    windSpeed: number;
    windDirection: number;
}

export enum PowerSourceType {
    constant = 'constant',
    constant_tiring = 'constant_tiring',
    source = 'source',
}

export interface PowerParams {
    type: PowerSourceType;
    power: number;
    useHarmonics: boolean;
    // Duration in seconds after which power stabilizes at 50%
    tiringDuration: number;
}

export interface Config {
    selectedFields: Set<string>;
    bike: BikeProperties;
    cyclist: CyclistProperties;
    wind: WindDemo;
    enhance: EnhanceOptions;
    power: PowerParams;
}

export interface Preset {
    bike: BikeProperties;
    cyclist: CyclistProperties;
    power: number;
    // Duration in seconds after which power stabilizes at 50%
    tiringDuration: number;
}

export const PRESETS: Record<'beginner' | 'recreational' | 'pro', Preset> = {
    beginner: {
        bike: {
            crr: 0.005,
            inertiaFront: 0.06,
            inertiaRear: 0.08,
            wheelRadius: 0.7,
            efficiency: 0.96,
        },
        cyclist: {
            mKg: 90,
            maxAngleDeg: 35,
            maxBrakeG: 0.4,
            cd: 0.8,
            a: 0.53,
            maxSpeedKmH: 60,
        },
        power: 180,
        tiringDuration: 3600,
    },
    recreational: {
        bike: {
            crr: 0.004,
            inertiaFront: 0.05,
            inertiaRear: 0.07,
            wheelRadius: 0.7,
            efficiency: 0.976,
        },
        cyclist: {
            mKg: 80,
            maxBrakeG: 0.6,
            cd: 0.7,
            a: 0.45,
            maxAngleDeg: 42,
            maxSpeedKmH: 80,
        },
        power: 230,
        tiringDuration: 7200,
    },
    pro: {
        bike: {
            crr: 0.003,
            inertiaFront: 0.04,
            inertiaRear: 0.06,
            wheelRadius: 0.7,
            efficiency: 0.985,
        },
        cyclist: {
            mKg: 73,
            maxBrakeG: 0.7,
            cd: 0.6,
            a: 0.39,
            maxAngleDeg: 50,
            maxSpeedKmH: 120,
        },
        power: 340,
        tiringDuration: 14400,
    },
};

export const DEFAULT_CONFIG: Config = {
    selectedFields: new Set<string>(['elevation', 'speed']),
    bike: PRESETS['recreational'].bike,
    cyclist: PRESETS['recreational'].cyclist,
    wind: { windSpeed: 0, windDirection: 0 },
    enhance: {
        fixElevation: true,
        computeMaxSpeeds: true,
        virtualizeTrack: true,
        computeOnePointPerSecond: true,
        simplifyPath: {
            enable: false,
            tolerance: 10,
            zExaggeration: 3,
        },
    },
    power: {
        type: PowerSourceType.constant,
        power: PRESETS['recreational'].power,
        useHarmonics: false,
        tiringDuration: PRESETS['recreational'].tiringDuration,
    },
};
