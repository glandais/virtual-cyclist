<script setup lang="ts">
import InputNumber from 'primevue/inputnumber';
import Slider from 'primevue/slider';
import { WindDemo } from '~/types';
import SliderInput from './SliderInput.vue';

const props = defineProps<{
    modelValue: WindDemo;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: WindDemo];
}>();

const updateField = <K extends keyof WindDemo>(field: K, value: WindDemo[K]) => {
    emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const getWindDirectionLabel = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round((deg % 360) / 45) % 8;
    return directions[index];
};
</script>

<template>
    <div class="p-4">
        <h3 class="text-xl font-semibold text-gray-800 mb-6">💨 Wind Configuration</h3>

        <SliderInput
            :model-value="modelValue.windSpeed"
            @update:model-value="updateField('windSpeed', $event)"
            label="Wind Speed"
            unit="m/s"
            :min="0"
            :max="20"
            :step="0.5"
            tooltip="Wind speed (0 = no wind)"
        />

        <div class="my-8">
            <label class="flex items-center gap-2 font-medium mb-4 text-gray-700">
                Wind Direction
                <span
                    class="cursor-help text-blue-500"
                    title="Direction wind is coming from (0° = North)"
                    >ⓘ</span
                >
            </label>

            <div class="flex gap-8 items-center mb-4">
                <!-- Custom Compass (preserve existing styles) -->
                <div class="compass">
                    <div
                        class="wind-arrow"
                        :style="{ transform: `rotate(${modelValue.windDirection}deg)` }"
                    >
                        ↓
                    </div>
                    <div class="compass-labels">
                        <span class="compass-n">N</span>
                        <span class="compass-e">E</span>
                        <span class="compass-s">S</span>
                        <span class="compass-w">W</span>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <InputNumber
                        :modelValue="modelValue.windDirection"
                        @update:modelValue="updateField('windDirection', $event ?? 0)"
                        :min="0"
                        :max="360"
                        :step="15"
                        class="w-20"
                        suffix="°"
                    />
                    <span class="text-gray-600 text-sm font-medium">
                        ({{ getWindDirectionLabel(modelValue.windDirection) }})
                    </span>
                </div>
            </div>

            <div class="mb-1">
                <Slider
                    :modelValue="modelValue.windDirection"
                    @update:modelValue="
                        updateField('windDirection', Array.isArray($event) ? $event[0] : $event)
                    "
                    :min="0"
                    :max="360"
                    :step="15"
                    class="w-full"
                    pt:root:class="bg-gradient-to-r from-blue-500 via-green-500 to-blue-500"
                />
            </div>
        </div>

        <div class="mt-8 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <p class="text-gray-800 mb-2 m-0">
                <strong>Current wind:</strong>
                {{ modelValue.windSpeed.toFixed(1) }} m/s from
                {{ getWindDirectionLabel(modelValue.windDirection) }}
                ({{ modelValue.windDirection }}°)
            </p>
            <p class="text-gray-600 text-sm italic m-0">
                💡 Wind direction is where the wind is <em>coming from</em>, not blowing towards.
            </p>
        </div>
    </div>
</template>
