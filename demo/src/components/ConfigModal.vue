<script setup lang="ts">
import { computed } from 'vue';
import { Config, DEFAULT_CONFIG, PRESETS } from '~/types';
import BikeTab from './BikeTab.vue';
import CyclistTab from './CyclistTab.vue';
import EnhanceOptionsTab from './EnhanceOptionsTab.vue';
import PowerTab from './PowerTab.vue';
import WindTab from './WindTab.vue';

const props = defineProps<{
    modelValue: Config;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: Config];
}>();

const cyclist = computed({
    get: () => props.modelValue.cyclist,
    set: value => emit('update:modelValue', { ...props.modelValue, cyclist: value }),
});

const bike = computed({
    get: () => props.modelValue.bike,
    set: value => emit('update:modelValue', { ...props.modelValue, bike: value }),
});

const wind = computed({
    get: () => props.modelValue.wind,
    set: value => emit('update:modelValue', { ...props.modelValue, wind: value }),
});

const power = computed({
    get: () => props.modelValue.power,
    set: value => emit('update:modelValue', { ...props.modelValue, power: value }),
});

const enhance = computed({
    get: () => props.modelValue.enhance,
    set: value => emit('update:modelValue', { ...props.modelValue, enhance: value }),
});

const tabItems = [
    { label: '👤 Cyclist', slot: 'cyclist' as const },
    { label: '🚴 Bike', slot: 'bike' as const },
    { label: '💨 Wind', slot: 'wind' as const },
    { label: '⚡ Power', slot: 'power' as const },
    { label: '🔧 Options', slot: 'options' as const },
];

const resetToDefault = () => {
    emit('update:modelValue', structuredClone(DEFAULT_CONFIG));
};

const applyPreset = (preset: keyof typeof PRESETS) => {
    const newValue: Config = { ...props.modelValue };
    newValue.bike = structuredClone(PRESETS[preset].bike);
    newValue.cyclist = structuredClone(PRESETS[preset].cyclist);
    newValue.power.power = PRESETS[preset].power;
    newValue.power.tiringDuration = PRESETS[preset].tiringDuration;
    emit('update:modelValue', newValue);
};
</script>

<template>
    <section class="p-4 bg-gray-50 border-b border-gray-200">
        <div id="config-panel" class="rounded-lg border border-blue-200 bg-blue-50">
            <div class="p-4 text-blue-900">
                <span class="font-semibold">⚙️ Configuration</span>
            </div>
            <div class="p-4 pt-0">
                <!-- Tabs -->
                <UTabs :items="tabItems" :unmount-on-hide="false">
                    <template #cyclist>
                        <CyclistTab v-model="cyclist" />
                    </template>
                    <template #bike>
                        <BikeTab v-model="bike" />
                    </template>
                    <template #wind>
                        <WindTab v-model="wind" />
                    </template>
                    <template #power>
                        <PowerTab v-model="power" />
                    </template>
                    <template #options>
                        <EnhanceOptionsTab v-model="enhance" />
                    </template>
                </UTabs>

                <div
                    class="my-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200"
                >
                    <label class="block font-semibold text-gray-800 mb-3 text-base"
                        >🎯 Quick Presets</label
                    >
                    <div class="flex flex-wrap gap-3">
                        <UButton
                            @click="applyPreset('beginner')"
                            color="success"
                            block
                            class="flex-1 min-w-[120px]"
                        >
                            Beginner
                        </UButton>
                        <UButton
                            @click="applyPreset('recreational')"
                            color="warning"
                            block
                            class="flex-1 min-w-[120px]"
                        >
                            Recreational
                        </UButton>
                        <UButton
                            @click="applyPreset('pro')"
                            color="error"
                            block
                            class="flex-1 min-w-[120px]"
                        >
                            Pro
                        </UButton>
                    </div>
                </div>

                <UButton @click="resetToDefault" color="error" variant="outline" block class="mt-6">
                    🔄 Reset to Defaults
                </UButton>
            </div>
        </div>
    </section>
</template>
