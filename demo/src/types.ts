import type { Path, PointFieldName } from '@lib/types';

export interface FieldDefinition {
    label: string;
    unit: string;
}

export interface CategoryConfig {
    name: string;
    axis: string;
    color: string;
    unit: string;
    fields: { [K in PointFieldName]?: FieldDefinition };
}

export interface AppState {
    currentPath: Path | null;
    isProcessing: boolean;
    selectedFields: Set<PointFieldName>;
}
