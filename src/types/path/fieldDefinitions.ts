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
    shortDescription: string;
    longDescription: string;
    /** Optional unit for documentation */
    unit: string;

    /** Generate getDegrees variant (for angles stored in radians) */
    getDegrees?: boolean;
    /** Special setter handling */
    setSpecial?: 'date'; // setTime accepts Date | number
    /** Special getter handling */
    getSpecial?: 'date'; // getTimeAsDate returns Date

    notSelectable?: boolean;
}

export interface FieldCategory {
    id: string;
    /** Category name for documentation */
    name: string;
    notSelectable?: boolean;
    /** Fields in this category */
    fields: FieldDefinition[];
}

/**
 * Complete field definitions for Point storage.
 * Order matters - determines array indices in PointField enum.
 */
export const FIELD_DEFINITIONS: FieldCategory[] = [
    {
        id: 'coordinates',
        name: 'Coordinates',
        fields: [
            {
                name: 'LATITUDE',
                prop: 'latitude',
                shortDescription: 'Latitude (radians)',
                longDescription: 'Latitude (radians)',
                unit: 'radians',
                getDegrees: true,
                notSelectable: true,
            },
            {
                name: 'LONGITUDE',
                prop: 'longitude',
                shortDescription: 'Longitude (radians)',
                longDescription: '',
                unit: 'radians',
                getDegrees: true,
                notSelectable: true,
            },
            {
                name: 'DISTANCE',
                prop: 'distance',
                shortDescription: 'Distance (meters)',
                longDescription: '',
                unit: 'meters',
            },
            {
                name: 'DX',
                prop: 'dx',
                shortDescription: 'dx (meters)',
                longDescription: '',
                unit: 'meters',
            },
        ],
    },
    {
        id: 'temporal',
        name: 'Temporal',
        fields: [
            {
                name: 'TIME',
                prop: 'time',
                shortDescription: 'Timestamp (ms since epoch)',
                longDescription: '',
                unit: 'ms',
                setSpecial: 'date',
                getSpecial: 'date',
                notSelectable: true,
            },
            {
                name: 'ELAPSED',
                prop: 'elapsed',
                shortDescription: 'Elapsed duration (ms)',
                longDescription: '',
                unit: 'ms',
            },
            {
                name: 'DT',
                prop: 'dt',
                shortDescription: 'dt (ms)',
                longDescription: '',
                unit: 'ms',
            },
        ],
    },
    {
        id: 'angles',
        name: 'Angles',
        fields: [
            {
                name: 'BEARING',
                prop: 'bearing',
                shortDescription: 'Direction bearing (radians)',
                longDescription: '',
                unit: 'radians',
            },
        ],
    },
    {
        id: 'elevation',
        name: '🏔️ Elevation',
        fields: [
            {
                name: 'ELEVATION',
                prop: 'elevation',
                shortDescription: 'Elevation (meters)',
                longDescription: '',
                unit: 'meters',
            },
        ],
    },
    {
        id: 'grade',
        name: '📐 Grade',
        fields: [
            {
                name: 'GRADE',
                prop: 'grade',
                shortDescription: 'Road grade/slope (%)',
                longDescription: '',
                unit: '%',
            },
        ],
    },
    {
        id: 'radius',
        name: 'Radius',
        fields: [
            {
                name: 'RADIUS',
                prop: 'radius',
                shortDescription: 'Turn radius (meters)',
                longDescription: '',
                unit: 'meters',
            },
        ],
    },
    {
        id: 'aero_coef',
        name: 'Aero coef',
        fields: [
            {
                name: 'AERO_COEF',
                prop: 'aeroCoef',
                shortDescription: 'Aerodynamic coefficient',
                longDescription: '',
                unit: 'aero',
            },
        ],
    },
    {
        id: 'cyclist_wind',
        name: 'Cyclist wind',
        fields: [
            {
                name: 'WIND_BEARING',
                prop: 'windBearing',
                shortDescription: 'Wind bearing (radians)',
                longDescription: '',
                unit: 'radians',
            },
            {
                name: 'WIND_ALPHA',
                prop: 'windAlpha',
                shortDescription: 'Wind angle (radians)',
                longDescription: '',
                unit: 'radians',
            },
        ],
    },
    {
        id: 'power_physics',
        name: '⚡ Power Physics',
        fields: [
            {
                name: 'P_AERO',
                prop: 'pAero',
                shortDescription: 'Aerodynamic power',
                longDescription: '',
                unit: 'watts',
            },
            {
                name: 'P_GRAVITY',
                prop: 'pGravity',
                shortDescription: 'Gravitational power',
                longDescription: '',
                unit: 'watts',
            },
            {
                name: 'P_ROLLING_RESISTANCE',
                prop: 'pRollingResistance',
                shortDescription: 'Rolling resistance power',
                longDescription: '',
                unit: 'watts',
            },
            {
                name: 'P_WHEEL_BEARINGS',
                prop: 'pWheelBearings',
                shortDescription: 'Wheel bearings power',
                longDescription: '',
                unit: 'watts',
            },
        ],
    },
    {
        id: 'power_cyclist',
        name: '⚡ Power Cyclist',
        fields: [
            {
                name: 'P_INPUT_POWER',
                prop: 'pInputPower',
                shortDescription: 'GPX input power',
                longDescription: '',
                unit: 'watts',
            },
            // provided
            {
                name: 'P_CYCLIST_PROVIDED_OPTIMAL_POWER',
                prop: 'pCyclistProvidedOptimalPower',
                shortDescription: 'Optimal power',
                longDescription: '',
                unit: 'watts',
            },
            {
                name: 'P_CYCLIST_PROVIDED_OPTIMAL_POWER_HARMONICS',
                prop: 'pCyclistProvidedOptimalPowerWithHarmonics',
                shortDescription: 'Optimal power with harmonics',
                longDescription: '',
                unit: 'watts',
            },
            {
                name: 'P_CYCLIST_PROVIDED_POWER_NEEDED',
                prop: 'pCyclistPowerNeeded',
                shortDescription: 'Power needed',
                longDescription: '',
                unit: 'watts',
            },
            {
                name: 'P_CYCLIST_PROVIDED_MUSCULAR',
                prop: 'pCyclistProvidedMuscular',
                shortDescription: 'Raw cyclist power',
                longDescription: '',
                unit: 'watts',
            },
            {
                name: 'P_CYCLIST_PROVIDED_WHEEL',
                prop: 'PCyclistProvidedWheel',
                shortDescription: 'Cyclist power transmitted to ground',
                longDescription: '',
                unit: 'watts',
            },
        ],
    },
    {
        id: 'power_post',
        name: '⚡ Power Post processed',
        fields: [
            {
                name: 'P_COMPUTED_TOTAL_POWER',
                prop: 'pComputedTotalPower',
                shortDescription: 'Power from kinetic energy change',
                longDescription: '',
                unit: 'watts',
            },
            {
                name: 'P_COMPUTED_WHEEL_POWER',
                prop: 'pComputedWheelPower',
                shortDescription: 'Wheel power from kinetic energy change',
                longDescription: '',
                unit: 'watts',
            },
            {
                name: 'POWER',
                prop: 'pComputedPower',
                shortDescription: 'Total power (watts)',
                longDescription: '',
                unit: 'watts',
            },
        ],
    },
    {
        id: 'speed',
        name: 'Speed & Motion',
        fields: [
            {
                name: 'SPEED',
                prop: 'speed',
                shortDescription: 'Current speed (m/s)',
                longDescription: '',
                unit: 'm/s',
            },
            {
                name: 'SPEED_MAX',
                prop: 'speedMax',
                shortDescription: 'Maximum speed (m/s)',
                longDescription: '',
                unit: 'm/s',
            },
            {
                name: 'SPEED_MAX_INCLINE',
                prop: 'speedMaxIncline',
                shortDescription: 'Max speed on incline (m/s)',
                longDescription: '',
                unit: 'm/s',
            },
            {
                name: 'VIRT_SPEED_CURRENT',
                prop: 'virtSpeedCurrent',
                shortDescription: 'Virtual current speed (m/s)',
                longDescription: '',
                unit: 'm/s',
            },
        ],
    },
    {
        id: 'environmental',
        name: 'Environmental',
        fields: [
            {
                name: 'TEMPERATURE',
                prop: 'temperature',
                shortDescription: 'Temperature (celsius)',
                longDescription: '',
                unit: 'celsius',
            },
            {
                name: 'WIND_SPEED',
                prop: 'windSpeed',
                shortDescription: 'Wind speed (m/s)',
                longDescription: '',
                unit: 'm/s',
            },
            {
                name: 'WIND_DIRECTION',
                prop: 'windDirection',
                shortDescription: 'Wind direction (radians)',
                longDescription: '',
                unit: 'radians',
            },
        ],
    },
    {
        id: 'physiological',
        name: 'Physiological',
        fields: [
            {
                name: 'HEART_RATE',
                prop: 'heartRate',
                shortDescription: 'Heart rate (bpm)',
                longDescription: '',
                unit: 'bpm',
            },
            {
                name: 'CADENCE',
                prop: 'cadence',
                shortDescription: 'Pedaling cadence (rpm)',
                longDescription: '',
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
