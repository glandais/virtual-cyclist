import type { Path } from '@lib/types';
import { fieldToPointField } from '@lib/types';
import {
    CategoryScale,
    Chart,
    type ChartDataset,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    type ScaleOptions,
    Title,
    Tooltip,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { computed, type Ref, shallowRef, watch } from 'vue';
import { fieldConfig } from '~/config/fieldConfig';
import type { HoverInfo } from './useHoverSync';

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
    selectedFields: Ref<Set<string>>,
    hoveredInfo: Ref<HoverInfo | null>,
    onHoverChange: (index: number | null) => void
) {
    const chartInstance = shallowRef<Chart | null>(null);

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
                onHover: (_event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        onHoverChange(index);
                    } else {
                        onHoverChange(null);
                    }
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
            plugins: [
                {
                    id: 'crosshair',
                    afterDraw: chart => {
                        if (hoveredInfo.value === null) {
                            return;
                        }

                        const index = hoveredInfo.value.index;
                        const meta = chart.getDatasetMeta(0);
                        if (!meta || !meta.data[index]) {
                            return;
                        }

                        const x = meta.data[index].x;
                        const yAxis = chart.scales.y || Object.values(chart.scales)[1];
                        if (!yAxis) {
                            return;
                        }

                        const ctx = chart.ctx;
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x, yAxis.top);
                        ctx.lineTo(x, yAxis.bottom);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                        ctx.setLineDash([5, 5]);
                        ctx.stroke();
                        ctx.restore();
                    },
                },
            ],
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
            const distance = path.getDistance(i);
            labels.push(distance / 1000); // Convert to km
        }

        // Build datasets for selected fields
        const datasets: ChartDataset<'line'>[] = [];
        const scales: Record<string, ScaleOptions> = {
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
                label: fieldDef.shortDescription,
                data,
                borderColor: fieldDef.color,
                //backgroundColor: category.color + '33',
                yAxisID: axisId,
                tension: 0,
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

    // Watch for hover changes to trigger crosshair redraw
    watch(hoveredInfo, () => {
        if (chartInstance.value) {
            chartInstance.value.update('none'); // Update without animation
        }
    });

    return {
        chartInstance,
        createChart,
        updateChart,
        resetZoom,
        hasData,
    };
}
