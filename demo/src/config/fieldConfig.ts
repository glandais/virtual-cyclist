import type { CategoryConfig } from '~/types';

export const fieldConfig: Record<string, CategoryConfig> = {
    elevation: {
        name: '🏔️ Elevation & Terrain',
        axis: 'elevation',
        color: '#8b5a3c',
        unit: 'm',
        fields: {
            ele: { label: 'Elevation', unit: 'm' },
        },
    },
    radius: {
        name: 'Radius',
        axis: 'radius',
        color: '#8b5a3c',
        unit: 'm',
        fields: {
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
        },
    },
    powerPhysics: {
        name: '⚡ Power Physics',
        axis: 'power',
        color: '#e74c3c',
        unit: 'W',
        fields: {
            power: { label: 'Total Power', unit: 'W' },
            pAero: { label: 'Aerodynamic Power', unit: 'W' },
            pGravity: { label: 'Gravity Power', unit: 'W' },
            pRollingResistance: { label: 'Rolling Resistance', unit: 'W' },
            pWheelBearings: { label: 'Wheel bearings Resistance', unit: 'W' },
        },
    },
    powerCyclist: {
        name: '⚡ Power Cyclist',
        axis: 'power',
        color: '#e74c3c',
        unit: 'W',
        fields: {
            pCyclistRaw: { label: 'Cyclist Power (Raw)', unit: 'W' },
            pCyclistWheel: { label: 'Cyclist Power (Wheel)', unit: 'W' },
            pCyclistOptimalPower: { label: 'Cyclist Optimal Power', unit: 'W' },
            pPowerFromAcc: { label: 'Power from acceleration', unit: 'W' },
            pPowerWheelFromAcc: { label: 'Wheel power from acceleration', unit: 'W' },
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
