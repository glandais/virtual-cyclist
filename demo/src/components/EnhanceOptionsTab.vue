<script setup lang="ts">
import { EnhanceOptions } from '@lib/types';
import SliderInput from './SliderInput.vue';

const props = defineProps<{
    modelValue: EnhanceOptions;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: EnhanceOptions];
}>();

const updateField = <K extends keyof EnhanceOptions>(field: K, value: EnhanceOptions[K]) => {
    emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const updateSimplifyField = <K extends keyof NonNullable<EnhanceOptions['simplifyPath']>>(
    field: K,
    value: NonNullable<EnhanceOptions['simplifyPath']>[K]
) => {
    emit('update:modelValue', {
        ...props.modelValue,
        simplifyPath: {
            ...props.modelValue.simplifyPath,
            [field]: value,
        },
    });
};
</script>

<template>
    <div class="enhance-options-tab">
        <h3>🔧 Enhancement Pipeline Options</h3>

        <p class="description">
            Configure which processing steps are applied to the GPX track during enhancement.
        </p>

        <div class="options-group">
            <h4>Processing Steps</h4>

            <label class="checkbox-option">
                <input
                    type="checkbox"
                    :checked="modelValue.fixElevation ?? true"
                    @change="updateField('fixElevation', !modelValue.fixElevation)"
                />
                <span class="option-content">
                    <strong>Fix Elevation Data</strong>
                    <small>Correct elevation using external elevation service</small>
                </span>
            </label>

            <label class="checkbox-option">
                <input
                    type="checkbox"
                    :checked="modelValue.computeMaxSpeeds ?? true"
                    @change="updateField('computeMaxSpeeds', !modelValue.computeMaxSpeeds)"
                />
                <span class="option-content">
                    <strong>Compute Maximum Safe Speeds</strong>
                    <small
                        >Calculate cornering and braking limits (auto-enabled if virtualization is
                        on)</small
                    >
                </span>
            </label>

            <label class="checkbox-option">
                <input
                    type="checkbox"
                    :checked="modelValue.virtualizeTrack ?? true"
                    @change="updateField('virtualizeTrack', !modelValue.virtualizeTrack)"
                />
                <span class="option-content">
                    <strong>Virtualize Track</strong>
                    <small
                        >Simulate realistic cycling speeds using physics-based calculations</small
                    >
                </span>
            </label>

            <label class="checkbox-option">
                <input
                    type="checkbox"
                    :checked="modelValue.computeOnePointPerSecond ?? true"
                    @change="
                        updateField(
                            'computeOnePointPerSecond',
                            !modelValue.computeOnePointPerSecond
                        )
                    "
                />
                <span class="option-content">
                    <strong>Resample to 1Hz</strong>
                    <small>Standardize track to one point per second for consistent analysis</small>
                </span>
            </label>
        </div>

        <div class="simplify-section">
            <h4>Path Simplification</h4>

            <label class="checkbox-option">
                <input
                    type="checkbox"
                    :checked="modelValue.simplifyPath?.enable ?? true"
                    @change="
                        updateSimplifyField('enable', !(modelValue.simplifyPath?.enable ?? true))
                    "
                />
                <span class="option-content">
                    <strong>Enable Path Simplification</strong>
                    <small>Reduce point count using Douglas-Peucker algorithm</small>
                </span>
            </label>

            <div v-if="modelValue.simplifyPath?.enable ?? true" class="simplify-parameters">
                <SliderInput
                    :model-value="modelValue.simplifyPath?.tolerance ?? 10"
                    @update:model-value="updateSimplifyField('tolerance', $event)"
                    label="Tolerance"
                    unit="m"
                    :min="1"
                    :max="50"
                    :step="1"
                    tooltip="Maximum allowed distance from simplified line (higher = more aggressive simplification)"
                />

                <SliderInput
                    :model-value="modelValue.simplifyPath?.zExaggeration ?? 3"
                    @update:model-value="updateSimplifyField('zExaggeration', $event)"
                    label="Elevation Exaggeration"
                    :min="1"
                    :max="10"
                    :step="0.5"
                    tooltip="Factor for elevation weighting in 3D distance calculation"
                />

                <div class="simplify-info">
                    <p class="info-text">
                        Current settings will simplify the path using a tolerance of
                        <strong>{{ modelValue.simplifyPath?.tolerance ?? 10 }}m</strong> with
                        elevation weighted
                        <strong>{{ modelValue.simplifyPath?.zExaggeration ?? 3 }}x</strong>.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.enhance-options-tab {
    padding: 1rem;
}

h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.3rem;
}

h4 {
    margin: 1.5rem 0 1rem 0;
    color: #555;
    font-size: 1.1rem;
}

.description {
    margin: 0 0 1.5rem 0;
    color: #666;
    font-size: 0.95rem;
}

.options-group {
    margin-bottom: 2rem;
}

.checkbox-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    background: #f5f5f5;
    border: 2px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.checkbox-option:hover {
    background: #ebebeb;
    border-color: #0066cc;
}

.checkbox-option input[type='checkbox'] {
    margin-top: 0.2rem;
    cursor: pointer;
}

.checkbox-option input[type='checkbox']:checked ~ .option-content strong {
    color: #0066cc;
}

.option-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.option-content strong {
    font-size: 1rem;
}

.option-content small {
    color: #666;
    font-size: 0.85rem;
}

.simplify-section {
    padding-top: 1.5rem;
    border-top: 2px solid #ddd;
}

.simplify-parameters {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: #f9f9f9;
    border-radius: 6px;
    border-left: 4px solid #0066cc;
}

.simplify-info {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #e8f5e9;
    border-radius: 6px;
}

.info-text {
    margin: 0;
    color: #333;
    font-size: 0.9rem;
}
</style>
