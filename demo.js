/**
 * Virtual Cyclist Interactive GPX Demo
 *
 * Interactive web application for analyzing GPX cycling data with:
 * - GPX file loading (samples and upload)
 * - Elevation correction
 * - Maximum speed computation
 * - Multi-axis chart visualization
 * - Data field selection and filtering
 */

class GPXDemoApp {
    constructor() {
        this.currentPath = null;
        this.chart = null;
        this.isProcessing = false;

        // Data field configuration with categories and axis assignments
        this.fieldConfig = {
            elevation: {
                name: '🏔️ Elevation & Terrain',
                axis: 'elevation',
                color: '#8b5a3c',
                unit: 'm',
                fields: {
                    ele: { label: 'Elevation', unit: 'm' },
                    dist: { label: 'Distance', unit: 'm' },
                    radius: { label: 'Turn Radius', unit: 'm' },
                },
            },
            grade: {
                name: '📐 Grade & Slope',
                axis: 'grade',
                color: '#d35400',
                unit: '%',
                fields: {
                    grade: { label: 'Grade', unit: '%' },
                },
            },
            speed: {
                name: '🏃‍♂️ Speed & Motion',
                axis: 'speed',
                color: '#3498db',
                unit: 'm/s',
                fields: {
                    speed: { label: 'Current Speed', unit: 'm/s' },
                    speedMax: { label: 'Max Speed', unit: 'm/s' },
                    speedMaxIncline: { label: 'Max Speed (Incline)', unit: 'm/s' },
                    virtSpeedCurrent: { label: 'Virtual Speed', unit: 'm/s' },
                },
            },
            power: {
                name: '⚡ Power & Physics',
                axis: 'power',
                color: '#e74c3c',
                unit: 'W',
                fields: {
                    power: { label: 'Total Power', unit: 'W' },
                    pCyclistRaw: { label: 'Cyclist Power (Raw)', unit: 'W' },
                    pCyclistWheel: { label: 'Cyclist Power (Wheel)', unit: 'W' },
                    pAero: { label: 'Aerodynamic Power', unit: 'W' },
                    pGravity: { label: 'Gravity Power', unit: 'W' },
                    pRollingResistance: { label: 'Rolling Resistance', unit: 'W' },
                },
            },
            environmental: {
                name: '🌡️ Environmental',
                axis: 'environmental',
                color: '#27ae60',
                unit: 'mixed',
                fields: {
                    temperature: { label: 'Temperature', unit: '°C' },
                    windSpeed: { label: 'Wind Speed', unit: 'm/s' },
                    windDirection: { label: 'Wind Direction', unit: 'rad' },
                    windBearing: { label: 'Wind Bearing', unit: 'rad' },
                },
            },
            physiological: {
                name: '❤️ Physiological',
                axis: 'physiological',
                color: '#9b59b6',
                unit: 'mixed',
                fields: {
                    heartRate: { label: 'Heart Rate', unit: 'bpm' },
                    cadence: { label: 'Cadence', unit: 'rpm' },
                },
            },
        };

        this.selectedFields = new Set(['ele', 'speed']); // Default fields
        this.init();
    }

    async init() {
        try {
            await this.waitForLibraries();
            this.setupEventListeners();
            this.createFieldSelectors();
            this.createEmptyChart();
            this.updateUI();
            console.log('GPX Demo App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize GPX Demo App:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    async waitForLibraries() {
        // Wait for VirtualCyclist library to load
        let attempts = 0;
        while (!window.VirtualCyclist && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.VirtualCyclist) {
            throw new Error('VirtualCyclist library failed to load');
        }

        // Register Chart.js zoom plugin
        if (window.Chart && window.zoomPlugin) {
            Chart.register(zoomPlugin);
        }
    }

    setupEventListeners() {
        // GPX file selection
        document.getElementById('gpx-select').addEventListener('change', e => {
            if (e.target.value) {
                this.loadGPXFile(e.target.value);
                document.getElementById('gpx-upload').value = '';
            }
        });

        // GPX file upload
        document.getElementById('gpx-upload').addEventListener('change', e => {
            if (e.target.files[0]) {
                this.handleFileUpload(e.target.files[0]);
                document.getElementById('gpx-select').value = '';
            }
        });

        // Action buttons
        document.getElementById('fix-elevation-btn').addEventListener('click', () => {
            this.fixElevation();
        });

        document.getElementById('compute-speeds-btn').addEventListener('click', () => {
            this.computeMaxSpeeds();
        });

        document.getElementById('enhance-path-btn').addEventListener('click', () => {
            this.enhancePath();
        });

        document.getElementById('reset-zoom-btn').addEventListener('click', () => {
            this.resetZoom();
        });
    }

    createFieldSelectors() {
        Object.entries(this.fieldConfig).forEach(([categoryKey, category]) => {
            const container = document.getElementById(`${categoryKey}-fields`);
            if (!container) return;

            Object.entries(category.fields).forEach(([fieldKey, field]) => {
                const checkbox = this.createFieldCheckbox(fieldKey, field, category.color);
                container.appendChild(checkbox);
            });
        });
    }

    createFieldCheckbox(fieldKey, field, color) {
        const div = document.createElement('div');
        div.className = 'field-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `field-${fieldKey}`;
        checkbox.checked = this.selectedFields.has(fieldKey);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                this.selectedFields.add(fieldKey);
            } else {
                this.selectedFields.delete(fieldKey);
            }
            this.updateChart();
        });

        const label = document.createElement('label');
        label.htmlFor = `field-${fieldKey}`;
        label.textContent = field.label;

        const unit = document.createElement('span');
        unit.className = 'field-unit';
        unit.textContent = field.unit;

        div.appendChild(checkbox);
        div.appendChild(label);
        div.appendChild(unit);

        return div;
    }

    async loadGPXFile(url) {
        if (this.isProcessing) return;

        this.setProcessing(true, 'Loading GPX file...');

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load GPX: ${response.status} ${response.statusText}`);
            }

            const gpxContent = await response.text();
            await this.parseGPX(gpxContent, url.split('/').pop());
        } catch (error) {
            console.error('Error loading GPX file:', error);
            this.showError('Failed to load GPX file: ' + error.message);
        } finally {
            this.setProcessing(false);
        }
    }

    async handleFileUpload(file) {
        if (this.isProcessing) return;

        this.setProcessing(true, 'Reading uploaded file...');

        try {
            const reader = new FileReader();
            reader.onload = async e => {
                try {
                    await this.parseGPX(e.target.result, file.name);
                } catch (error) {
                    console.error('Error parsing uploaded file:', error);
                    this.showError('Failed to parse uploaded file: ' + error.message);
                } finally {
                    this.setProcessing(false);
                }
            };
            reader.onerror = () => {
                this.showError('Failed to read uploaded file');
                this.setProcessing(false);
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Error handling file upload:', error);
            this.showError('Failed to handle file upload: ' + error.message);
            this.setProcessing(false);
        }
    }

    async parseGPX(gpxContent, filename) {
        this.setProcessing(true, 'Parsing GPX data...');

        try {
            // Parse GPX using VirtualCyclist GPXParser
            this.currentPath = window.VirtualCyclist.GPXParser.parse(gpxContent).tracks[0];

            // Compute basic arrays (distances, bearings, etc.)
            this.currentPath.computeArrays();

            // Update file info display
            this.updateFileInfo(filename);

            // Update chart with initial data
            this.updateChart();

            // Enable action buttons
            this.updateUI();

            console.log('GPX parsed successfully:', {
                filename,
                points: this.currentPath.getPointCount(),
                distance: this.currentPath.getTotalDistance(),
                enhanced: this.currentPath.arePointsEnhanced(),
            });
        } catch (error) {
            throw new Error('Failed to parse GPX: ' + error.message);
        }
    }

    updateFileInfo(filename) {
        const fileInfo = document.getElementById('file-info');
        const path = this.currentPath;

        if (!path) {
            fileInfo.classList.remove('show');
            return;
        }

        const pointCount = path.getPointCount();
        const distance = path.getTotalDistance();
        const elevationGain = path.getTotalElevationGain();
        const elevationLoss = path.getTotalElevationLoss();
        const minElevation = path.getMinElevation();
        const maxElevation = path.getMaxElevation();

        fileInfo.innerHTML = `
            <h4>📄 ${filename}</h4>
            <div class="info-grid">
                <div class="info-item">
                    <div class="label">Points</div>
                    <div class="value">${pointCount.toLocaleString()}</div>
                </div>
                <div class="info-item">
                    <div class="label">Distance</div>
                    <div class="value">${(distance / 1000).toFixed(1)} km</div>
                </div>
                <div class="info-item">
                    <div class="label">Elevation Range</div>
                    <div class="value">${minElevation.toFixed(0)}m - ${maxElevation.toFixed(0)}m</div>
                </div>
                <div class="info-item">
                    <div class="label">Elevation Gain</div>
                    <div class="value">${elevationGain.toFixed(0)}m</div>
                </div>
                <div class="info-item">
                    <div class="label">Elevation Loss</div>
                    <div class="value">${elevationLoss.toFixed(0)}m</div>
                </div>
            </div>
        `;
        fileInfo.classList.add('show');
    }

    async fixElevation() {
        if (this.isProcessing || !this.currentPath) return;

        this.setProcessing(true, 'Correcting elevation data...');

        try {
            // Use VirtualCyclist elevation correction
            const correctedPath = await window.VirtualCyclist.Elevation.fixElevation(
                this.currentPath
            );
            this.currentPath = correctedPath;

            // Compute basic arrays (distances, bearings, etc.)
            this.currentPath.computeArrays();

            // Update file info and chart
            this.updateFileInfo('Corrected GPX');
            this.updateChart();

            this.showSuccess('Elevation data corrected successfully!');
            console.log('Elevation correction completed');
        } catch (error) {
            console.error('Error fixing elevation:', error);
            this.showError('Failed to fix elevation: ' + error.message);
        } finally {
            this.setProcessing(false);
        }
    }

    async computeMaxSpeeds() {
        if (this.isProcessing || !this.currentPath) return;

        this.setProcessing(true, 'Computing maximum speeds...');

        try {
            // Create course configuration
            const cyclist = window.VirtualCyclist.Cyclist.getDefault();
            const bike = window.VirtualCyclist.Bike.getDefault();
            const course = {
                path: this.currentPath,
                cyclist: cyclist,
                bike: bike,
            };

            // Compute maximum speeds
            const maxSpeedComputer = new window.VirtualCyclist.MaxSpeedComputer();
            maxSpeedComputer.computeMaxSpeeds(course);

            // Update chart with new speed data
            this.updateChart();

            this.showSuccess('Maximum speeds computed successfully!');
            console.log('Max speed computation completed');
        } catch (error) {
            console.error('Error computing max speeds:', error);
            this.showError('Failed to compute max speeds: ' + error.message);
        } finally {
            this.setProcessing(false);
        }
    }

    async enhancePath() {
        if (this.isProcessing || !this.currentPath) return;

        this.setProcessing(true, 'Enhancing path (elevation + speeds + virtualization + simplification)...');

        try {
            // Use VirtualCyclist Enhancer for full enhancement pipeline
            const enhancedPath = await window.VirtualCyclist.Enhancer.enhancePath(this.currentPath);
            this.currentPath = enhancedPath;

            // Update file info and chart
            this.updateFileInfo('Enhanced GPX');
            this.updateChart();

            this.showSuccess('Path enhanced successfully!');
            console.log('Path enhancement completed');
        } catch (error) {
            console.error('Error enhancing path:', error);
            this.showError('Failed to enhance path: ' + error.message);
        } finally {
            this.setProcessing(false);
        }
    }

    createEmptyChart() {
        const ctx = document.getElementById('data-chart').getContext('2d');

        this.chart = new Chart(ctx, {
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
                        display: false, // We'll use custom legend
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true,
                            },
                            mode: 'x',
                        },
                    },
                    tooltip: {
                        callbacks: {
                            title: function (context) {
                                const distance = context[0].parsed.x;
                                return `Distance: ${distance.toFixed(2)} km`;
                            },
                            label: function (context) {
                                const field = context.dataset.fieldKey;
                                const fieldInfo = this.getFieldInfo(field);
                                return `${fieldInfo.label}: ${context.parsed.y.toFixed(2)} ${fieldInfo.unit}`;
                            }.bind(this),
                        },
                    },
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Distance (km)',
                        },
                    },
                },
            },
        });
    }

    updateChart() {
        if (!this.chart || !this.currentPath) return;

        const pointCount = this.currentPath.getPointCount();
        if (pointCount === 0) return;

        // Prepare datasets for selected fields with distance-based X coordinates
        const datasets = [];
        const axesConfig = {};

        this.selectedFields.forEach(fieldKey => {
            const fieldInfo = this.getFieldInfo(fieldKey);
            const categoryInfo = this.getCategoryInfo(fieldKey);

            if (!fieldInfo || !categoryInfo) return;

            // Collect data for this field as {x, y} points
            const data = [];
            for (let i = 0; i < pointCount; i++) {
                const point = this.currentPath.getPointData(i);
                const distance = point.dist / 1000; // Convert to km
                let value = point[fieldKey];

                if (isNaN(value)) {
                    value = 0;
                }
                // Convert radians to degrees for better readability
                if (fieldInfo.unit === 'rad') {
                    value = (value * 180) / Math.PI;
                    fieldInfo.unit = '°';
                }

                data.push({ x: distance, y: value });
            }

            // Create dataset
            const dataset = {
                label: fieldInfo.label,
                data: data,
                borderColor: categoryInfo.color,
                backgroundColor: categoryInfo.color + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 4,
                yAxisID: categoryInfo.axis,
                fieldKey: fieldKey,
            };

            datasets.push(dataset);

            // Configure Y-axis for this category
            if (!axesConfig[categoryInfo.axis]) {
                axesConfig[categoryInfo.axis] = {
                    type: 'linear',
                    display: true,
                    position: Object.keys(axesConfig).length % 2 === 0 ? 'left' : 'right',
                    title: {
                        display: true,
                        text: `${categoryInfo.name} (${categoryInfo.unit})`,
                        color: categoryInfo.color,
                    },
                    ticks: {
                        color: categoryInfo.color,
                    },
                    grid: {
                        drawOnChartArea: Object.keys(axesConfig).length === 0,
                        color: categoryInfo.color + '20',
                    },
                };
            }
        });

        // Configure X-axis for distance-based scaling
        const xAxisConfig = {
            type: 'linear',
            display: true,
            title: {
                display: true,
                text: 'Distance (km)',
            },
            ticks: {
                callback: function (value) {
                    return value.toFixed(1) + ' km';
                },
            },
        };

        // Update chart (no labels needed for scatter plot)
        this.chart.data.labels = [];
        this.chart.data.datasets = datasets;
        this.chart.options.scales = {
            x: xAxisConfig,
            ...axesConfig,
        };

        this.chart.update();

        // Update custom legend
        this.updateLegend(datasets);

        // Update chart stats
        this.updateChartStats();
    }

    updateLegend(datasets) {
        const legendContainer = document.getElementById('chart-legend');
        legendContainer.innerHTML = '<h4>📊 Active Data Fields</h4>';

        datasets.forEach(dataset => {
            const item = document.createElement('div');
            item.className = 'legend-item';

            const color = document.createElement('div');
            color.className = 'legend-color';
            color.style.backgroundColor = dataset.borderColor;

            const label = document.createElement('div');
            label.className = 'legend-label';
            label.textContent = dataset.label;

            item.appendChild(color);
            item.appendChild(label);
            legendContainer.appendChild(item);
        });
    }

    updateChartStats() {
        const statsContainer = document.getElementById('chart-stats');

        if (!this.currentPath) {
            statsContainer.innerHTML =
                '<h4>📈 Statistics</h4><p class="text-muted">No data loaded</p>';
            return;
        }

        const pointCount = this.currentPath.getPointCount();
        const distance = this.currentPath.getTotalDistance();
        const selectedCount = this.selectedFields.size;

        statsContainer.innerHTML = `
            <h4>📈 Statistics</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Data Points</div>
                    <div class="stat-value">${pointCount.toLocaleString()}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Distance</div>
                    <div class="stat-value">${(distance / 1000).toFixed(1)} km</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Selected Fields</div>
                    <div class="stat-value">${selectedCount}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Enhanced</div>
                    <div class="stat-value">${this.currentPath.arePointsEnhanced() ? 'Yes' : 'No'}</div>
                </div>
            </div>
        `;
    }

    resetZoom() {
        if (this.chart) {
            this.chart.resetZoom();
        }
    }

    getFieldInfo(fieldKey) {
        for (const category of Object.values(this.fieldConfig)) {
            if (category.fields[fieldKey]) {
                return category.fields[fieldKey];
            }
        }
        return null;
    }

    getCategoryInfo(fieldKey) {
        for (const [categoryKey, category] of Object.entries(this.fieldConfig)) {
            if (category.fields[fieldKey]) {
                return category;
            }
        }
        return null;
    }

    setProcessing(processing, message = '') {
        this.isProcessing = processing;

        const progressBar = document.getElementById('progress-bar');
        const statusText = document.getElementById('status-text');

        if (processing) {
            progressBar.classList.add('active');
            statusText.textContent = message;
        } else {
            progressBar.classList.remove('active');
            statusText.textContent = '';
        }

        this.updateUI();
    }

    updateUI() {
        const hasPath = this.currentPath !== null;
        const hasChart = this.chart !== null;

        // Enable/disable buttons based on state
        document.getElementById('fix-elevation-btn').disabled = this.isProcessing || !hasPath;
        document.getElementById('compute-speeds-btn').disabled = this.isProcessing || !hasPath;
        document.getElementById('enhance-path-btn').disabled = this.isProcessing || !hasPath;
        document.getElementById('reset-zoom-btn').disabled = this.isProcessing || !hasChart;

        // Update file selection controls
        document.getElementById('gpx-select').disabled = this.isProcessing;
        document.getElementById('gpx-upload').disabled = this.isProcessing;
    }

    showError(message) {
        console.error(message);
        const statusText = document.getElementById('status-text');
        statusText.textContent = '❌ ' + message;
        statusText.style.color = '#e74c3c';
        setTimeout(() => {
            statusText.textContent = '';
            statusText.style.color = '';
        }, 5000);
    }

    showSuccess(message) {
        console.log(message);
        const statusText = document.getElementById('status-text');
        statusText.textContent = '✅ ' + message;
        statusText.style.color = '#27ae60';
        setTimeout(() => {
            statusText.textContent = '';
            statusText.style.color = '';
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GPXDemoApp();
});
