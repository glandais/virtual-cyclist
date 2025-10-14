<script setup lang="ts">
import Dialog from 'primevue/dialog';

defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();
</script>

<template>
    <Dialog
        :visible="isOpen"
        @update:visible="(val: boolean) => !val && emit('close')"
        :modal="true"
        :dismissableMask="true"
        :closable="false"
        :draggable="false"
        class="w-[90vw] max-w-[900px]"
        contentClass="p-0"
    >
        <slot />
    </Dialog>
</template>
