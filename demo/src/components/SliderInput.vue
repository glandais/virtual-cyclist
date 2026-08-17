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

const fractionDigits = computed(() => {
    if (!props.step) {
        return 0;
    }
    if (props.step >= 1) {
        return 0;
    }
    if (props.step >= 0.1) {
        return 1;
    }
    if (props.step >= 0.01) {
        return 2;
    }
    if (props.step >= 0.001) {
        return 3;
    }
    return 4;
});

// Nuxt UI drives the number field through Intl.NumberFormat instead of the
// minFractionDigits / maxFractionDigits / useGrouping props PrimeVue exposed.
const formatOptions = computed<Intl.NumberFormatOptions>(() => ({
    minimumFractionDigits: fractionDigits.value,
    maximumFractionDigits: fractionDigits.value,
    useGrouping: false,
}));
</script>

<template>
    <div class="mb-6">
        <label class="flex items-center gap-2 font-medium mb-3 text-gray-700">
            {{ label }}
            <span v-if="tooltip" class="cursor-help text-blue-500" :title="tooltip">ⓘ</span>
        </label>

        <div class="flex items-center gap-3 mb-2">
            <USlider v-model="value" :min="min" :max="max" :step="step || 1" class="flex-1" />
            <div class="flex items-center gap-2 min-w-[150px] justify-end">
                <UInputNumber
                    v-model="value"
                    :min="min"
                    :max="max"
                    :step="step || 1"
                    :format-options="formatOptions"
                    locale="en-US"
                    :ui="{ base: 'text-right w-full' }"
                />
                <!--
                    Rendered next to the field rather than as an in-input suffix: Intl only
                    accepts its own sanctioned unit list, which covers none of the units used
                    here (W, m/s, kg⋅m², G, km/h...).
                -->
                <span v-if="unit" class="text-gray-600 text-sm whitespace-nowrap">{{ unit }}</span>
            </div>
        </div>

        <div class="flex justify-between text-xs text-gray-500 px-1">
            <span>{{ min }}</span>
            <span>{{ max }}</span>
        </div>
    </div>
</template>
