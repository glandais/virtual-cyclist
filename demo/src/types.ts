import type { Path } from '@lib/types';

export interface FieldDefinition {
    label: string;
    unit: string;
}

export interface CategoryConfig {
    name: string;
    axis: string;
    color: string;
    unit: string;
    fields: Record<string, FieldDefinition>;
}

export interface FieldConfig {
    elevation: CategoryConfig;
    grade: CategoryConfig;
    speed: CategoryConfig;
    power: CategoryConfig;
    environmental: CategoryConfig;
    physiological: CategoryConfig;
}

export interface AppState {
    currentPath: Path | null;
    isProcessing: boolean;
    selectedFields: Set<string>;
}
