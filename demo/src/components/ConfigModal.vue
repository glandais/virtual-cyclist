<script setup lang="ts">
import { EnhanceOptions } from '@lib/types';
import { BikeProperties, CyclistProperties } from '@lib/types/models';
import { ref } from 'vue';
import { PowerParams, WindDemo } from '~/types';
import BikeTab from './BikeTab.vue';
import CyclistTab from './CyclistTab.vue';
import EnhanceOptionsTab from './EnhanceOptionsTab.vue';
import FieldsTab from './FieldsTab.vue';
import Modal from './Modal.vue';
import PowerTab from './PowerTab.vue';
import WindTab from './WindTab.vue';

const bike = defineModel<BikeProperties>('bike', { required: true });
const cyclist = defineModel<CyclistProperties>('cyclist', { required: true });
const wind = defineModel<WindDemo>('wind', { required: true });
const enhanceOptions = defineModel<EnhanceOptions>('enhanceOptions', { required: true });
const powerParams = defineModel<PowerParams>('powerParams', { required: true });
const selectedFields = defineModel<Set<string>>('selectedFields', { required: true });

defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();

type TabType = 'cyclist' | 'bike' | 'wind' | 'power' | 'options' | 'fields';
const activeTab = ref<TabType>('cyclist');
</script>

<template>
    <Modal :is-open="isOpen" @close="emit('close')">
        <div class="config-modal">
            <header class="modal-header">
                <h2>⚙️ Configuration</h2>
                <button class="modal-close" @click="emit('close')" aria-label="Close">✕</button>
            </header>

            <nav class="tabs">
                <button
                    @click="activeTab = 'cyclist'"
                    :class="{ active: activeTab === 'cyclist' }"
                    class="tab-btn"
                >
                    👤 Cyclist
                </button>
                <button
                    @click="activeTab = 'bike'"
                    :class="{ active: activeTab === 'bike' }"
                    class="tab-btn"
                >
                    🚴 Bike
                </button>
                <button
                    @click="activeTab = 'wind'"
                    :class="{ active: activeTab === 'wind' }"
                    class="tab-btn"
                >
                    💨 Wind
                </button>
                <button
                    @click="activeTab = 'power'"
                    :class="{ active: activeTab === 'power' }"
                    class="tab-btn"
                >
                    ⚡ Power
                </button>
                <button
                    @click="activeTab = 'options'"
                    :class="{ active: activeTab === 'options' }"
                    class="tab-btn"
                >
                    🔧 Options
                </button>
                <button
                    @click="activeTab = 'fields'"
                    :class="{ active: activeTab === 'fields' }"
                    class="tab-btn"
                >
                    📊 Fields
                </button>
            </nav>

            <div class="tab-content">
                <CyclistTab v-if="activeTab === 'cyclist'" v-model="cyclist" />
                <BikeTab v-if="activeTab === 'bike'" v-model="bike" />
                <WindTab v-if="activeTab === 'wind'" v-model="wind" />
                <PowerTab v-if="activeTab === 'power'" v-model="powerParams" />
                <EnhanceOptionsTab v-if="activeTab === 'options'" v-model="enhanceOptions" />
                <FieldsTab v-if="activeTab === 'fields'" v-model="selectedFields" />
            </div>
        </div>
    </Modal>
</template>

<style scoped>
.config-modal {
    display: flex;
    flex-direction: column;
    height: 80vh;
    max-height: 700px;
    width: 90vw;
    max-width: 800px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
}

.modal-header {
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
}

.modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 32px;
    height: 32px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.5rem;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}

.modal-close:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
}

.tabs {
    display: flex;
    background: #f5f5f5;
    border-bottom: 2px solid #ddd;
    overflow-x: auto;
}

.tab-btn {
    flex: 1;
    padding: 1rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    color: #666;
    transition: all 0.2s;
    white-space: nowrap;
}

.tab-btn:hover {
    background: #ebebeb;
    color: #333;
}

.tab-btn.active {
    background: white;
    color: #0066cc;
    border-bottom-color: #0066cc;
}

.tab-content {
    flex: 1;
    overflow-y: auto;
    background: white;
}

/* Scrollbar styling */
.tab-content::-webkit-scrollbar {
    width: 6px;
}

.tab-content::-webkit-scrollbar-track {
    background: transparent;
}

.tab-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
}

/* Firefox scrollbar */
.tab-content {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

@media (max-width: 768px) {
    .config-modal {
        width: 95vw;
        height: 90vh;
    }

    .tab-btn {
        font-size: 0.85rem;
        padding: 0.75rem 0.5rem;
    }
}
</style>
