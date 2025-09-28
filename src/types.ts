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
