<script setup lang="ts">
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

// Nuxt UI drives the accordion from an items array with one named slot per
// entry, instead of PrimeVue's nested AccordionPanel/Header/Content elements.
const categoryKeys = Object.keys(fieldConfig);

const accordionItems = computed(() =>
    categoryKeys.map(key => ({
        label: fieldConfig[key as keyof typeof fieldConfig]!.name,
        value: key,
        slot: key,
    }))
);

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
    <!--
        `modal: false` keeps this a side panel rather than a blocking dialog: it is open by
        default and the chart behind it must stay usable, which PrimeVue's Drawer allowed.
    -->
    <UDrawer
        v-model:open="visibleModel"
        title="📊 Chart Fields"
        direction="right"
        :handle="false"
        :modal="false"
        :ui="{ content: 'w-48/100' }"
    >
        <template #body>
            <UAccordion
                type="multiple"
                :items="accordionItems"
                :default-value="categoryKeys"
                :unmount-on-hide="false"
            >
                <template v-for="categoryKey in categoryKeys" #[categoryKey] :key="categoryKey">
                    <div class="flex flex-col gap-2 p-2">
                        <div
                            v-for="(field, fieldKey) in fieldConfig[
                                categoryKey as keyof typeof fieldConfig
                            ]!.fields"
                            :key="fieldKey"
                            class="flex items-start gap-2 p-1 rounded hover:bg-gray-50"
                        >
                            <UCheckbox
                                :id="`sidebar-field-${fieldKey}`"
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
                </template>
            </UAccordion>
        </template>
    </UDrawer>
</template>
