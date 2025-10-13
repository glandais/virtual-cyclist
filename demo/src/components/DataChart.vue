<script setup lang="ts">
import type { Path } from '@lib/types';
import { computed, onMounted, ref, toRef } from 'vue';
import { useChart } from '~/composables/useChart';
import type { HoverInfo } from '~/composables/useHoverSync';

const props = defineProps<{
    currentPath: Path | null;
    selectedFields: Set<string>;
    isProcessing: boolean;
    hoveredInfo: HoverInfo | null;
}>();

const emit = defineEmits<{
    openConfig: [];
    enhancePath: [];
    hoverChange: [index: number | null];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const chartSectionRef = ref<HTMLElement | null>(null);

type DisplayMode = 'normal' | 'maximized' | 'fullscreen';
const displayMode = ref<DisplayMode>('normal');

const { createChart, resetZoom, hasData } = useChart(
    canvasRef,
    toRef(props, 'currentPath'),
    toRef(props, 'selectedFields'),
    toRef(props, 'hoveredInfo'),
    (index: number | null) => emit('hoverChange', index)
);

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

const toggleDisplayMode = async () => {
    if (displayMode.value === 'normal') {
        displayMode.value = 'maximized';
    } else if (displayMode.value === 'maximized') {
        if (chartSectionRef.value) {
            try {
                await chartSectionRef.value.requestFullscreen();
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
};

const handleFullscreenChange = () => {
    if (!document.fullscreenElement && displayMode.value === 'fullscreen') {
        displayMode.value = 'normal';
    }
};

onMounted(() => {
    createChart();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<template>
    <section
        ref="chartSectionRef"
        class="chart-section"
        :class="{
            'chart-maximized': displayMode === 'maximized',
            'chart-fullscreen': displayMode === 'fullscreen',
        }"
    >
        <div class="chart-controls">
            <button class="btn btn-secondary" @click="emit('openConfig')">⚙️ Settings</button>
            <button
                class="btn btn-primary"
                :disabled="!hasData || isProcessing"
                @click="emit('enhancePath')"
            >
                🚀 Enhance Path
            </button>
            <button
                id="reset-zoom-btn"
                class="btn btn-secondary"
                :disabled="!hasData"
                @click="resetZoom"
            >
                🔍 Reset Zoom
            </button>
            <button
                class="btn btn-secondary"
                :disabled="!hasData"
                @click="toggleDisplayMode"
                :title="displayModeLabel"
            >
                {{ displayModeIcon }} {{ displayModeLabel }}
            </button>
        </div>
        <div class="chart-container">
            <canvas ref="canvasRef" id="data-chart"></canvas>
        </div>
    </section>
</template>
