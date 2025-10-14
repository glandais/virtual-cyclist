<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner';

defineProps<{
    isProcessing: boolean;
    statusText: string;
}>();
</script>

<template>
    <section v-if="isProcessing" class="px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-3 min-h-[2rem]">
            <ProgressSpinner
                style="width: 24px; height: 24px"
                strokeWidth="4"
                class="flex-shrink-0"
            />
            <div id="status-text" class="text-sm text-gray-600">{{ statusText }}</div>
        </div>
    </section>
</template>
