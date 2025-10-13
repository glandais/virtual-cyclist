import { FIELD_DEFINITIONS } from '@/types/path/';
import type { CategoryConfig, DemoFieldDefinition } from '~/types';

function getFieldConfig(): Record<string, CategoryConfig> {
    const result: Record<string, CategoryConfig> = {};
    let count = 0;
    for (const fieldCategory of FIELD_DEFINITIONS) {
        if (!fieldCategory.notSelectable) {
            let unit = '';
            const fields: Record<string, DemoFieldDefinition> = {};
            for (const fieldDefinition of fieldCategory.fields) {
                if (!fieldDefinition.notSelectable) {
                    fields[fieldDefinition.prop] = {
                        ...fieldDefinition,
                        color: 'rgba(255, 0, 0, 0.8)',
                    };
                    if (unit !== '?') {
                        if (unit === '') {
                            unit = fieldDefinition.unit;
                        } else if (unit !== fieldDefinition.unit) {
                            unit = '?';
                        }
                    }
                    count++;
                }
            }
            if (Object.keys(fields).length) {
                result[fieldCategory.id] = {
                    name: fieldCategory.name,
                    axis: fieldCategory.id,
                    unit,
                    fields,
                };
            }
        }
    }
    let i = 0;
    const dh = 360 / count;
    for (const categoryId in result) {
        const categoryConfig = result[categoryId];
        for (const fieldId in categoryConfig.fields) {
            const field = categoryConfig.fields[fieldId];
            if (field) {
                const h = i++ * dh;
                field.color = `hsl(${h} 50% 50%)`;
            }
        }
    }
    return result;
}

export const fieldConfig: Record<string, CategoryConfig> = getFieldConfig();
