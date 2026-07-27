<script setup lang="ts">
import { onMounted, ref, toRef } from 'vue';
import { useMap } from '~/composables/useMap';
import type { Path } from '@lib/types';
import type { HoverInfo } from '~/composables/useHoverSync';

const props = defineProps<{
    currentPath: Path | null;
    hoveredInfo: HoverInfo | null;
}>();

const emit = defineEmits<{
    hoverChange: [index: number | null];
}>();

const mapContainerRef = ref<HTMLElement | null>(null);

const { createMap, fitBounds } = useMap(
    mapContainerRef,
    toRef(props, 'currentPath'),
    toRef(props, 'hoveredInfo'),
    (index: number | null) => emit('hoverChange', index)
);

defineExpose({
    fitBounds,
});

onMounted(() => {
    createMap();
});
</script>

<template>
    <section class="flex-1 bg-white">
        <div ref="mapContainerRef" class="w-full h-full leaflet-map"></div>
    </section>
</template>
