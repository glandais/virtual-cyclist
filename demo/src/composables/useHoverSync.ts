import type { Path } from '@lib/types';
import { computed, type Ref, ref } from 'vue';

export interface HoverInfo {
    index: number;
    distance: number;
    lat: number;
    lon: number;
}

export function useHoverSync(currentPath: Ref<Path | null>) {
    const hoveredIndex = ref<number | null>(null);

    const hoveredInfo = computed<HoverInfo | null>(() => {
        if (hoveredIndex.value === null || !currentPath.value) {
            return null;
        }

        const path = currentPath.value;
        const idx = hoveredIndex.value;

        if (idx < 0 || idx >= path.getPointCount()) {
            return null;
        }

        return {
            index: idx,
            distance: path.getDistance(idx),
            lat: path.getLatitudeDeg(idx),
            lon: path.getLongitudeDeg(idx),
        };
    });

    const setHoveredIndex = (index: number | null) => {
        hoveredIndex.value = index;
    };

    const clearHover = () => {
        hoveredIndex.value = null;
    };

    return {
        hoveredIndex,
        hoveredInfo,
        setHoveredIndex,
        clearHover,
    };
}
