<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ControlPanel from '~/components/ControlPanel.vue';
import DataChart from '~/components/DataChart.vue';
import DataPanel from '~/components/DataPanel.vue';
import FileSection from '~/components/FileSection.vue';
import { useGPXDemo } from '~/composables/useGPXDemo';

const selectedFields = ref(new Set<string>(['ele', 'speed']));

const {
    currentPath,
    isProcessing,
    statusText,
    fileName,
    loadGPXFile,
    handleFileUpload,
    fixElevation,
    computeMaxSpeeds,
    enhancePath,
} = useGPXDemo();

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

const onFixElevation = async () => {
    try {
        await fixElevation();
    } catch (error) {
        alert('Failed to fix elevation: ' + (error as Error).message);
    }
};

const onComputeSpeeds = async () => {
    try {
        await computeMaxSpeeds();
    } catch (error) {
        alert('Failed to compute speeds: ' + (error as Error).message);
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
});
</script>

<template>
    <div id="app">
        <!-- Header Section -->
        <header class="app-header">
            <h1>🚴‍♂️ Virtual Cyclist - Interactive GPX Analysis</h1>
            <p>Analyze cycling data with elevation correction and maximum speed computation</p>
        </header>

        <!-- File Selection Section -->
        <FileSection
            :file-name="fileName"
            :current-path="currentPath"
            :is-processing="isProcessing"
            @gpx-select="onGPXSelect"
            @file-upload="onFileUpload"
        />

        <!-- Control Panel -->
        <ControlPanel
            :is-processing="isProcessing"
            :status-text="statusText"
            :has-data="currentPath !== null"
            @fix-elevation="onFixElevation"
            @compute-speeds="onComputeSpeeds"
            @enhance-path="onEnhancePath"
        />

        <!-- Data Selection Panel -->
        <DataPanel v-model:selected-fields="selectedFields" />

        <!-- Chart Section -->
        <DataChart :current-path="currentPath" :selected-fields="selectedFields" />
    </div>
</template>
