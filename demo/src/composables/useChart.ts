import type { Path } from '@lib/types';
import { PointField } from '@lib/types';
import {
    CategoryScale,
    Chart,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { computed, type Ref, shallowRef, watch } from 'vue';
import { fieldConfig } from '~/config/fieldConfig';

// Register Chart.js components
Chart.register(
    LineController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin
);

export function useChart(
    canvasRef: Ref<HTMLCanvasElement | null>,
    currentPath: Ref<Path | null>,
    selectedFields: Ref<Set<string>>
) {
    const chartInstance = shallowRef<Chart | null>(null);

    const fieldToPointField: Record<string, PointField> = {
        ele: PointField.ELE,
        dist: PointField.DIST,
        radius: PointField.RADIUS,
        grade: PointField.GRADE,
        speed: PointField.SPEED,
        speedMax: PointField.SPEED_MAX,
        speedMaxIncline: PointField.SPEED_MAX_INCLINE,
        virtSpeedCurrent: PointField.VIRT_SPEED_CURRENT,
        power: PointField.POWER,
        pCyclistRaw: PointField.P_CYCLIST_RAW,
        pCyclistWheel: PointField.P_CYCLIST_WHEEL,
        pAero: PointField.P_AERO,
        pGravity: PointField.P_GRAVITY,
        pRollingResistance: PointField.P_ROLLING_RESISTANCE,
        temperature: PointField.TEMPERATURE,
        windSpeed: PointField.WIND_SPEED,
        windDirection: PointField.WIND_DIRECTION,
        windBearing: PointField.WIND_BEARING,
        heartRate: PointField.HEART_RATE,
        cadence: PointField.CADENCE,
    };

    const createChart = () => {
        if (!canvasRef.value) {
            return;
        }

        const ctx = canvasRef.value.getContext('2d');
        if (!ctx) {
            return;
        }

        chartInstance.value = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        enabled: true,
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true,
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                    },
                },
                scales: {},
            },
        });
    };

    const updateChart = () => {
        if (!chartInstance.value || !currentPath.value) {
            return;
        }

        const path = currentPath.value;
        const pointCount = path.getPointCount();

        // Create distance labels
        const labels: number[] = [];
        for (let i = 0; i < pointCount; i++) {
            const dist = path.getField(i, PointField.DIST);
            labels.push(dist / 1000); // Convert to km
        }

        // Build datasets for selected fields
        const datasets: any[] = [];
        const scales: Record<string, any> = {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Distance (km)',
                },
            },
        };

        const axisPositions: Record<string, 'left' | 'right'> = {};
        let leftAxisCount = 0;
        let rightAxisCount = 0;

        selectedFields.value.forEach(fieldKey => {
            const pointField = fieldToPointField[fieldKey];
            if (pointField === undefined) {
                return;
            }

            // Find category for this field
            let category = null;
            let fieldDef = null;
            for (const [, cat] of Object.entries(fieldConfig)) {
                if (cat.fields[fieldKey]) {
                    category = cat;
                    fieldDef = cat.fields[fieldKey];
                    break;
                }
            }

            if (!category || !fieldDef) {
                return;
            }

            // Get data
            const data: (number | null)[] = [];
            for (let i = 0; i < pointCount; i++) {
                const value = path.getField(i, pointField);
                data.push(value);
            }

            // Determine axis position
            const axisId = category.axis;
            if (!axisPositions[axisId]) {
                axisPositions[axisId] = leftAxisCount <= rightAxisCount ? 'left' : 'right';
                if (axisPositions[axisId] === 'left') {
                    leftAxisCount++;
                } else {
                    rightAxisCount++;
                }

                scales[axisId] = {
                    type: 'linear',
                    position: axisPositions[axisId],
                    title: {
                        display: true,
                        text: `${category.name} (${category.unit})`,
                    },
                    grid: {
                        drawOnChartArea: axisPositions[axisId] === 'left',
                    },
                };
            }

            datasets.push({
                label: fieldDef.label,
                data,
                borderColor: category.color,
                backgroundColor: category.color + '33',
                yAxisID: axisId,
                tension: 0.1,
                pointRadius: 0,
                borderWidth: 2,
            });
        });

        chartInstance.value.data.labels = labels;
        chartInstance.value.data.datasets = datasets;
        chartInstance.value.options.scales = scales;
        chartInstance.value.update();
    };

    const resetZoom = () => {
        if (chartInstance.value) {
            chartInstance.value.resetZoom();
        }
    };

    const hasData = computed(() => currentPath.value !== null);

    // Watch for changes and update chart
    watch([currentPath, selectedFields], updateChart, { deep: true });

    return {
        chartInstance,
        createChart,
        updateChart,
        resetZoom,
        hasData,
    };
}
