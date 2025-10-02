<script setup lang="ts">
import { PowerParams, PowerSourceType } from '~/types';
import SliderInput from './SliderInput.vue';

const props = defineProps<{
    modelValue: PowerParams;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: PowerParams];
}>();

const updateField = <K extends keyof PowerParams>(field: K, value: PowerParams[K]) => {
    emit('update:modelValue', { ...props.modelValue, [field]: value });
};
</script>

<template>
    <div class="power-tab">
        <h3>⚡ Power Configuration</h3>

        <div class="power-source">
            <label class="source-label">Power Source:</label>

            <div class="radio-group">
                <label class="radio-option">
                    <input
                        type="radio"
                        name="powerSource"
                        :checked="modelValue.type === PowerSourceType.constant"
                        @change="updateField('type', PowerSourceType.constant)"
                    />
                    <span class="radio-text">
                        <strong>Constant Power</strong>
                        <small>Steady power output throughout the ride</small>
                    </span>
                </label>

                <label class="radio-option">
                    <input
                        type="radio"
                        name="powerSource"
                        :checked="modelValue.type === PowerSourceType.constant_tiring"
                        @change="updateField('type', PowerSourceType.constant_tiring)"
                    />
                    <span class="radio-text">
                        <strong>Constant with Fatigue</strong>
                        <small>Power decreases over time (realistic endurance)</small>
                    </span>
                </label>

                <label class="radio-option">
                    <input
                        type="radio"
                        name="powerSource"
                        :checked="modelValue.type === PowerSourceType.source"
                        @change="updateField('type', PowerSourceType.source)"
                    />
                    <span class="radio-text">
                        <strong>From GPX Data</strong>
                        <small>Use power data from GPX file (if available)</small>
                    </span>
                </label>
            </div>
        </div>

        <div v-if="modelValue.type !== PowerSourceType.source" class="power-settings">
            <SliderInput
                :model-value="modelValue.power"
                @update:model-value="updateField('power', $event)"
                label="Power Output"
                unit="W"
                :min="100"
                :max="500"
                :step="10"
                tooltip="Sustained power output in watts"
            />

            <div class="checkbox-option">
                <label class="checkbox-label">
                    <input
                        type="checkbox"
                        :checked="modelValue.useHarmonics"
                        @change="updateField('useHarmonics', !modelValue.useHarmonics)"
                    />
                    <span class="checkbox-text">
                        <strong>Use power harmonics</strong>
                        <small>Adds realistic power variations to simulate natural pedaling</small>
                    </span>
                </label>
            </div>

            <div v-if="modelValue.type === PowerSourceType.constant_tiring" class="fatigue-section">
                <SliderInput
                    :model-value="modelValue.tiringDuration / 3600"
                    @update:model-value="updateField('tiringDuration', $event * 3600)"
                    label="Fatigue Duration"
                    unit="hours"
                    :min="1"
                    :max="6"
                    :step="0.5"
                    tooltip="Time until power stabilizes at 50% of initial power"
                />

                <div class="fatigue-info">
                    <p class="info-text">
                        <strong>Fatigue Model:</strong> Power decreases linearly from 100% to 50%
                        over {{ (modelValue.tiringDuration / 3600).toFixed(1) }} hours.
                    </p>
                    <ul class="fatigue-timeline">
                        <li>Start: {{ modelValue.power }}W (100%)</li>
                        <li>
                            {{ ((modelValue.tiringDuration / 3600) * 0.5).toFixed(1) }}h:
                            {{ Math.round(modelValue.power * 0.75) }}W (75%)
                        </li>
                        <li>
                            {{ (modelValue.tiringDuration / 3600).toFixed(1) }}h+:
                            {{ Math.round(modelValue.power * 0.5) }}W (50%)
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div v-else class="gpx-info">
            <p class="info-text">
                Power data will be read from the GPX file's power extension data. If no power data
                is available, a default constant power will be used.
            </p>
        </div>
    </div>
</template>

<style scoped>
.power-tab {
    padding: 1rem;
}

h3 {
    margin: 0 0 1.5rem 0;
    color: #333;
    font-size: 1.3rem;
}

.power-source {
    margin-bottom: 2rem;
}

.source-label {
    display: block;
    font-weight: 500;
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.1rem;
}

.radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.radio-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: #f5f5f5;
    border: 2px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.radio-option:hover {
    background: #ebebeb;
    border-color: #0066cc;
}

.radio-option input[type='radio'] {
    margin-top: 0.2rem;
    cursor: pointer;
}

.radio-option input[type='radio']:checked + .radio-text {
    color: #0066cc;
}

.radio-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.radio-text strong {
    font-size: 1rem;
}

.radio-text small {
    color: #666;
    font-size: 0.85rem;
}

.power-settings {
    margin-top: 2rem;
}

.checkbox-option {
    margin: 1.5rem 0;
}

.checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
    margin-top: 0.2rem;
    cursor: pointer;
}

.checkbox-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.checkbox-text small {
    color: #666;
    font-size: 0.85rem;
}

.fatigue-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid #ddd;
}

.fatigue-info {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #fff3cd;
    border-radius: 6px;
    border-left: 4px solid #ff9800;
}

.info-text {
    margin: 0 0 0.75rem 0;
    color: #333;
    font-size: 0.95rem;
}

.fatigue-timeline {
    margin: 0;
    padding-left: 1.5rem;
    color: #666;
    font-size: 0.9rem;
}

.fatigue-timeline li {
    margin: 0.25rem 0;
}

.gpx-info {
    margin-top: 2rem;
    padding: 1rem;
    background: #e3f2fd;
    border-radius: 6px;
    border-left: 4px solid #2196f3;
}

.gpx-info .info-text {
    margin: 0;
    color: #333;
    font-size: 0.95rem;
}
</style>
