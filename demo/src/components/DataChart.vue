<script setup lang="ts">
import type { Path } from '@lib/types';
import { onMounted, ref, toRef } from 'vue';
import { useChart } from '~/composables/useChart';
import type { HoverInfo } from '~/composables/useHoverSync';

const props = defineProps<{
    currentPath: Path | null;
    selectedFields: Set<string>;
    isProcessing: boolean;
    hoveredInfo: HoverInfo | null;
}>();

const emit = defineEmits<{
    hoverChange: [index: number | null];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const { createChart, resetZoom, resize } = useChart(
    canvasRef,
    toRef(props, 'currentPath'),
    toRef(props, 'selectedFields'),
    toRef(props, 'hoveredInfo'),
    (index: number | null) => emit('hoverChange', index)
);

defineExpose({
    resetZoom,
    resize,
});

onMounted(() => {
    createChart();
});
</script>

<template>
    <section class="flex-1 bg-white">
        <div class="w-full h-full p-4">
            <canvas ref="canvasRef" id="data-chart" class="w-full h-full"></canvas>
        </div>
    </section>
</template>
