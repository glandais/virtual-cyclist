import { FIELDS_PER_POINT } from '@/types';
import type { CategoryConfig } from '~/types';

const dh = 360 / FIELDS_PER_POINT;
let i = 0;

function getColor(j: number) {
    const h = j * dh;
    return `hsl(${h} 50% 50%)`;
}

export const fieldConfig: Record<string, CategoryConfig> = {
    elevation: {
        name: '🏔️ Elevation & Terrain',
        axis: 'elevation',
        unit: 'm',
        fields: {
            elevation: { label: 'Elevation', unit: 'm', color: getColor(i++) },
        },
    },
    radius: {
        name: 'Radius',
        axis: 'radius',
        unit: 'm',
        fields: {
            radius: { label: 'Turn Radius', unit: 'm', color: getColor(i++) },
        },
    },
    grade: {
        name: '📐 Grade & Slope',
        axis: 'grade',
        unit: '%',
        fields: {
            grade: { label: 'Grade', unit: '%', color: getColor(i++) },
        },
    },
    speed: {
        name: '🏃‍♂️ Speed & Motion',
        axis: 'speed',
        unit: 'm/s',
        fields: {
            speed: { label: 'Current Speed', unit: 'm/s', color: getColor(i++) },
            speedMax: { label: 'Max Speed', unit: 'm/s', color: getColor(i++) },
            speedMaxIncline: { label: 'Max Speed (Incline)', unit: 'm/s', color: getColor(i++) },
        },
    },
    powerPhysics: {
        name: '⚡ Power Physics',
        axis: 'power',
        unit: 'W',
        fields: {
            pComputedPower: { label: 'Cyclist Power', unit: 'W', color: getColor(i++) },
            pAero: { label: 'Aerodynamic Power', unit: 'W', color: getColor(i++) },
            pGravity: { label: 'Gravity Power', unit: 'W', color: getColor(i++) },
            pRollingResistance: { label: 'Rolling Resistance', unit: 'W', color: getColor(i++) },
            pWheelBearings: { label: 'Wheel bearings Resistance', unit: 'W', color: getColor(i++) },
        },
    },
    powerCyclist: {
        name: '⚡ Power Cyclist',
        axis: 'power',
        unit: 'W',
        fields: {
            pCyclistProvidedMuscular: {
                label: 'Cyclist Power (Raw)',
                unit: 'W',
                color: getColor(i++),
            },
            PCyclistProvidedWheel: {
                label: 'Cyclist Power (Wheel)',
                unit: 'W',
                color: getColor(i++),
            },
            pCyclistProvidedOptimalPower: {
                label: 'Cyclist Optimal Power',
                unit: 'W',
                color: getColor(i++),
            },
            pCyclistPowerNeeded: { label: 'Cyclist Power Needed', unit: 'W', color: getColor(i++) },
            pComputedTotalPower: {
                label: 'Power from acceleration',
                unit: 'W',
                color: getColor(i++),
            },
            pComputedWheelPower: {
                label: 'Wheel power from acceleration',
                unit: 'W',
                color: getColor(i++),
            },
        },
    },
    environmental: {
        name: '🌡️ Environmental',
        axis: 'environmental',
        unit: 'mixed',
        fields: {
            temperature: { label: 'Temperature', unit: '°C', color: getColor(i++) },
            windSpeed: { label: 'Wind Speed', unit: 'm/s', color: getColor(i++) },
            windDirection: { label: 'Wind Direction', unit: 'rad', color: getColor(i++) },
            windBearing: { label: 'Wind Bearing', unit: 'rad', color: getColor(i++) },
        },
    },
    physiological: {
        name: '❤️ Physiological',
        axis: 'physiological',
        unit: 'mixed',
        fields: {
            heartRate: { label: 'Heart Rate', unit: 'bpm', color: getColor(i++) },
            cadence: { label: 'Cadence', unit: 'rpm', color: getColor(i++) },
        },
    },
};
