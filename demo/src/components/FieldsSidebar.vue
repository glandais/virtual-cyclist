<script setup lang="ts">
import { Drawer } from 'primevue';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Checkbox from 'primevue/checkbox';
import { computed } from 'vue';
import { fieldConfig } from '~/config/fieldConfig';

const props = defineProps<{
    modelValue: Set<string>;
    visible: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [fields: Set<string>];
    'update:visible': [visible: boolean];
}>();

const visibleModel = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});

const toggleField = (fieldKey: string) => {
    const newSet = new Set(props.modelValue);
    if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
    } else {
        newSet.add(fieldKey);
    }
    emit('update:modelValue', newSet);
};
</script>

<template>
    <Drawer
        v-model:visible="visibleModel"
        header="📊 Chart Fields"
        position="right"
        class="!w-48/100"
    >
        <Accordion :value="Object.keys(fieldConfig)" multiple class="border-none">
            <AccordionPanel
                v-for="(category, categoryKey) in fieldConfig"
                :key="categoryKey"
                :value="categoryKey"
            >
                <AccordionHeader class="text-sm font-semibold">
                    {{ category.name }}
                </AccordionHeader>
                <AccordionContent>
                    <div class="flex flex-col gap-2 p-2">
                        <div
                            v-for="(field, fieldKey) in category.fields"
                            :key="fieldKey"
                            class="flex items-start gap-2 p-1 rounded hover:bg-gray-50"
                        >
                            <Checkbox
                                :inputId="`sidebar-field-${fieldKey}`"
                                :binary="true"
                                :modelValue="modelValue.has(fieldKey)"
                                @update:modelValue="toggleField(fieldKey)"
                                class="mt-0.5"
                            />
                            <label
                                :for="`sidebar-field-${fieldKey}`"
                                class="cursor-pointer text-xs flex-1 leading-tight"
                            >
                                <div class="font-medium">{{ field!.shortDescription }}</div>
                                <div class="text-gray-500 italic">{{ field!.unit }}</div>
                            </label>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>
    </Drawer>
</template>
