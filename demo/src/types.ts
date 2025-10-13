import type { FieldDefinition, Path } from '@lib/types';

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
    selectedFields: Set<string>;
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
