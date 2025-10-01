<script setup lang="ts">
defineProps<{
    isProcessing: boolean;
    statusText: string;
    hasData: boolean;
}>();

const emit = defineEmits<{
    fixElevation: [];
    computeSpeeds: [];
    enhancePath: [];
}>();
</script>

<template>
    <section class="control-panel">
        <div class="action-buttons">
            <button
                id="fix-elevation-btn"
                class="btn btn-primary"
                :disabled="!hasData || isProcessing"
                @click="emit('fixElevation')"
            >
                🏔️ Fix Elevation
            </button>
            <button
                id="compute-speeds-btn"
                class="btn btn-primary"
                :disabled="!hasData || isProcessing"
                @click="emit('computeSpeeds')"
            >
                ⚡ Compute Max Speeds
            </button>
            <button
                id="enhance-path-btn"
                class="btn btn-primary"
                :disabled="!hasData || isProcessing"
                @click="emit('enhancePath')"
            >
                🚀 Enhance Path
            </button>
        </div>
        <div class="progress-container">
            <div id="progress-bar" class="progress-bar" :class="{ active: isProcessing }"></div>
            <div id="status-text" class="status-text">{{ statusText }}</div>
        </div>
    </section>
</template>
