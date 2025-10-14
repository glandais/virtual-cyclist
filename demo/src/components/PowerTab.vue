<script setup lang="ts">
import Checkbox from 'primevue/checkbox';
import RadioButton from 'primevue/radiobutton';
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
    <div class="p-4">
        <h3 class="text-xl font-semibold text-gray-800 mb-6">⚡ Power Configuration</h3>

        <div class="mb-8">
            <label class="block font-medium text-gray-800 text-base mb-4">Power Source:</label>

            <div class="flex flex-col gap-3">
                <label
                    class="flex items-start gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-500 transition-all"
                >
                    <RadioButton
                        name="powerSource"
                        :value="PowerSourceType.constant"
                        :modelValue="modelValue.type"
                        @update:modelValue="updateField('type', $event)"
                        class="mt-1"
                    />
                    <span class="flex flex-col gap-1">
                        <strong class="text-gray-800">Constant Power</strong>
                        <small class="text-gray-600 text-sm"
                            >Steady power output throughout the ride</small
                        >
                    </span>
                </label>

                <label
                    class="flex items-start gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-500 transition-all"
                >
                    <RadioButton
                        name="powerSource"
                        :value="PowerSourceType.constant_tiring"
                        :modelValue="modelValue.type"
                        @update:modelValue="updateField('type', $event)"
                        class="mt-1"
                    />
                    <span class="flex flex-col gap-1">
                        <strong class="text-gray-800">Constant with Fatigue</strong>
                        <small class="text-gray-600 text-sm"
                            >Power decreases over time (realistic endurance)</small
                        >
                    </span>
                </label>

                <label
                    class="flex items-start gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-500 transition-all"
                >
                    <RadioButton
                        name="powerSource"
                        :value="PowerSourceType.source"
                        :modelValue="modelValue.type"
                        @update:modelValue="updateField('type', $event)"
                        class="mt-1"
                    />
                    <span class="flex flex-col gap-1">
                        <strong class="text-gray-800">From GPX Data</strong>
                        <small class="text-gray-600 text-sm"
                            >Use power data from GPX file (if available)</small
                        >
                    </span>
                </label>
            </div>
        </div>

        <div v-if="modelValue.type !== PowerSourceType.source" class="mt-8">
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

            <div class="my-6">
                <label class="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                        :binary="true"
                        :modelValue="modelValue.useHarmonics"
                        @update:modelValue="updateField('useHarmonics', !modelValue.useHarmonics)"
                        class="mt-1"
                    />
                    <span class="flex flex-col gap-1">
                        <strong class="text-gray-800">Use power harmonics</strong>
                        <small class="text-gray-600 text-sm"
                            >Adds realistic power variations to simulate natural pedaling</small
                        >
                    </span>
                </label>
            </div>

            <div
                v-if="modelValue.type === PowerSourceType.constant_tiring"
                class="mt-8 pt-6 border-t-2 border-gray-200"
            >
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

                <div class="mt-6 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                    <p class="text-gray-800 mb-3 m-0">
                        <strong>Fatigue Model:</strong> Power decreases linearly from 100% to 50%
                        over {{ (modelValue.tiringDuration / 3600).toFixed(1) }} hours.
                    </p>
                    <ul class="pl-6 m-0 text-gray-700 text-sm space-y-1">
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

        <div v-else class="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p class="text-gray-800 text-sm m-0">
                Power data will be read from the GPX file's power extension data. If no power data
                is available, a default constant power will be used.
            </p>
        </div>
    </div>
</template>
