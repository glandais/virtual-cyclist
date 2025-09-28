/**
 * Enum defining the index of each field in the chunked array storage.
 * Based on PropertyKeys.java from gpx2web project.
 * Each point has exactly 33 numeric values stored contiguously.
 */
export enum PointField {
    // Spatial & Navigation (6 properties)
    LAT = 0, // Latitude (degrees)
    LON = 1, // Longitude (degrees)
    ELE = 2, // Elevation (meters)
    BEARING = 3, // Direction bearing (degrees)
    DIST = 4, // Distance (meters)
    RADIUS = 5, // Turn radius (meters)

    // Temporal (2 properties)
    TIME = 6, // Timestamp (ms since epoch)
    ELAPSED = 7, // Elapsed duration (ms)

    // Physics & Power (14 properties)
    POWER = 8, // Total power (watts)
    P_CYCLIST_RAW = 9, // Raw cyclist power
    P_CYCLIST_WHEEL = 10, // Cyclist wheel power
    P_CYCLIST_OPTIMAL_POWER = 11, // Optimal power
    P_CYCLIST_CURRENT_SPEED = 12, // Current speed power
    P_CYCLIST_OPTIMAL_SPEED = 13, // Optimal speed power
    P_AERO = 14, // Aerodynamic power
    P_GRAVITY = 15, // Gravitational power
    P_ROLLING_RESISTANCE = 16, // Rolling resistance power
    P_WHEEL_BEARINGS = 17, // Wheel bearings power
    P_POWER_FROM_ACC = 18, // Power from acceleration
    P_POWER_WHEEL_FROM_ACC = 19, // Wheel power from acceleration
    AERO_COEF = 20, // Aerodynamic coefficient
    GRADE = 21, // Road grade/slope (%)

    // Speed & Motion (4 properties)
    SPEED = 22, // Current speed (m/s)
    SPEED_MAX = 23, // Maximum speed (m/s)
    SPEED_MAX_INCLINE = 24, // Max speed on incline (m/s)
    VIRT_SPEED_CURRENT = 25, // Virtual current speed (m/s)

    // Environmental (5 properties)
    TEMPERATURE = 26, // Temperature (celsius)
    WIND_SPEED = 27, // Wind speed (m/s)
    WIND_DIRECTION = 28, // Wind direction (degrees)
    WIND_BEARING = 29, // Wind bearing (degrees)
    WIND_ALPHA = 30, // Wind angle (degrees)

    // Physiological (2 properties)
    HEART_RATE = 31, // Heart rate (bpm)
    CADENCE = 32, // Pedaling cadence (rpm)
}

/**
 * Total number of fields per point in the chunked storage.
 */
export const FIELDS_PER_POINT = 33;

/**
 * Interface representing a complete point with all 33 properties.
 * All values are stored as numbers with appropriate unit conversions.
 */
export interface Point {
    // Spatial & Navigation
    readonly lat: number; // Latitude (degrees)
    readonly lon: number; // Longitude (degrees)
    readonly ele: number; // Elevation (meters)
    readonly bearing: number; // Direction bearing (degrees)
    readonly dist: number; // Distance (meters)
    readonly radius: number; // Turn radius (meters)

    // Temporal
    readonly time: number; // Timestamp (ms since epoch)
    readonly elapsed: number; // Elapsed duration (ms)

    // Physics & Power
    readonly power: number; // Total power (watts)
    readonly pCyclistRaw: number; // Raw cyclist power
    readonly pCyclistWheel: number; // Cyclist wheel power
    readonly pCyclistOptimalPower: number; // Optimal power
    readonly pCyclistCurrentSpeed: number; // Current speed power
    readonly pCyclistOptimalSpeed: number; // Optimal speed power
    readonly pAero: number; // Aerodynamic power
    readonly pGravity: number; // Gravitational power
    readonly pRollingResistance: number; // Rolling resistance power
    readonly pWheelBearings: number; // Wheel bearings power
    readonly pPowerFromAcc: number; // Power from acceleration
    readonly pPowerWheelFromAcc: number; // Wheel power from acceleration
    readonly aeroCoef: number; // Aerodynamic coefficient
    readonly grade: number; // Road grade/slope (%)

    // Speed & Motion
    readonly speed: number; // Current speed (m/s)
    readonly speedMax: number; // Maximum speed (m/s)
    readonly speedMaxIncline: number; // Max speed on incline (m/s)
    readonly virtSpeedCurrent: number; // Virtual current speed (m/s)

    // Environmental
    readonly temperature: number; // Temperature (celsius)
    readonly windSpeed: number; // Wind speed (m/s)
    readonly windDirection: number; // Wind direction (degrees)
    readonly windBearing: number; // Wind bearing (degrees)
    readonly windAlpha: number; // Wind angle (degrees)

    // Physiological
    readonly heartRate: number; // Heart rate (bpm)
    readonly cadence: number; // Pedaling cadence (rpm)
}

export const EMPTY_POINT: Point = {
    // Spatial & Navigation
    lat: 0,
    lon: 0,
    ele: 0,
    bearing: 0,
    dist: 0,
    radius: 0,

    // Temporal
    time: 0,
    elapsed: 0,

    // Physics & Power
    power: 0,
    pCyclistRaw: 0,
    pCyclistWheel: 0,
    pCyclistOptimalPower: 0,
    pCyclistCurrentSpeed: 0,
    pCyclistOptimalSpeed: 0,
    pAero: 0,
    pGravity: 0,
    pRollingResistance: 0,
    pWheelBearings: 0,
    pPowerFromAcc: 0,
    pPowerWheelFromAcc: 0,
    aeroCoef: 0,
    grade: 0,

    // Speed & Motion
    speed: 0,
    speedMax: 0,
    speedMaxIncline: 0,
    virtSpeedCurrent: 0,

    // Environmental
    temperature: 0,
    windSpeed: 0,
    windDirection: 0,
    windBearing: 0,
    windAlpha: 0,

    // Physiological
    heartRate: 0,
    cadence: 0,
};

/**
 * Cyclist configuration interface for virtual cycling simulations.
 * Contains physical and performance parameters for cyclist modeling.
 */
export interface Cyclist {
    /** Total mass of cyclist + bike system (kg) */
    readonly mKg: number;

    /** Sustained power output capability (watts) */
    readonly power: number;

    /** Whether to use harmonic calculations (advanced physics option) */
    readonly harmonics: boolean;

    /** Maximum braking deceleration (g-force units) */
    readonly maxBrakeG: number;

    /** Aerodynamic drag coefficient (dimensionless) */
    readonly cd: number;

    /** Frontal area for aerodynamic calculations (m²) */
    readonly a: number;

    /** Maximum lean angle for cornering (degrees) */
    readonly maxAngleDeg: number;

    /** Maximum speed capability (km/h) */
    readonly maxSpeedKmH: number;
}

/**
 * Bicycle configuration interface for virtual cycling simulations.
 * Contains mechanical and physical parameters for bicycle modeling.
 */
export interface Bike {
    /** Rolling resistance coefficient (dimensionless) */
    readonly crr: number;

    /** Front wheel rotational inertia (kg⋅m²) */
    readonly inertiaFront: number;

    /** Rear wheel rotational inertia (kg⋅m²) */
    readonly inertiaRear: number;

    /** Wheel radius (meters) */
    readonly wheelRadius: number;

    /** Drivetrain efficiency (0-1, dimensionless) */
    readonly efficiency: number;
}
