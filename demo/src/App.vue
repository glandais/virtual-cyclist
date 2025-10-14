<script setup lang="ts">
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import ConfigModal from '~/components/ConfigModal.vue';
import DataChart from '~/components/DataChart.vue';
import FieldsSidebar from '~/components/FieldsSidebar.vue';
import FileSection from '~/components/FileSection.vue';
import MapView from '~/components/MapView.vue';
import Toolbar from '~/components/Toolbar.vue';
import { loadConfig, useConfigPersistence } from '~/composables/useConfigPersistence';
import { useGPXDemo } from '~/composables/useGPXDemo';
import { useHoverSync } from '~/composables/useHoverSync';

const toast = useToast();

// Load config from localStorage or use defaults
const config = ref(loadConfig());

// Set up auto-save with debouncing
useConfigPersistence(config);

const {
    currentPath,
    isProcessing,
    statusText,
    fileName,
    loadGPXFile,
    handleFileUpload,
    enhancePath,
} = useGPXDemo(config);

// Set up hover sync between chart and map
const { hoveredInfo, setHoveredIndex } = useHoverSync(currentPath);

const handleHoverChange = (index: number | null) => {
    setHoveredIndex(index);
};

// Refs to components for reset zoom functionality
const dataChartRef = ref<InstanceType<typeof DataChart> | null>(null);
const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);

const hasData = computed(() => currentPath.value !== null);

// UI visibility toggles with localStorage persistence
const UI_STATE_KEY = 'virtual-cyclist-ui-state';

const loadUIState = () => {
    try {
        const saved = window.localStorage.getItem(UI_STATE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch {
        // Ignore errors
    }
    return {
        filesSectionVisible: false,
        configVisible: false,
        fieldsSidebarVisible: true,
    };
};

const saveUIState = () => {
    try {
        window.localStorage.setItem(
            UI_STATE_KEY,
            JSON.stringify({
                filesSectionVisible: filesSectionVisible.value,
                configVisible: configVisible.value,
                fieldsSidebarVisible: fieldsSidebarVisible.value,
            })
        );
    } catch {
        // Ignore errors
    }
};

const initialUIState = loadUIState();
const filesSectionVisible = ref(initialUIState.filesSectionVisible);
const configVisible = ref(initialUIState.configVisible);
const fieldsSidebarVisible = ref(initialUIState.fieldsSidebarVisible);

// Watch UI state changes and persist them
watch([filesSectionVisible, configVisible, fieldsSidebarVisible], saveUIState);

// Watch for sidebar toggle and resize chart after DOM update
watch(fieldsSidebarVisible, async () => {
    await nextTick();
    dataChartRef.value?.resize();
});

const handleResetZoom = () => {
    dataChartRef.value?.resetZoom();
    mapViewRef.value?.fitBounds();
};

const onGPXSelect = async (url: string) => {
    try {
        await loadGPXFile(url);
        toast.add({
            severity: 'success',
            summary: 'GPX Loaded',
            detail: 'GPX file loaded successfully',
            life: 3000,
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Load Failed',
            detail: 'Failed to load GPX file: ' + (error as Error).message,
            life: 5000,
        });
    }
};

const onFileUpload = async (file: File) => {
    try {
        await handleFileUpload(file);
        toast.add({
            severity: 'success',
            summary: 'File Uploaded',
            detail: 'File uploaded successfully',
            life: 3000,
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: 'Failed to upload file: ' + (error as Error).message,
            life: 5000,
        });
    }
};

const onEnhancePath = async () => {
    try {
        await enhancePath();
        toast.add({
            severity: 'success',
            summary: 'Path Enhanced',
            detail: 'Path enhanced successfully',
            life: 3000,
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Enhancement Failed',
            detail: 'Failed to enhance path: ' + (error as Error).message,
            life: 5000,
        });
    }
};

onMounted(() => {
    console.log('GPX Demo App initialized successfully');
    loadGPXFile('gpx/stelvio.gpx').then(() => enhancePath());
});
</script>

<template>
    <Toast />
    <div
        id="app"
        class="h-screen flex flex-col bg-white/95 mx-auto w-full shadow-2xl overflow-hidden"
    >
        <!-- Header Section -->
        <header
            class="bg-gradient-to-r from-slate-700 to-blue-500 text-white p-6 text-center shadow-md flex-shrink-0"
        >
            <h1 class="text-4xl mb-2 font-light">🚴‍♂️ Virtual Cyclist - Interactive GPX Analysis</h1>
            <p class="text-lg opacity-90">
                Upload GPX routes and simulate realistic cycling speeds based on terrain and rider
                physics
            </p>
        </header>

        <!-- Toolbar -->
        <Toolbar
            :has-data="hasData"
            :is-processing="isProcessing"
            :status-text="statusText"
            :files-section-visible="filesSectionVisible"
            :config-visible="configVisible"
            :fields-sidebar-visible="fieldsSidebarVisible"
            @toggle-files-section="filesSectionVisible = !filesSectionVisible"
            @toggle-config="configVisible = !configVisible"
            @toggle-fields-sidebar="fieldsSidebarVisible = !fieldsSidebarVisible"
            @enhance-path="onEnhancePath"
            @reset-zoom="handleResetZoom"
        />
        <FieldsSidebar v-model="config.selectedFields" v-model:visible="fieldsSidebarVisible" />

        <!-- Scrollable Content Area -->
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col">
            <!-- File Selection Section (Toggleable) -->
            <FileSection
                v-if="filesSectionVisible"
                :file-name="fileName"
                :current-path="currentPath"
                :is-processing="isProcessing"
                @gpx-select="onGPXSelect"
                @file-upload="onFileUpload"
            />

            <!-- Configuration Panel (Toggleable) -->
            <ConfigModal v-if="configVisible" v-model="config" />

            <!-- Chart and Map Section with Sidebar -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4 flex-1 min-h-0">
                <!-- Chart with Fields Sidebar -->
                <div class="flex h-full border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <DataChart
                        ref="dataChartRef"
                        :current-path="currentPath"
                        :selected-fields="config.selectedFields"
                        :is-processing="isProcessing"
                        :hovered-info="hoveredInfo"
                        @hover-change="handleHoverChange"
                        class="flex-1"
                    />
                </div>

                <!-- Map -->
                <MapView
                    ref="mapViewRef"
                    :current-path="currentPath"
                    :hovered-info="hoveredInfo"
                    @hover-change="handleHoverChange"
                />
            </div>
        </div>
    </div>
</template>
