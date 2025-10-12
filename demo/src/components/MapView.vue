<script setup lang="ts">
import type { Path } from '@lib/types';
import { computed, onMounted, ref, toRef } from 'vue';
import type { HoverInfo } from '~/composables/useHoverSync';
import { useMap } from '~/composables/useMap';

const props = defineProps<{
    currentPath: Path | null;
    hoveredInfo: HoverInfo | null;
}>();

const emit = defineEmits<{
    hoverChange: [index: number | null];
}>();

const mapContainerRef = ref<HTMLElement | null>(null);

type DisplayMode = 'normal' | 'maximized' | 'fullscreen';
const displayMode = ref<DisplayMode>('normal');

const { createMap, mapInstance } = useMap(
    mapContainerRef,
    toRef(props, 'currentPath'),
    toRef(props, 'hoveredInfo'),
    (index: number | null) => emit('hoverChange', index)
);

const hasData = computed(() => props.currentPath !== null);

const displayModeIcon = computed(() => {
    switch (displayMode.value) {
        case 'normal':
            return '⛶';
        case 'maximized':
            return '⤢';
        case 'fullscreen':
            return '⤓';
    }
    return '⤓';
});

const displayModeLabel = computed(() => {
    switch (displayMode.value) {
        case 'normal':
            return 'Maximize';
        case 'maximized':
            return 'Fullscreen';
        case 'fullscreen':
            return 'Exit Fullscreen';
    }
    return 'Exit Fullscreen';
});

const mapSectionRef = ref<HTMLElement | null>(null);

const toggleDisplayMode = async () => {
    if (displayMode.value === 'normal') {
        displayMode.value = 'maximized';
    } else if (displayMode.value === 'maximized') {
        if (mapSectionRef.value) {
            try {
                await mapSectionRef.value.requestFullscreen();
                displayMode.value = 'fullscreen';
            } catch (err) {
                console.error('Fullscreen failed:', err);
            }
        }
    } else {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
        displayMode.value = 'normal';
    }

    // Trigger map resize after display mode change
    window.setTimeout(() => {
        if (mapInstance.value) {
            mapInstance.value.invalidateSize();
        }
    }, 100);
};

const handleFullscreenChange = () => {
    if (!document.fullscreenElement && displayMode.value === 'fullscreen') {
        displayMode.value = 'normal';
    }
};

onMounted(() => {
    createMap();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<template>
    <section
        ref="mapSectionRef"
        class="map-section"
        :class="{
            'map-maximized': displayMode === 'maximized',
            'map-fullscreen': displayMode === 'fullscreen',
        }"
    >
        <div class="map-controls">
            <h3>🗺️ Route Map</h3>
            <button
                class="btn btn-secondary"
                :disabled="!hasData"
                @click="toggleDisplayMode"
                :title="displayModeLabel"
            >
                {{ displayModeIcon }} {{ displayModeLabel }}
            </button>
        </div>
        <div class="map-container" ref="mapContainerRef"></div>
    </section>
</template>

<style scoped>
.map-section {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 400px;
}

.map-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 0.5rem;
}

.map-controls h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #2c3e50;
}

.map-container {
    flex: 1;
    border-radius: 4px;
    overflow: hidden;
    min-height: 350px;
    position: relative;
    z-index: 0;
}

.map-maximized {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    border-radius: 0;
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 1rem;
}

.map-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    border-radius: 0;
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 1rem;
}

.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background: #5a6268;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
