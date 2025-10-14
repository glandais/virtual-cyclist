<script setup lang="ts">
import Checkbox from 'primevue/checkbox';
import { fieldConfig } from '~/config/fieldConfig';

const props = defineProps<{
    selectedFields: Set<string>;
}>();

const emit = defineEmits<{
    'update:selectedFields': [fields: Set<string>];
}>();

const toggleField = (fieldKey: string) => {
    const newSet = new Set(props.selectedFields);
    if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
    } else {
        newSet.add(fieldKey);
    }
    emit('update:selectedFields', newSet);
};
</script>

<template>
    <section class="p-6 bg-white border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">📊 Data Fields to Display</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
                v-for="(category, categoryKey) in fieldConfig"
                :key="categoryKey"
                class="bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
            >
                <h4
                    class="text-base font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-300"
                >
                    {{ category.name }}
                </h4>
                <div class="flex flex-col gap-3">
                    <div
                        v-for="(field, fieldKey) in category.fields"
                        :key="fieldKey"
                        class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        <Checkbox
                            :inputId="`field-${fieldKey}`"
                            :binary="true"
                            :modelValue="selectedFields.has(fieldKey)"
                            @update:modelValue="toggleField(fieldKey)"
                        />
                        <label
                            :for="`field-${fieldKey}`"
                            class="cursor-pointer font-medium text-sm flex-1"
                        >
                            {{ field!.shortDescription }}
                        </label>
                        <span class="text-xs text-gray-500 italic">{{ field!.unit }}</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
