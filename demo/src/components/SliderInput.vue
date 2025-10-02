<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    modelValue: number;
    label: string;
    unit?: string;
    min: number;
    max: number;
    step?: number;
    tooltip?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: number];
}>();

const value = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val),
});
</script>

<template>
    <div class="slider-input">
        <label class="slider-label">
            {{ label }}
            <span v-if="tooltip" class="tooltip" :title="tooltip">ⓘ</span>
        </label>

        <div class="slider-controls">
            <input
                type="range"
                v-model.number="value"
                :min="min"
                :max="max"
                :step="step || 1"
                class="slider"
            />
            <input
                type="number"
                v-model.number="value"
                :min="min"
                :max="max"
                :step="step || 1"
                class="number-input"
            />
            <span v-if="unit" class="unit">{{ unit }}</span>
        </div>

        <div class="range-labels">
            <span>{{ min }}</span>
            <span>{{ max }}</span>
        </div>
    </div>
</template>

<style scoped>
.slider-input {
    margin-bottom: 1.5rem;
}

.slider-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #333;
}

.tooltip {
    cursor: help;
    color: #0066cc;
    font-size: 0.9em;
}

.slider-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
}

.slider {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: #ddd;
    outline: none;
    -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #0066cc;
    cursor: pointer;
    transition: background 0.2s;
}

.slider::-webkit-slider-thumb:hover {
    background: #0052a3;
}

.slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #0066cc;
    cursor: pointer;
    border: none;
    transition: background 0.2s;
}

.slider::-moz-range-thumb:hover {
    background: #0052a3;
}

.number-input {
    width: 80px;
    padding: 0.4rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.95rem;
    text-align: center;
}

.number-input:focus {
    outline: none;
    border-color: #0066cc;
}

.unit {
    min-width: 40px;
    color: #666;
    font-size: 0.9rem;
}

.range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #666;
    padding: 0 0.25rem;
}
</style>
