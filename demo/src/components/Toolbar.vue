<script setup lang="ts">
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { computed } from 'vue';

const props = defineProps<{
    hasData: boolean;
    isProcessing: boolean;
    statusText: string;
    filesSectionVisible: boolean;
    configVisible: boolean;
    fieldsSidebarVisible: boolean;
}>();

const emit = defineEmits<{
    toggleFilesSection: [];
    toggleConfig: [];
    toggleFieldsSidebar: [];
    enhancePath: [];
    resetZoom: [];
}>();

const fileButtonLabel = computed(() =>
    props.filesSectionVisible ? '📁 Hide Files' : '📁 Load File'
);
const configButtonLabel = computed(() => (props.configVisible ? '⚙️ Hide Config' : '⚙️ Config'));
const fieldsButtonLabel = computed(() =>
    props.fieldsSidebarVisible ? '📊 Hide Fields' : '📊 Fields'
);
</script>

<template>
    <div class="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
        <!-- File Section Toggle -->
        <Button @click="emit('toggleFilesSection')" severity="secondary" outlined size="small">
            {{ fileButtonLabel }}
        </Button>

        <!-- Config Toggle -->
        <Button @click="emit('toggleConfig')" severity="secondary" outlined size="small">
            {{ configButtonLabel }}
        </Button>

        <!-- Fields Sidebar Toggle -->
        <Button @click="emit('toggleFieldsSidebar')" severity="secondary" outlined size="small">
            {{ fieldsButtonLabel }}
        </Button>

        <div class="border-l border-gray-300 h-6 mx-1"></div>

        <!-- Enhance Path -->
        <Button
            @click="emit('enhancePath')"
            :disabled="!hasData || isProcessing"
            severity="primary"
            size="small"
        >
            🚀 Enhance
        </Button>

        <!-- Reset Zoom -->
        <Button
            @click="emit('resetZoom')"
            :disabled="!hasData"
            severity="secondary"
            outlined
            size="small"
        >
            🔍 Reset Zoom
        </Button>

        <!-- Processing Status -->
        <div v-if="isProcessing" class="flex items-center gap-2 ml-auto">
            <ProgressSpinner style="width: 20px; height: 20px" strokeWidth="4" />
            <span class="text-xs text-gray-600">{{ statusText }}</span>
        </div>
    </div>
</template>
