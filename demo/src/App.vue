<script setup lang="ts">
import { DEFAULT_CYCLIST_POWER_W } from '@/constants';
import { EnhanceOptions } from '@/types';
import {
    BikeProperties,
    CyclistProperties,
    getDefaultBikeProperties,
    getDefaultCyclistProperties,
} from '@lib/types/models';
import { onMounted, Ref, ref } from 'vue';
import ConfigModal from '~/components/ConfigModal.vue';
import ControlPanel from '~/components/ControlPanel.vue';
import DataChart from '~/components/DataChart.vue';
import FileSection from '~/components/FileSection.vue';
import MapView from '~/components/MapView.vue';
import { useGPXDemo } from '~/composables/useGPXDemo';
import { useHoverSync } from '~/composables/useHoverSync';
import { PowerParams, PowerSourceType, WindDemo } from './types';

const selectedFields = ref(new Set<string>(['elevation', 'speed']));
const isConfigOpen = ref(false);
const bike: Ref<BikeProperties> = ref(getDefaultBikeProperties());
const cyclist: Ref<CyclistProperties> = ref(getDefaultCyclistProperties());
const wind: Ref<WindDemo> = ref({ windSpeed: 0, windDirection: 0 });
const enhanceOptions: Ref<EnhanceOptions> = ref({
    fixElevation: true,
    computeMaxSpeeds: true,
    virtualizeTrack: true,
    computeOnePointPerSecond: true,
    simplifyPath: {
        enable: false,
        tolerance: 10,
        zExaggeration: 3,
    },
});
const powerParams: Ref<PowerParams> = ref({
    type: PowerSourceType.constant,
    power: DEFAULT_CYCLIST_POWER_W,
    useHarmonics: false,
    tiringDuration: 3600,
});

const {
    currentPath,
    isProcessing,
    statusText,
    fileName,
    loadGPXFile,
    handleFileUpload,
    enhancePath,
} = useGPXDemo(bike, cyclist, wind, enhanceOptions, powerParams);

// Set up hover sync between chart and map
const { hoveredInfo, setHoveredIndex } = useHoverSync(currentPath);

const handleHoverChange = (index: number | null) => {
    setHoveredIndex(index);
};

const onGPXSelect = async (url: string) => {
    try {
        await loadGPXFile(url);
    } catch (error) {
        alert('Failed to load GPX file: ' + (error as Error).message);
    }
};

const onFileUpload = async (file: File) => {
    try {
        await handleFileUpload(file);
    } catch (error) {
        alert('Failed to upload file: ' + (error as Error).message);
    }
};

const onEnhancePath = async () => {
    try {
        await enhancePath();
    } catch (error) {
        alert('Failed to enhance path: ' + (error as Error).message);
    }
};

onMounted(() => {
    console.log('GPX Demo App initialized successfully');
    loadGPXFile('gpx/stelvio.gpx').then(() => enhancePath());
});
</script>

<template>
    <div id="app">
        <!-- Header Section -->
        <header class="app-header">
            <h1>🚴‍♂️ Virtual Cyclist - Interactive GPX Analysis</h1>
            <p>
                Upload GPX routes and simulate realistic cycling speeds based on terrain and rider
                physics
            </p>
        </header>

        <!-- File Selection Section -->
        <FileSection
            :file-name="fileName"
            :current-path="currentPath"
            :is-processing="isProcessing"
            @gpx-select="onGPXSelect"
            @file-upload="onFileUpload"
        />

        <!-- Control Panel (Status Only) -->
        <ControlPanel :is-processing="isProcessing" :status-text="statusText" />

        <!-- Configuration Modal -->
        <ConfigModal
            :is-open="isConfigOpen"
            v-model:bike="bike"
            v-model:cyclist="cyclist"
            v-model:wind="wind"
            v-model:enhance-options="enhanceOptions"
            v-model:power-params="powerParams"
            v-model:selected-fields="selectedFields"
            @close="isConfigOpen = false"
        />

        <!-- Chart and Map Section -->
        <div class="visualization-grid">
            <DataChart
                :current-path="currentPath"
                :selected-fields="selectedFields"
                :is-processing="isProcessing"
                :hovered-info="hoveredInfo"
                @open-config="isConfigOpen = true"
                @enhance-path="onEnhancePath"
                @hover-change="handleHoverChange"
            />
            <MapView
                :current-path="currentPath"
                :hovered-info="hoveredInfo"
                @hover-change="handleHoverChange"
            />
        </div>
    </div>
</template>

<style>
.visualization-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
}

@media (max-width: 1200px) {
    .visualization-grid {
        grid-template-columns: 1fr;
    }
}
</style>
