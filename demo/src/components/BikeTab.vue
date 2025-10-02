<script setup lang="ts">
import { BikeProperties, getDefaultBikeProperties } from '@lib/types/models';
import { ref } from 'vue';
import SliderInput from './SliderInput.vue';

const props = defineProps<{
    modelValue: BikeProperties;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: BikeProperties];
}>();

const showAdvanced = ref(false);

const updateField = <K extends keyof BikeProperties>(field: K, value: BikeProperties[K]) => {
    emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const wheelPresets = {
    '650b': 0.65,
    '700c': 0.7,
    '29er': 0.735,
};

const applyWheelPreset = (preset: keyof typeof wheelPresets) => {
    updateField('wheelRadius', wheelPresets[preset] / 2);
};

const resetToDefault = () => {
    emit('update:modelValue', getDefaultBikeProperties());
};
</script>

<template>
    <div class="bike-tab">
        <h3>🚴 Bike Parameters</h3>

        <div class="wheel-presets">
            <label class="presets-label">Wheel Size:</label>
            <div class="preset-buttons">
                <button @click="applyWheelPreset('650b')" class="preset-btn">650b</button>
                <button @click="applyWheelPreset('700c')" class="preset-btn">700c</button>
                <button @click="applyWheelPreset('29er')" class="preset-btn">29er</button>
            </div>
        </div>

        <SliderInput
            :model-value="modelValue.crr"
            @update:model-value="updateField('crr', $event)"
            label="Rolling Resistance"
            :min="0.002"
            :max="0.01"
            :step="0.0001"
            tooltip="Rolling resistance coefficient (lower = faster)"
        />

        <button @click="showAdvanced = !showAdvanced" class="advanced-toggle">
            ⓘ Advanced Settings {{ showAdvanced ? '▲' : '▼' }}
        </button>

        <div v-if="showAdvanced" class="advanced">
            <SliderInput
                :model-value="modelValue.wheelRadius"
                @update:model-value="updateField('wheelRadius', $event)"
                label="Wheel Radius"
                unit="m"
                :min="0.3"
                :max="0.4"
                :step="0.005"
                tooltip="Wheel radius in meters"
            />

            <SliderInput
                :model-value="modelValue.inertiaFront"
                @update:model-value="updateField('inertiaFront', $event)"
                label="Front Wheel Inertia"
                unit="kg⋅m²"
                :min="0.05"
                :max="0.15"
                :step="0.005"
                tooltip="Rotational inertia of front wheel"
            />

            <SliderInput
                :model-value="modelValue.inertiaRear"
                @update:model-value="updateField('inertiaRear', $event)"
                label="Rear Wheel Inertia"
                unit="kg⋅m²"
                :min="0.05"
                :max="0.15"
                :step="0.005"
                tooltip="Rotational inertia of rear wheel"
            />

            <SliderInput
                :model-value="modelValue.efficiency * 100"
                @update:model-value="updateField('efficiency', $event / 100)"
                label="Drivetrain Efficiency"
                unit="%"
                :min="90"
                :max="99"
                :step="0.5"
                tooltip="Power transmission efficiency"
            />

            <button @click="resetToDefault" class="reset-btn">Reset to Defaults</button>
        </div>
    </div>
</template>

<style scoped>
.bike-tab {
    padding: 1rem;
}

h3 {
    margin: 0 0 1.5rem 0;
    color: #333;
    font-size: 1.3rem;
}

.wheel-presets {
    margin: 0 0 2rem 0;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 6px;
}

.presets-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.75rem;
    color: #333;
}

.preset-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.preset-btn {
    padding: 0.5rem 1rem;
    background: white;
    border: 2px solid #0066cc;
    border-radius: 4px;
    color: #0066cc;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.preset-btn:hover {
    background: #0066cc;
    color: white;
}

.advanced-toggle {
    width: 100%;
    padding: 0.75rem;
    margin: 1.5rem 0;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: background 0.2s;
}

.advanced-toggle:hover {
    background: #e5e5e5;
}

.advanced {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 2px solid #ddd;
}

.reset-btn {
    width: 100%;
    padding: 0.75rem;
    margin-top: 1.5rem;
    background: #ff6b6b;
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}

.reset-btn:hover {
    background: #ff5252;
}
</style>
