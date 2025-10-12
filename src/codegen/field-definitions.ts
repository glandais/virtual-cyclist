/**
 * Field definitions for code generation of Point and Path classes.
 * This is the single source of truth for all field metadata.
 *
 * To add/remove fields:
 * 1. Update this file
 * 2. Run: npm run generate:point
 * 3. Tests will automatically validate the generated code
 */

export interface FieldDefinition {
    /** Enum name (e.g., "LAT") */
    name: string;
    /** Property name in camelCase (e.g., "latitude") */
    prop: string;
    /** JSDoc comment describing the field */
    comment: string;
    /** Optional unit for documentation */
    unit?: string;

    /** Generate getDegrees variant (for angles stored in radians) */
    getDegrees?: boolean;
    /** Special setter handling */
    setSpecial?: 'date'; // setTime accepts Date | number
    /** Special getter handling */
    getSpecial?: 'date'; // getTimeAsDate returns Date
}

export interface FieldCategory {
    /** Category name for documentation */
    name: string;
    /** Fields in this category */
    fields: FieldDefinition[];
}

/**
 * Complete field definitions for Point storage.
 * Order matters - determines array indices in PointField enum.
 */
export const FIELD_DEFINITIONS: FieldCategory[] = [
    {
        name: 'Spatial & Navigation',
        fields: [
            {
                name: 'LATITUDE',
                prop: 'latitude',
                comment: 'Latitude (radians)',
                unit: 'radians',
                getDegrees: true,
            },
            {
                name: 'LONGITUDE',
                prop: 'longitude',
                comment: 'Longitude (radians)',
                unit: 'radians',
                getDegrees: true,
            },
            {
                name: 'ELEVATION',
                prop: 'elevation',
                comment: 'Elevation (meters)',
                unit: 'meters',
            },
            {
                name: 'BEARING',
                prop: 'bearing',
                comment: 'Direction bearing (radians)',
                unit: 'radians',
            },
            {
                name: 'DISTANCE',
                prop: 'distance',
                comment: 'Distance (meters)',
                unit: 'meters',
            },
            {
                name: 'RADIUS',
                prop: 'radius',
                comment: 'Turn radius (meters)',
                unit: 'meters',
            },
            {
                name: 'GRADE',
                prop: 'grade',
                comment: 'Road grade/slope (%)',
                unit: '%',
            },
        ],
    },
    {
        name: 'Temporal',
        fields: [
            {
                name: 'TIME',
                prop: 'time',
                comment: 'Timestamp (ms since epoch)',
                unit: 'ms',
                setSpecial: 'date',
                getSpecial: 'date',
            },
            {
                name: 'ELAPSED',
                prop: 'elapsed',
                comment: 'Elapsed duration (ms)',
                unit: 'ms',
            },
        ],
    },
    {
        name: 'Physics & Power',
        fields: [
            {
                name: 'P_INPUT_POWER',
                prop: 'pInputPower',
                comment: 'GPX input power',
                unit: 'watts',
            },
            // provided
            {
                name: 'P_CYCLIST_PROVIDED_OPTIMAL_POWER',
                prop: 'pCyclistProvidedOptimalPower',
                comment: 'Optimal power',
                unit: 'watts',
            },
            {
                name: 'P_CYCLIST_PROVIDED_POWER_NEEDED',
                prop: 'pCyclistPowerNeeded',
                comment: 'Power needed',
                unit: 'watts',
            },
            {
                name: 'P_CYCLIST_PROVIDED_MUSCULAR',
                prop: 'pCyclistProvidedMuscular',
                comment: 'Raw cyclist power',
                unit: 'watts',
            },
            {
                name: 'P_CYCLIST_PROVIDED_WHEEL',
                prop: 'PCyclistProvidedWheel',
                comment: 'Cyclist power transmitted to ground',
                unit: 'watts',
            },
            // algo
            {
                name: 'AERO_COEF',
                prop: 'aeroCoef',
                comment: 'Aerodynamic coefficient',
            },
            {
                name: 'P_AERO',
                prop: 'pAero',
                comment: 'Aerodynamic power',
                unit: 'watts',
            },
            {
                name: 'P_GRAVITY',
                prop: 'pGravity',
                comment: 'Gravitational power',
                unit: 'watts',
            },
            {
                name: 'P_ROLLING_RESISTANCE',
                prop: 'pRollingResistance',
                comment: 'Rolling resistance power',
                unit: 'watts',
            },
            {
                name: 'P_WHEEL_BEARINGS',
                prop: 'pWheelBearings',
                comment: 'Wheel bearings power',
                unit: 'watts',
            },
            // computed
            {
                name: 'P_COMPUTED_TOTAL_POWER',
                prop: 'pComputedTotalPower',
                comment: 'Power from acceleration',
                unit: 'watts',
            },
            {
                name: 'P_COMPUTED_WHEEL_POWER',
                prop: 'pComputedWheelPower',
                comment: 'Wheel power from acceleration',
                unit: 'watts',
            },
            {
                name: 'POWER',
                prop: 'pComputedPower',
                comment: 'Total power (watts)',
                unit: 'watts',
            },
        ],
    },
    {
        name: 'Speed & Motion',
        fields: [
            {
                name: 'SPEED',
                prop: 'speed',
                comment: 'Current speed (m/s)',
                unit: 'm/s',
            },
            {
                name: 'SPEED_MAX',
                prop: 'speedMax',
                comment: 'Maximum speed (m/s)',
                unit: 'm/s',
            },
            {
                name: 'SPEED_MAX_INCLINE',
                prop: 'speedMaxIncline',
                comment: 'Max speed on incline (m/s)',
                unit: 'm/s',
            },
            {
                name: 'VIRT_SPEED_CURRENT',
                prop: 'virtSpeedCurrent',
                comment: 'Virtual current speed (m/s)',
                unit: 'm/s',
            },
        ],
    },
    {
        name: 'Environmental',
        fields: [
            {
                name: 'TEMPERATURE',
                prop: 'temperature',
                comment: 'Temperature (celsius)',
                unit: 'celsius',
            },
            {
                name: 'WIND_SPEED',
                prop: 'windSpeed',
                comment: 'Wind speed (m/s)',
                unit: 'm/s',
            },
            {
                name: 'WIND_DIRECTION',
                prop: 'windDirection',
                comment: 'Wind direction (radians)',
                unit: 'radians',
            },
            {
                name: 'WIND_BEARING',
                prop: 'windBearing',
                comment: 'Wind bearing (radians)',
                unit: 'radians',
            },
            {
                name: 'WIND_ALPHA',
                prop: 'windAlpha',
                comment: 'Wind angle (radians)',
                unit: 'radians',
            },
        ],
    },
    {
        name: 'Physiological',
        fields: [
            {
                name: 'HEART_RATE',
                prop: 'heartRate',
                comment: 'Heart rate (bpm)',
                unit: 'bpm',
            },
            {
                name: 'CADENCE',
                prop: 'cadence',
                comment: 'Pedaling cadence (rpm)',
                unit: 'rpm',
            },
        ],
    },
];

/**
 * Flattened list of all fields in order.
 */
export const ALL_FIELDS = FIELD_DEFINITIONS.flatMap(cat => cat.fields);

/**
 * Total number of fields.
 */
export const TOTAL_FIELD_COUNT = ALL_FIELDS.length;
