<script setup lang="ts">
import { WindDemo } from '~/types';
import SliderInput from './SliderInput.vue';

const props = defineProps<{
    modelValue: WindDemo;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: WindDemo];
}>();

const updateField = <K extends keyof WindDemo>(field: K, value: WindDemo[K]) => {
    emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const getWindDirectionLabel = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round((deg % 360) / 45) % 8;
    return directions[index];
};
</script>

<template>
    <div class="wind-tab">
        <h3>💨 Wind Configuration</h3>

        <SliderInput
            :model-value="modelValue.windSpeed"
            @update:model-value="updateField('windSpeed', $event)"
            label="Wind Speed"
            unit="m/s"
            :min="0"
            :max="20"
            :step="0.5"
            tooltip="Wind speed (0 = no wind)"
        />

        <div class="wind-direction">
            <label class="direction-label">
                Wind Direction
                <span class="tooltip" title="Direction wind is coming from (0° = North)">ⓘ</span>
            </label>

            <div class="direction-controls">
                <div class="compass">
                    <div
                        class="wind-arrow"
                        :style="{ transform: `rotate(${modelValue.windDirection}deg)` }"
                    >
                        ↓
                    </div>
                    <div class="compass-labels">
                        <span class="compass-n">N</span>
                        <span class="compass-e">E</span>
                        <span class="compass-s">S</span>
                        <span class="compass-w">W</span>
                    </div>
                </div>

                <div class="direction-input">
                    <input
                        type="number"
                        :value="modelValue.windDirection"
                        @input="
                            updateField(
                                'windDirection',
                                Number(($event.target as HTMLInputElement).value)
                            )
                        "
                        :min="0"
                        :max="360"
                        :step="15"
                        class="number-input"
                    />
                    <span class="unit">°</span>
                    <span class="direction-text">
                        ({{ getWindDirectionLabel(modelValue.windDirection) }})
                    </span>
                </div>
            </div>

            <div class="direction-slider">
                <input
                    type="range"
                    :value="modelValue.windDirection"
                    @input="
                        updateField(
                            'windDirection',
                            Number(($event.target as HTMLInputElement).value)
                        )
                    "
                    :min="0"
                    :max="360"
                    :step="15"
                    class="slider"
                />
            </div>
        </div>

        <div class="wind-info">
            <p class="info-text">
                <strong>Current wind:</strong>
                {{ modelValue.windSpeed.toFixed(1) }} m/s from
                {{ getWindDirectionLabel(modelValue.windDirection) }}
                ({{ modelValue.windDirection }}°)
            </p>
            <p class="info-hint">
                💡 Wind direction is where the wind is <em>coming from</em>, not blowing towards.
            </p>
        </div>
    </div>
</template>

<style scoped>
.wind-tab {
    padding: 1rem;
}

h3 {
    margin: 0 0 1.5rem 0;
    color: #333;
    font-size: 1.3rem;
}

.wind-direction {
    margin: 2rem 0;
}

.direction-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    margin-bottom: 1rem;
    color: #333;
}

.tooltip {
    cursor: help;
    color: #0066cc;
    font-size: 0.9em;
}

.direction-controls {
    display: flex;
    gap: 2rem;
    align-items: center;
    margin-bottom: 1rem;
}

.compass {
    position: relative;
    width: 120px;
    height: 120px;
    border: 3px solid #333;
    border-radius: 50%;
    background: linear-gradient(180deg, #e3f2fd 0%, #ffffff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.wind-arrow {
    font-size: 3rem;
    color: #0066cc;
    transition: transform 0.3s ease;
    transform-origin: center center;
    line-height: 1;
}

.compass-labels {
    position: absolute;
    width: 100%;
    height: 100%;
}

.compass-n,
.compass-e,
.compass-s,
.compass-w {
    position: absolute;
    font-weight: bold;
    color: #666;
    font-size: 0.9rem;
}

.compass-n {
    top: 5px;
    left: 50%;
    transform: translateX(-50%);
}
.compass-e {
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
}
.compass-s {
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
}
.compass-w {
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
}

.direction-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.number-input {
    width: 80px;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    text-align: center;
}

.number-input:focus {
    outline: none;
    border-color: #0066cc;
}

.unit {
    color: #666;
    font-size: 0.9rem;
}

.direction-text {
    color: #666;
    font-size: 0.95rem;
    font-weight: 500;
}

.direction-slider {
    margin-top: 1rem;
}

.slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(to right, #0066cc, #00cc66, #0066cc);
    outline: none;
    -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #0066cc;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #0066cc;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.wind-info {
    margin-top: 2rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 6px;
    border-left: 4px solid #0066cc;
}

.info-text {
    margin: 0 0 0.5rem 0;
    color: #333;
}

.info-hint {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
}
</style>
