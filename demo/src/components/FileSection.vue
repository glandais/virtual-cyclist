<script setup lang="ts">
import type { Path } from '@lib/types';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
    fileName: string;
    currentPath: Path | null;
    isProcessing: boolean;
}>();

const emit = defineEmits<{
    gpxSelect: [url: string];
    fileUpload: [file: File];
}>();

const selectedGPX = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const isFileInfoExpanded = ref(true);

const onGPXChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
        emit('gpxSelect', target.value);
        if (fileInput.value) {
            fileInput.value.value = '';
        }
    }
};

const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        emit('fileUpload', target.files[0]);
        selectedGPX.value = '';
    }
};

const fileInfo = computed(() => {
    if (!props.currentPath) {
        return null;
    }

    const path = props.currentPath;
    return {
        pointCount: path.getPointCount(),
        distance: path.getTotalDistance() / 1000,
        elevationGain: path.getTotalElevationGain(),
        elevationLoss: path.getTotalElevationLoss(),
        minElevation: path.getMinElevation(),
        maxElevation: path.getMaxElevation(),
    };
});

watch(
    () => props.currentPath,
    () => {
        // Reset file input when path changes
    }
);
</script>

<template>
    <section class="file-section">
        <div class="file-controls">
            <div class="file-group">
                <label for="gpx-select">Choose sample GPX:</label>
                <select
                    id="gpx-select"
                    v-model="selectedGPX"
                    :disabled="isProcessing"
                    @change="onGPXChange"
                >
                    <option value="">Select a sample file...</option>
                    <option value="gpx/sample.gpx">Sample Route</option>
                    <option value="gpx/stelvio.gpx">Stelvio descent</option>
                    <option value="gpx/amazfit.gpx">Amazfit Track</option>
                    <option value="gpx/garmin.gpx">Garmin Track</option>
                    <option value="gpx/movescount.gpx">Movescount Track</option>
                    <option value="gpx/sports-tracker.gpx">Sports Tracker</option>
                    <option value="gpx/strava.gpx">Strava Track</option>
                </select>
            </div>
            <div class="file-group">
                <label for="gpx-upload">Or upload your own:</label>
                <input
                    id="gpx-upload"
                    ref="fileInput"
                    type="file"
                    accept=".gpx"
                    :disabled="isProcessing"
                    @change="onFileChange"
                />
            </div>
        </div>
        <div v-if="fileInfo" id="file-info" class="file-info show">
            <div class="file-info-header" @click="isFileInfoExpanded = !isFileInfoExpanded">
                <h4>📄 {{ fileName }}</h4>
                <button class="toggle-button" :class="{ collapsed: !isFileInfoExpanded }">
                    {{ isFileInfoExpanded ? '▼' : '▶' }}
                </button>
            </div>
            <Transition name="expand">
                <div v-show="isFileInfoExpanded" class="info-grid">
                    <div class="info-item">
                        <div class="label">Points</div>
                        <div class="value">{{ fileInfo.pointCount.toLocaleString() }}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Distance</div>
                        <div class="value">{{ fileInfo.distance.toFixed(1) }} km</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Elevation Range</div>
                        <div class="value">
                            {{ fileInfo.minElevation.toFixed(0) }}m -
                            {{ fileInfo.maxElevation.toFixed(0) }}m
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="label">Elevation Gain</div>
                        <div class="value">{{ fileInfo.elevationGain.toFixed(0) }}m</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Elevation Loss</div>
                        <div class="value">{{ fileInfo.elevationLoss.toFixed(0) }}m</div>
                    </div>
                </div>
            </Transition>
        </div>
    </section>
</template>
