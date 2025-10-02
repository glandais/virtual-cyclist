<script setup lang="ts">
defineProps<{
    isProcessing: boolean;
    statusText: string;
}>();
</script>

<template>
    <section v-if="isProcessing" class="control-panel">
        <div class="progress-container">
            <div class="progress-spinner active"></div>
            <div id="status-text" class="status-text">{{ statusText }}</div>
        </div>
    </section>
</template>
