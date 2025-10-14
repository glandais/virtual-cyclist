<script setup lang="ts">
import { BikeProperties, getDefaultBikeProperties } from '@lib/types/models';
import Button from 'primevue/button';
import Panel from 'primevue/panel';
import SliderInput from './SliderInput.vue';

const props = defineProps<{
    modelValue: BikeProperties;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: BikeProperties];
}>();

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
    <div class="p-4">
        <h3 class="text-xl font-semibold text-gray-800 mb-6">🚴 Bike Parameters</h3>

        <div
            class="mb-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200"
        >
            <label class="block font-semibold text-gray-800 mb-3 text-base">🚲 Wheel Size</label>
            <div class="flex flex-wrap gap-3">
                <Button
                    @click="applyWheelPreset('650b')"
                    outlined
                    severity="secondary"
                    class="flex-1 min-w-[90px]"
                >
                    650b
                </Button>
                <Button
                    @click="applyWheelPreset('700c')"
                    outlined
                    severity="secondary"
                    class="flex-1 min-w-[90px]"
                >
                    700c
                </Button>
                <Button
                    @click="applyWheelPreset('29er')"
                    outlined
                    severity="secondary"
                    class="flex-1 min-w-[90px]"
                >
                    29er
                </Button>
            </div>
        </div>

        <SliderInput
            :model-value="modelValue.crr"
            @update:model-value="updateField('crr', $event)"
            label="Rolling Resistance"
            :min="0.002"
            :max="0.008"
            :step="0.0001"
            tooltip="Rolling resistance coefficient (lower = faster)"
        />

        <Panel toggleable :collapsed="true" class="mt-6">
            <template #header>
                <span class="font-semibold text-gray-700">⚙️ Advanced Settings</span>
            </template>
            <SliderInput
                :model-value="modelValue.wheelRadius"
                @update:model-value="updateField('wheelRadius', $event)"
                label="Wheel Radius"
                unit="m"
                :min="0.3"
                :max="0.9"
                :step="0.005"
                tooltip="Wheel radius in meters"
            />

            <SliderInput
                :model-value="modelValue.inertiaFront"
                @update:model-value="updateField('inertiaFront', $event)"
                label="Front Wheel Inertia"
                unit="kg⋅m²"
                :min="0.03"
                :max="0.1"
                :step="0.005"
                tooltip="Rotational inertia of front wheel"
            />

            <SliderInput
                :model-value="modelValue.inertiaRear"
                @update:model-value="updateField('inertiaRear', $event)"
                label="Rear Wheel Inertia"
                unit="kg⋅m²"
                :min="0.03"
                :max="0.1"
                :step="0.005"
                tooltip="Rotational inertia of rear wheel"
            />

            <SliderInput
                :model-value="modelValue.efficiency * 100"
                @update:model-value="updateField('efficiency', $event / 100)"
                label="Drivetrain Efficiency"
                unit="%"
                :min="90"
                :max="100"
                :step="0.1"
                tooltip="Power transmission efficiency"
            />

            <Button @click="resetToDefault" severity="danger" outlined class="w-full mt-6">
                🔄 Reset to Defaults
            </Button>
        </Panel>
    </div>
</template>
