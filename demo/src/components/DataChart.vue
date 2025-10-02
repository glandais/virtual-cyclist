<script setup lang="ts">
import type { Path, PointFieldName } from '@lib/types';
import { onMounted, ref, toRef } from 'vue';
import { useChart } from '~/composables/useChart';

const props = defineProps<{
    currentPath: Path | null;
    selectedFields: Set<PointFieldName>;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const { createChart, resetZoom, hasData } = useChart(
    canvasRef,
    toRef(props, 'currentPath'),
    toRef(props, 'selectedFields')
);

onMounted(() => {
    createChart();
});
</script>

<template>
    <section class="chart-section">
        <div class="chart-controls">
            <button
                id="reset-zoom-btn"
                class="btn btn-secondary"
                :disabled="!hasData"
                @click="resetZoom"
            >
                🔍 Reset Zoom
            </button>
        </div>
        <div class="chart-container">
            <canvas ref="canvasRef" id="data-chart"></canvas>
        </div>
    </section>
</template>
