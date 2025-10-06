<script setup lang="ts">
defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();

const handleBackdropClick = (event: Event) => {
    if (event.target === event.currentTarget) {
        emit('close');
    }
};
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="modal-backdrop" @click="handleBackdropClick">
                <div class="modal-dialog">
                    <slot />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
}

.modal-dialog {
    background: white;
    border-radius: 16px;
    max-width: 900px;
    max-height: 90vh;
    overflow: visible;
    position: relative;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
    transition: transform 0.3s ease;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
    transform: scale(0.9);
}

@media (max-width: 768px) {
    .modal-backdrop {
        padding: 1rem;
    }

    .modal-dialog {
        max-height: 95vh;
    }
}
</style>
