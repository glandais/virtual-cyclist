<script setup lang="ts">
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
    <section class="data-panel">
        <h3>📊 Data Fields to Display</h3>
        <div class="field-categories">
            <div
                v-for="(category, categoryKey) in fieldConfig"
                :key="categoryKey"
                class="field-category"
            >
                <h4>{{ category.name }}</h4>
                <div class="field-checkboxes">
                    <div
                        v-for="(field, fieldKey) in category.fields"
                        :key="fieldKey"
                        class="field-checkbox"
                    >
                        <input
                            :id="`field-${fieldKey}`"
                            type="checkbox"
                            :checked="selectedFields.has(fieldKey)"
                            @change="toggleField(fieldKey)"
                        />
                        <label :for="`field-${fieldKey}`">{{ field!.shortDescription }}</label>
                        <span class="field-unit">{{ field!.unit }}</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
