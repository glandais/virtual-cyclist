<script setup lang="ts">
import { Button, Tab, TabList, TabPanels, Tabs } from 'primevue';
import Panel from 'primevue/panel';
import TabPanel from 'primevue/tabpanel';
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
        <Panel
            id="config-panel"
            class="bg-blue-50 border-blue-200"
            pt:header:class="text-blue-900"
            pt:content:class="pt-0"
        >
            <template #header>
                <span class="font-semibold">⚙️ Configuration</span>
            </template>
            <!-- Tabs -->
            <Tabs value="0">
                <TabList>
                    <Tab value="0">👤 Cyclist</Tab>
                    <Tab value="1">🚴 Bike</Tab>
                    <Tab value="2">💨 Wind</Tab>
                    <Tab value="3">⚡ Power</Tab>
                    <Tab value="4">🔧 Options</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel value="0">
                        <CyclistTab v-model="cyclist" />
                    </TabPanel>
                    <TabPanel value="1">
                        <BikeTab v-model="bike" />
                    </TabPanel>
                    <TabPanel value="2">
                        <WindTab v-model="wind" />
                    </TabPanel>
                    <TabPanel value="3">
                        <PowerTab v-model="power" />
                    </TabPanel>
                    <TabPanel value="4">
                        <EnhanceOptionsTab v-model="enhance" />
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <div
                class="my-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200"
            >
                <label class="block font-semibold text-gray-800 mb-3 text-base"
                    >🎯 Quick Presets</label
                >
                <div class="flex flex-wrap gap-3">
                    <Button
                        @click="applyPreset('beginner')"
                        severity="success"
                        class="flex-1 min-w-[120px]"
                    >
                        Beginner
                    </Button>
                    <Button
                        @click="applyPreset('recreational')"
                        severity="warn"
                        class="flex-1 min-w-[120px]"
                    >
                        Recreational
                    </Button>
                    <Button
                        @click="applyPreset('pro')"
                        severity="danger"
                        class="flex-1 min-w-[120px]"
                    >
                        Pro
                    </Button>
                </div>
            </div>

            <Button @click="resetToDefault" severity="danger" outlined class="w-full mt-6">
                🔄 Reset to Defaults
            </Button>
        </Panel>
    </section>
</template>
