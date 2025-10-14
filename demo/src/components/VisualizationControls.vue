<script setup lang="ts">
import Button from 'primevue/button';

defineProps<{
    hasData: boolean;
    isProcessing: boolean;
}>();

const emit = defineEmits<{
    enhancePath: [];
    resetZoom: [];
}>();
</script>

<template>
    <div class="flex gap-3 p-4 bg-white border-b border-gray-200">
        <Button
            @click="emit('enhancePath')"
            :disabled="!hasData || isProcessing"
            severity="primary"
        >
            🚀 Enhance Path
        </Button>
        <Button
            id="reset-zoom-btn"
            @click="emit('resetZoom')"
            :disabled="!hasData"
            severity="secondary"
            outlined
        >
            🔍 Reset Zoom
        </Button>
    </div>
</template>
