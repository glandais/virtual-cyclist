<script setup lang="ts">
import type { PointFieldName } from '@lib/types';
import { fieldConfig } from '~/config/fieldConfig';

const props = defineProps<{
    modelValue: Set<PointFieldName>;
}>();

const emit = defineEmits<{
    'update:modelValue': [fields: Set<PointFieldName>];
}>();

const toggleField = (fieldKey: PointFieldName) => {
    const newSet = new Set(props.modelValue);
    if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
    } else {
        newSet.add(fieldKey);
    }
    emit('update:modelValue', newSet);
};
</script>

<template>
    <div class="fields-tab">
        <h3>📊 Data Fields to Display</h3>
        <p class="description">Select which data fields should be displayed on the chart.</p>
        <div class="field-categories">
            <div
                v-for="(category, categoryKey) in fieldConfig"
                :key="categoryKey"
                class="field-category"
            >
                <h4>{{ category.name }}</h4>
                <div class="field-checkboxes">
                    <div
                        v-for="(field, fieldKey) in category.fields"
                        :key="fieldKey"
                        class="field-checkbox"
                    >
                        <input
                            :id="`field-${fieldKey}`"
                            type="checkbox"
                            :checked="modelValue.has(fieldKey)"
                            @change="toggleField(fieldKey)"
                        />
                        <label :for="`field-${fieldKey}`">{{ field!.label }}</label>
                        <span class="field-unit">{{ field!.unit }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.fields-tab {
    padding: 1rem;
}

h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.3rem;
}

.description {
    margin: 0 0 1.5rem 0;
    color: #666;
    font-size: 0.95rem;
}

.field-categories {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}

.field-category {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    border: 2px solid #e9ecef;
}

.field-category h4 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
    border-bottom: 2px solid #dee2e6;
    padding-bottom: 0.5rem;
    font-size: 1.1rem;
}

.field-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.field-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.field-checkbox:hover {
    background: #e9ecef;
}

.field-checkbox input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: #0066cc;
    cursor: pointer;
}

.field-checkbox label {
    cursor: pointer;
    font-weight: 500;
    flex: 1;
    font-size: 0.95rem;
}

.field-unit {
    font-size: 0.8rem;
    color: #6c757d;
    font-style: italic;
}
</style>
