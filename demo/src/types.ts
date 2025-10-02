import type { Path, PointFieldName } from '@lib/types';

export interface FieldDefinition {
    label: string;
    unit: string;
    color: string;
}

export interface CategoryConfig {
    name: string;
    axis: string;
    unit: string;
    fields: { [K in PointFieldName]?: FieldDefinition };
}

export interface AppState {
    currentPath: Path | null;
    isProcessing: boolean;
    selectedFields: Set<PointFieldName>;
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
