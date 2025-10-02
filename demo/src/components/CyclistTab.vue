<script setup lang="ts">
import { CyclistProperties, getDefaultCyclistProperties } from '@lib/types/models';
import { ref } from 'vue';
import SliderInput from './SliderInput.vue';

const props = defineProps<{
    modelValue: CyclistProperties;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: CyclistProperties];
}>();

const showAdvanced = ref(false);

const updateField = <K extends keyof CyclistProperties>(field: K, value: CyclistProperties[K]) => {
    emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const presets = {
    beginner: {
        mKg: 85,
        maxAngleDeg: 35,
        maxBrakeG: 0.4,
        cd: 1.1,
        a: 0.5,
        maxSpeedKmH: 50,
    },
    recreational: getDefaultCyclistProperties(),
    pro: {
        mKg: 68,
        maxAngleDeg: 50,
        maxBrakeG: 0.7,
        cd: 0.7,
        a: 0.35,
        maxSpeedKmH: 75,
    },
};

const applyPreset = (preset: keyof typeof presets) => {
    emit('update:modelValue', presets[preset]);
};
</script>

<template>
    <div class="cyclist-tab">
        <h3>👤 Cyclist Parameters</h3>

        <SliderInput
            :model-value="modelValue.mKg"
            @update:model-value="updateField('mKg', $event)"
            label="Body Mass"
            unit="kg"
            :min="50"
            :max="120"
            :step="1"
            tooltip="Total mass of cyclist + bike + gear"
        />

        <SliderInput
            :model-value="modelValue.maxAngleDeg"
            @update:model-value="updateField('maxAngleDeg', $event)"
            label="Max Lean Angle"
            unit="°"
            :min="30"
            :max="55"
            :step="1"
            tooltip="Maximum cornering lean angle (higher = faster cornering)"
        />

        <div class="presets">
            <label class="presets-label">🎯 Presets:</label>
            <div class="preset-buttons">
                <button @click="applyPreset('beginner')" class="preset-btn">Beginner</button>
                <button @click="applyPreset('recreational')" class="preset-btn">
                    Recreational
                </button>
                <button @click="applyPreset('pro')" class="preset-btn">Pro</button>
            </div>
        </div>

        <button @click="showAdvanced = !showAdvanced" class="advanced-toggle">
            ⓘ Advanced Settings {{ showAdvanced ? '▲' : '▼' }}
        </button>

        <div v-if="showAdvanced" class="advanced">
            <SliderInput
                :model-value="modelValue.cd"
                @update:model-value="updateField('cd', $event)"
                label="Drag Coefficient"
                :min="0.5"
                :max="1.2"
                :step="0.01"
                tooltip="Aerodynamic drag coefficient (lower = more aero)"
            />

            <SliderInput
                :model-value="modelValue.a"
                @update:model-value="updateField('a', $event)"
                label="Frontal Area"
                unit="m²"
                :min="0.3"
                :max="0.6"
                :step="0.01"
                tooltip="Frontal area exposed to wind"
            />

            <SliderInput
                :model-value="modelValue.maxBrakeG"
                @update:model-value="updateField('maxBrakeG', $event)"
                label="Max Brake Force"
                unit="G"
                :min="0.3"
                :max="0.8"
                :step="0.05"
                tooltip="Maximum braking deceleration capability"
            />

            <SliderInput
                :model-value="modelValue.maxSpeedKmH"
                @update:model-value="updateField('maxSpeedKmH', $event)"
                label="Max Speed"
                unit="km/h"
                :min="40"
                :max="80"
                :step="5"
                tooltip="Absolute maximum speed limit"
            />
        </div>
    </div>
</template>

<style scoped>
.cyclist-tab {
    padding: 1rem;
}

h3 {
    margin: 0 0 1.5rem 0;
    color: #333;
    font-size: 1.3rem;
}

.presets {
    margin: 2rem 0;
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
</style>
