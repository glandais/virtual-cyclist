<script setup lang="ts">
import { CyclistProperties } from '@lib/types/models';
import Panel from 'primevue/panel';
import SliderInput from './SliderInput.vue';

const props = defineProps<{
    modelValue: CyclistProperties;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: CyclistProperties];
}>();

const updateField = <K extends keyof CyclistProperties>(field: K, value: CyclistProperties[K]) => {
    emit('update:modelValue', { ...props.modelValue, [field]: value });
};
</script>

<template>
    <div class="p-4">
        <h3 class="text-xl font-semibold text-gray-800 mb-6">👤 Cyclist Parameters</h3>

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

        <Panel toggleable :collapsed="true" class="mt-6">
            <template #header>
                <span class="font-semibold text-gray-700">⚙️ Advanced Settings</span>
            </template>
            <SliderInput
                :model-value="modelValue.cd"
                @update:model-value="updateField('cd', $event)"
                label="Drag Coefficient"
                :min="0.5"
                :max="0.9"
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
                :max="130"
                :step="5"
                tooltip="Absolute maximum speed limit"
            />
        </Panel>
    </div>
</template>
