/**
 * High-performance chunked storage for GPS path data with 33 properties per point.
 * Uses Float64Array chunks for memory efficiency and dynamic growth.
 *
 * Memory layout: [chunk0: point0_field0...point0_field32, point1_field0...point1_field32, ...]
 *
 * Based on PropertyKeys.java from gpx2web project, storing all simulation data
 * including spatial coordinates, physics calculations, and environmental conditions.
 */
export declare abstract class AbstractPath {
    name: string;
    readonly CHUNK_SIZE = 1000;
    readonly INITIAL_CHUNKS = 2;
    chunks: Float64Array[];
    protected pointCount: number;
    constructor(name: string);
    /**
     * Gets the total number of points stored.
     */
    get length(): number;
    /**
     * Gets the total number of points stored.
     */
    getPointCount(): number;
    /**
     * Gets the current capacity (total points that can be stored without reallocation).
     */
    get capacity(): number;
    /**
     * Gets memory usage statistics.
     */
    getMemoryInfo(): {
        chunksCount: number;
        pointsCapacity: number;
        usedPoints: number;
        memoryMB: number;
    };
    /**
     * Ensures there is capacity for at least the specified number of points.
     */
    protected ensureCapacity(minCapacity: number): void;
    /**
     * Calculates the chunk index and field offset for a given point and field.
     */
    private getOffset;
    /**
     * Gets a field value for a specific point.
     */
    getField(pointIndex: number, field: PointField): number;
    /**
     * Sets a field value for a specific point.
     */
    setField(pointIndex: number, field: PointField, value: number): void;
    /**
     * Clears all data and resets to initial state.
     */
    clear(): void;
}

export declare const aeroPowerProvider: PowerProvider;

/**
 * Interface for aerodynamic coefficient providers in virtual cycling simulations.
 *
 * AeroProvider implementations calculate the aerodynamic coefficient used in
 * drag force calculations. Different implementations can provide:
 * - Constant coefficient (standard conditions)
 * - Variable coefficient (position changes, drafting effects)
 * - Dynamic coefficient (altitude-based air density, temperature effects)
 *
 * The aerodynamic coefficient combines:
 * - Cd: Drag coefficient (shape-dependent, dimensionless)
 * - A: Frontal area (m²)
 * - ρ: Air density (kg/m³)
 *
 * Resulting in: aeroCoef = (Cd × A × ρ) / 2
 *
 * This coefficient is used in the drag force formula:
 * F_drag = aeroCoef × v²
 * Where v is the effective air velocity (cyclist speed + wind effects)
 */
export declare interface AeroProvider {
    /**
     * Gets the aerodynamic coefficient at a specific location on the course.
     *
     * @param course The course configuration with cyclist and environmental parameters
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @returns Aerodynamic coefficient (kg/m, derived from Cd × A × ρ / 2)
     */
    getAeroCoef(course: Course, path: Path, pointIndex: number): number;
}

export declare const aeroProviderConstant: AeroProvider;

/**
 * Flattened list of all fields in order.
 */
export declare const ALL_FIELDS: FieldDefinition[];

/**
 * Bike class implementing the Bike interface with utility methods.
 * Represents a bicycle with mechanical and physical characteristics
 * for virtual cycling simulations.
 *
 * Based on the Java Bike class from gpx2web project.
 */
export declare class Bike {
    readonly crr: number;
    readonly inertiaFront: number;
    readonly inertiaRear: number;
    readonly wheelRadius: number;
    readonly efficiency: number;
    /**
     * Create a new Bike instance.
     *
     * @param crr Rolling resistance coefficient (dimensionless)
     * @param inertiaFront Front wheel rotational inertia (kg⋅m²)
     * @param inertiaRear Rear wheel rotational inertia (kg⋅m²)
     * @param wheelRadius Wheel radius (meters)
     * @param efficiency Drivetrain efficiency (0-1, dimensionless)
     */
    constructor(crr: number, inertiaFront: number, inertiaRear: number, wheelRadius: number, efficiency: number);
    static getBike(properties: BikeProperties): Bike;
    /**
     * Create a bike with default parameters validated from cycling research.
     *
     * Default configuration represents:
     * - Modern road bike with high-performance tires (Crr = 0.004)
     * - Lightweight racing wheels with typical rotational inertia
     * - Standard 700c wheel size (radius = 0.7m)
     * - High-efficiency modern drivetrain (97.6% efficiency)
     *
     * @returns Bike instance with scientifically validated defaults
     */
    static getDefault(): Bike;
    /**
     * Get total rotational inertia of both wheels.
     * Used in physics calculations for acceleration resistance
     * due to wheel rotation.
     *
     * Formula: I_total = I_front + I_rear
     *
     * @returns Total rotational inertia (kg⋅m²)
     */
    getTotalInertia(): number;
    /**
     * Get wheel diameter.
     * Useful for gear ratio calculations and general specifications.
     *
     * Formula: diameter = 2 × radius
     *
     * @returns Wheel diameter (meters)
     */
    getWheelDiameter(): number;
    /**
     * Get wheel circumference.
     * Used in speed and distance calculations from wheel rotations.
     *
     * Formula: circumference = 2π × radius
     *
     * @returns Wheel circumference (meters)
     */
    getWheelCircumference(): number;
    /**
     * Calculate equivalent mass from rotational inertia.
     * Represents the additional linear mass equivalent of rotating wheels
     * for simplified physics calculations.
     *
     * Formula: m_equiv = I_total / r²
     * Where I_total is total rotational inertia and r is wheel radius
     *
     * @returns Equivalent mass from wheel rotation (kg)
     */
    getEquivalentMass(): number;
    /**
     * Calculate power loss due to drivetrain inefficiency.
     * Determines how much input power is lost in the drivetrain.
     *
     * Formula: loss_factor = 1 - efficiency
     *
     * @returns Power loss factor (0-1, dimensionless)
     */
    getPowerLossFactor(): number;
    /**
     * Calculate effective power delivered to the wheel.
     * Accounts for drivetrain losses in power transmission.
     *
     * Formula: P_wheel = P_input × efficiency
     *
     * @param inputPower Input power from cyclist (watts)
     * @returns Effective power at wheel (watts)
     */
    getWheelPower(inputPower: number): number;
    /**
     * Calculate rolling resistance force at given speed.
     * Force opposing motion due to tire deformation and road interaction.
     *
     * Formula: F_rolling = crr × N
     * Where N is the normal force (weight × cos(grade))
     * For level ground: F_rolling = crr × mass × g
     *
     * @param normalForce Normal force on tires (Newtons)
     * @returns Rolling resistance force (Newtons)
     */
    getRollingResistanceForce(normalForce: number): number;
    /**
     * Get a string representation of the bike configuration.
     *
     * @returns Human-readable string describing the bike
     */
    toString(): string;
}

export declare interface BikeProperties {
    crr: number;
    inertiaFront: number;
    inertiaRear: number;
    wheelRadius: number;
    efficiency: number;
}

/**
 * Earth's circumference at equator (meters)
 * Calculated from WGS-84 semi-major axis
 */
export declare const CIRC: number;

export declare interface Course {
    readonly path: Path;
    readonly bike: Bike;
    readonly cyclist: Cyclist;
}

export declare interface CoursePhysics extends Course {
    /** Air density in kg/m³ (default: 1.225 at sea level, 15°C) */
    readonly rhoProvider: RhoProvider;
    /** Aerodynamic coefficient provider */
    readonly aeroProvider: AeroProvider;
    /** Wind conditions provider */
    readonly windProvider: WindProvider;
    /** Cyclist power output provider */
    readonly cyclistPowerProvider: CyclistPowerProvider;
}

/**
 * Create a logger instance with a specific namespace
 * @param namespace - The namespace for this logger (e.g., 'Cache', 'TileFetcher')
 * @returns A new Logger instance with the specified namespace
 * @example
 * const logger = createLogger('MyModule');
 * logger.debug('Module initialized');
 */
export declare const createLogger: (namespace: string) => Logger;

/**
 * Cyclist class implementing the Cyclist interface with utility methods.
 * Represents a cyclist with physical and performance characteristics
 * for virtual cycling simulations.
 *
 * Based on the Java Cyclist class from gpx2web project.
 */
export declare class Cyclist {
    readonly mKg: number;
    readonly maxBrakeG: number;
    readonly cd: number;
    readonly a: number;
    readonly maxAngleDeg: number;
    readonly maxSpeedKmH: number;
    /**
     * Create a new Cyclist instance.
     *
     * @param mKg Total mass of cyclist + bike system (kg)
     * @param maxBrakeG Maximum braking deceleration (g-force units)
     * @param cd Aerodynamic drag coefficient (dimensionless)
     * @param a Frontal area for aerodynamic calculations (m²)
     * @param maxAngleDeg Maximum lean angle for cornering (degrees)
     * @param maxSpeedKmH Maximum speed capability (km/h)
     */
    constructor(mKg: number, maxBrakeG: number, cd: number, a: number, maxAngleDeg: number, maxSpeedKmH: number);
    static getCyclist(properties: CyclistProperties): Cyclist;
    /**
     * Create a cyclist with default parameters validated from cycling research.
     *
     * Default configuration represents:
     * - 80kg total system mass (recreational cyclist + road bike)
     * - 280W sustainable power output (~3.5 W/kg FTP)
     * - Conservative braking and handling limits for safety
     * - Typical aerodynamic parameters for recreational cycling position
     *
     * @returns Cyclist instance with scientifically validated defaults
     */
    static getDefault(): Cyclist;
    /**
     * Get the tangent of the maximum lean angle.
     * Used in cornering physics calculations for determining maximum
     * lateral acceleration without losing traction.
     *
     * Formula: tan(θ) where θ is the maximum lean angle
     *
     * @returns Tangent of maximum lean angle (dimensionless)
     */
    getTanMaxAngle(): number;
    /**
     * Get the maximum lean angle in radians.
     * Provides direct radian access for physics calculations.
     *
     * @returns Maximum lean angle in radians
     */
    getMaxAngleRad(): number;
    /**
     * Get maximum braking deceleration in SI units.
     * Converts from g-force units to meters per second squared
     * for use in physics calculations.
     *
     * Formula: a_max = maxBrakeG × g
     * Where g = 9.8 m/s² (standard gravitational acceleration)
     *
     * @returns Maximum braking deceleration (m/s²)
     */
    getMaxBrakeMS2(): number;
    /**
     * Get maximum speed in SI units.
     * Converts from km/h to meters per second for physics calculations.
     *
     * Formula: v_ms = v_kmh / 3.6
     *
     * @returns Maximum speed (m/s)
     */
    getMaxSpeedMs(): number;
    /**
     * Calculate aerodynamic drag area (CdA).
     * Combined aerodynamic parameter used in drag force calculations.
     *
     * Formula: CdA = cd × a
     *
     * @returns Aerodynamic drag area (m²)
     */
    getAerodynamicDragArea(): number;
    /**
     * Get a string representation of the cyclist configuration.
     *
     * @returns Human-readable string describing the cyclist
     */
    toString(): string;
}

/**
 * Interface for cyclist power output providers in virtual cycling simulations.
 *
 * CyclistPowerProvider implementations determine how much power the virtual
 * cyclist generates at each point along the route. Different implementations
 * support various power models:
 *
 * - **Constant Power**: Fixed wattage output (e.g., 250W sustained)
 * - **Power with Tiring**: Degrading power over time simulating fatigue
 * - **Power from Data**: Use existing power measurements from GPX data
 * - **Variable Power**: Training plans, intervals, or terrain-responsive power
 *
 * The power value returned represents the cyclist's muscular power output
 * before drivetrain losses. The MuscularPowerProvider applies efficiency
 * to convert this to wheel power.
 *
 * @see MuscularPowerProvider
 * @see CyclistPowerProviderBase
 */
export declare interface CyclistPowerProvider extends PowerProvider {
}

/**
 * Abstract base class for cyclist power providers with advanced power modeling.
 *
 * This base class provides:
 * - **Harmonic power variations**: Simulates natural power output fluctuations
 * - **Speed-based power adjustment**: Adapts power based on current vs optimal speed
 * - **Tolerance-based control**: ±5% speed tolerance around optimal
 * - **Power scaling**: Up to 3x power when too slow, reduced power when too fast
 *
 * Subclasses must implement `getOptimalPower()` to define the baseline power
 * output strategy (constant, variable, data-driven, etc.).
 *
 * ## Harmonic Variations
 *
 * When harmonics are enabled (`course.cyclist.harmonics = true`), the power
 * output includes sinusoidal variations:
 *
 * ```
 * P'(t) = P + Σ(amp_i × P × cos(freq_i × t - phase_i))
 * ```
 *
 * This creates realistic power fluctuations mimicking:
 * - Pedal stroke asymmetries
 * - Breathing patterns
 * - Micro-adjustments in cycling position
 * - Natural physiological rhythms
 *
 * ## Speed-Based Power Adjustment
 *
 * The actual power output is adjusted based on how current speed compares
 * to the optimal speed for the given power and terrain:
 *
 * - **Within tolerance (±5%)**: Full optimal power
 * - **Too slow (< 95% optimal)**: Linear increase up to 3x power
 * - **Too fast (> 105% optimal)**: Linear decrease down to 0
 *
 * This models:
 * - Increased effort when speed drops (climbing, headwind)
 * - Reduced effort when speed exceeds target (coasting, tailwind)
 *
 * @see CyclistPowerProvider
 */
export declare abstract class CyclistPowerProviderBase implements CyclistPowerProvider {
    readonly useHarmonics: boolean;
    private static readonly TOLERANCE;
    private static readonly MAX_MULTIPLIER;
    private readonly harmonics;
    /**
     * Constructs the base provider with randomly generated harmonics.
     *
     * Generates 20 harmonic components with:
     * - Frequency: 1.0 to 10.0 rad/s
     * - Phase: 0 to π radians
     * - Amplitude: 0 to 0.01 (1% max variation)
     *
     * Uses crypto.getRandomValues() for secure random generation
     * (compatible with both browser and Node.js environments).
     */
    constructor(useHarmonics: boolean);
    /**
     * Abstract method to get the optimal power for current conditions.
     *
     * Subclasses implement this to define their power strategy:
     * - PowerProviderConstant: Returns fixed power from cyclist config
     * - PowerProviderConstantWithTiring: Applies fatigue factor
     * - PowerProviderFromData: Returns power from point data
     *
     * @param course Course configuration
     * @param path Path containing point data
     * @param pointIndex Index of current point
     * @returns Optimal power output in watts
     */
    protected abstract getOptimalPower(course: CoursePhysics, path: Path, pointIndex: number): number;
    /**
     * Calculates the cyclist's power output with harmonics and speed adjustments.
     *
     * Process:
     * 1. Get optimal power from subclass
     * 2. Apply harmonic variations (if enabled)
     * 3. Calculate optimal speed for this power
     * 4. Adjust power based on current vs optimal speed
     *
     * @param course Course configuration
     * @param path Path containing point data
     * @param pointIndex Index of current point
     * @returns Adjusted cyclist power in watts
     */
    getPowerW(course: CoursePhysics, path: Path, pointIndex: number): number;
    protected getRealOptimalPower(course: CoursePhysics, path: Path, pointIndex: number, optimalPower: number): number;
}

export declare interface CyclistProperties {
    mKg: number;
    maxBrakeG: number;
    cd: number;
    a: number;
    maxAngleDeg: number;
    maxSpeedKmH: number;
}

/**
 * Air density at sea level standard conditions (kg/m³)
 * Source: ISO International Standard Atmosphere (ISA), 15°C, 1 atm
 * Reference: Used in cycling aerodynamics research (Martin et al.)
 */
export declare const DEFAULT_AIR_DENSITY = 1.225;

/**
 * Rolling resistance coefficient for road bike tires (dimensionless)
 * Source: bicyclerollingresistance.com research, typical range 0.003-0.005
 * Reference: Continental GP5000 and similar high-performance road tires
 */
export declare const DEFAULT_CRR = 0.004;

/**
 * Total system mass: cyclist + bike (kg)
 * Source: Typical recreational/competitive cyclist (70kg) + road bike (10kg)
 * Representative of intermediate to advanced cycling enthusiasts
 */
export declare const DEFAULT_CYCLIST_MASS_KG = 80;

/**
 * Sustained power output (watts)
 * Source: ~3.5 W/kg FTP for 80kg cyclist (intermediate/advanced recreational level)
 * Reference: Training and Racing with a Power Meter (Allen & Coggan)
 */
export declare const DEFAULT_CYCLIST_POWER_W = 280;

/**
 * Aerodynamic drag coefficient (dimensionless)
 * Source: Academic cycling aerodynamics research, typical range 0.6-0.8
 * Reference: "Aerodynamic drag in cycling: Methods of assessment" (ResearchGate)
 * Represents typical road cyclist in moderate aero position
 */
export declare const DEFAULT_DRAG_COEFFICIENT = 0.7;

/**
 * Drivetrain efficiency (dimensionless, 0-1)
 * Source: Modern road bike drivetrain efficiency measurements
 * Reference: Chain efficiency studies, well-maintained equipment
 */
export declare const DEFAULT_DRIVETRAIN_EFFICIENCY = 0.976;

/**
 * Cyclist frontal area (m²)
 * Source: Cycling aerodynamics studies show range 0.394-0.531 m²
 * Reference: "Reference values and improvement of aerodynamic drag in professional cyclists"
 * Represents typical recreational cyclist position
 */
export declare const DEFAULT_FRONTAL_AREA = 0.5;

/**
 * Front wheel inertia moment (kg⋅m²)
 * Source: Physics education materials, racing wheels with rim mass concentration
 * Typical lightweight racing wheels: ~0.05 kg⋅m²
 */
export declare const DEFAULT_INERTIA_FRONT = 0.05;

/**
 * Rear wheel inertia moment (kg⋅m²)
 * Source: Physics education materials, rear wheel slightly heavier due to cassette
 * Typical lightweight racing wheels: ~0.07 kg⋅m²
 */
export declare const DEFAULT_INERTIA_REAR = 0.07;

/**
 * Maximum braking deceleration coefficient (g units)
 * Source: Academic research shows bicycle braking limit ~0.67g
 * Reference: SAE Technical Paper 2020-01-0876 "Bicycle Braking Performance Testing"
 * Safety margin applied: 0.6g provides realistic but safe limit
 */
export declare const DEFAULT_MAX_BRAKE_G = 0.6;

/**
 * Maximum lean angle for cornering (degrees)
 * Source: Practical limit on crowned roads from cycling physics research
 * Reference: Brandt's analysis of bicycle cornering dynamics
 * Typical safe limit for road cycling with safety margin
 */
export declare const DEFAULT_MAX_LEAN_ANGLE_DEG = 35;

/**
 * Maximum lean angle for cornering (radians)
 * Converted from degrees for internal physics calculations
 */
export declare const DEFAULT_MAX_LEAN_ANGLE_RAD: number;

/**
 * Maximum speed capability (km/h)
 * Source: Reasonable maximum for recreational cycling on roads
 * Professional sprinting can exceed this, but represents safe operational limit
 */
export declare const DEFAULT_MAX_SPEED_KMH = 100;

/**
 * Standard road bike wheel radius (meters)
 * Source: 700c wheels with 25mm tire (~1.4m diameter total)
 * Standard wheel sizing for road bikes
 */
export declare const DEFAULT_WHEEL_RADIUS = 0.7;

/**
 * 3D Douglas-Peucker algorithm implementation for elevation profile simplification
 * Uses ECEF coordinates for true 3D distance calculations
 */
export declare class DouglasPeucker {
    /**
     * Simplify a path using the Douglas-Peucker algorithm in 3D space
     * @param points - Array of coordinates with elevation
     * @param tolerance - Maximum allowed distance from simplified line in meters
     * @param zExaggeration - Elevation exaggeration factor for ECEF conversion (default: 3)
     * @returns Simplified array of coordinates
     */
    static simplify(path: Path, tolerance: number, zExaggeration?: number): Path;
    /**
     * Recursive step of the Douglas-Peucker algorithm
     * @param points - Array of all points
     * @param firstIndex - Index of first point in current segment
     * @param lastIndex - Index of last point in current segment
     * @param tolerance - Maximum allowed distance in meters
     * @param zExaggeration - Elevation exaggeration factor
     * @returns Array of points to include in simplified path
     */
    private static simplifyRecursive;
}

/**
 * Default simulation time step (seconds)
 * Used for numerical integration in physics calculations
 */
export declare const DT = 1;

/**
 * ECEF (Earth-Centered, Earth-Fixed) coordinate converter
 * Converts WGS84 coordinates (latitude/longitude/elevation) to ECEF Cartesian coordinates
 */
export declare class EcefConverter {
    /**
     * Convert WGS84 coordinates to ECEF coordinates with optional elevation exaggeration
     * @param coordinates - Geographic coordinates with elevation
     * @param zExaggeration - Elevation exaggeration factor (default: 3)
     * @returns ECEF coordinates as Vector3D
     */
    static toEcef(coordinates: Point, zExaggeration?: number): Vector3D;
}

export declare class Elevation {
    static fixElevation(path: Path, loadElevations?: boolean): Promise<Path>;
}

export declare const EMPTY_POINT: Point;

export declare interface EnhanceOptions {
    /** Fix elevation data using elevation service (default: true) */
    readonly fixElevation?: boolean;
    /** Compute maximum safe speeds based on cornering and braking (default: true). Activated anyway if virtualizeTrack is true */
    readonly computeMaxSpeeds?: boolean;
    /** Simulate realistic cycling speeds using power-based calculations (default: true) */
    readonly virtualizeTrack?: boolean;
    /** Resample path to one point per second (default: true) */
    readonly computeOnePointPerSecond?: boolean;
    /** Simplify path using Douglas-Peucker algorithm (default: enabled with tolerance=10, zExaggeration=3) */
    readonly simplifyPath?: SimplifyPathOptions;
}

export declare class Enhancer {
    static FIELDS: PointField[];
    static getDefaultCourse(path: Path): CoursePhysics;
    static enhanceCourseDefault(path: Path): Promise<Path>;
    static enhanceCourse(course: CoursePhysics, options?: EnhanceOptions): Promise<Path>;
}

/**
 * Complete field definitions for Point storage.
 * Order matters - determines array indices in PointField enum.
 */
export declare const FIELD_DEFINITIONS: FieldCategory[];

export declare interface FieldCategory {
    id: string;
    /** Category name for documentation */
    name: string;
    notSelectable?: boolean;
    /** Fields in this category */
    fields: FieldDefinition[];
}

/**
 * Field definitions for code generation of Point and Path classes.
 * This is the single source of truth for all field metadata.
 *
 * To add/remove fields:
 * 1. Update this file
 * 2. Run: npm run generate:point
 * 3. Tests will automatically validate the generated code
 */
export declare interface FieldDefinition {
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
    setSpecial?: 'date';
    /** Special getter handling */
    getSpecial?: 'date';
    notSelectable?: boolean;
}

/**
 * Total number of fields per point in the chunked storage.
 */
export declare const FIELDS_PER_POINT = 36;

export declare const fieldToPointField: Record<string, PointField>;

/**
 * WGS-84 first eccentricity squared (dimensionless)
 * Source: World Geodetic System 1984 specification
 */
export declare const FIRST_ECCENTRICITY_SQUARED = 0.0066943799901378;

/**
 * Standard gravitational acceleration (m/s²)
 * Source: International System of Units (SI)
 */
export declare const G = 9.8;

export declare abstract class GeneratedPath extends AbstractPath {
    getLatitude(pointIndex: number): number;
    getLatitudeDeg(pointIndex: number): number;
    setLatitude(pointIndex: number, value: number): void;
    getLongitude(pointIndex: number): number;
    getLongitudeDeg(pointIndex: number): number;
    setLongitude(pointIndex: number, value: number): void;
    getDistance(pointIndex: number): number;
    setDistance(pointIndex: number, value: number): void;
    getDx(pointIndex: number): number;
    setDx(pointIndex: number, value: number): void;
    getTime(pointIndex: number): number;
    setTime(pointIndex: number, value: number | Date): void;
    getTimeAsDate(pointIndex: number): Date;
    getElapsed(pointIndex: number): number;
    setElapsed(pointIndex: number, value: number): void;
    getDt(pointIndex: number): number;
    setDt(pointIndex: number, value: number): void;
    getBearing(pointIndex: number): number;
    setBearing(pointIndex: number, value: number): void;
    getElevation(pointIndex: number): number;
    setElevation(pointIndex: number, value: number): void;
    getGrade(pointIndex: number): number;
    setGrade(pointIndex: number, value: number): void;
    getRadius(pointIndex: number): number;
    setRadius(pointIndex: number, value: number): void;
    getAeroCoef(pointIndex: number): number;
    setAeroCoef(pointIndex: number, value: number): void;
    getWindBearing(pointIndex: number): number;
    setWindBearing(pointIndex: number, value: number): void;
    getWindAlpha(pointIndex: number): number;
    setWindAlpha(pointIndex: number, value: number): void;
    getPAero(pointIndex: number): number;
    setPAero(pointIndex: number, value: number): void;
    getPGravity(pointIndex: number): number;
    setPGravity(pointIndex: number, value: number): void;
    getPRollingResistance(pointIndex: number): number;
    setPRollingResistance(pointIndex: number, value: number): void;
    getPWheelBearings(pointIndex: number): number;
    setPWheelBearings(pointIndex: number, value: number): void;
    getPInputPower(pointIndex: number): number;
    setPInputPower(pointIndex: number, value: number): void;
    getPCyclistProvidedOptimalPower(pointIndex: number): number;
    setPCyclistProvidedOptimalPower(pointIndex: number, value: number): void;
    getPCyclistProvidedOptimalPowerWithHarmonics(pointIndex: number): number;
    setPCyclistProvidedOptimalPowerWithHarmonics(pointIndex: number, value: number): void;
    getPCyclistPowerNeeded(pointIndex: number): number;
    setPCyclistPowerNeeded(pointIndex: number, value: number): void;
    getPCyclistProvidedMuscular(pointIndex: number): number;
    setPCyclistProvidedMuscular(pointIndex: number, value: number): void;
    getPCyclistProvidedWheel(pointIndex: number): number;
    setPCyclistProvidedWheel(pointIndex: number, value: number): void;
    getPComputedTotalPower(pointIndex: number): number;
    setPComputedTotalPower(pointIndex: number, value: number): void;
    getPComputedWheelPower(pointIndex: number): number;
    setPComputedWheelPower(pointIndex: number, value: number): void;
    getPComputedPower(pointIndex: number): number;
    setPComputedPower(pointIndex: number, value: number): void;
    getSpeed(pointIndex: number): number;
    setSpeed(pointIndex: number, value: number): void;
    getSpeedMax(pointIndex: number): number;
    setSpeedMax(pointIndex: number, value: number): void;
    getSpeedMaxIncline(pointIndex: number): number;
    setSpeedMaxIncline(pointIndex: number, value: number): void;
    getVirtSpeedCurrent(pointIndex: number): number;
    setVirtSpeedCurrent(pointIndex: number, value: number): void;
    getTemperature(pointIndex: number): number;
    setTemperature(pointIndex: number, value: number): void;
    getWindSpeed(pointIndex: number): number;
    setWindSpeed(pointIndex: number, value: number): void;
    getWindDirection(pointIndex: number): number;
    setWindDirection(pointIndex: number, value: number): void;
    getHeartRate(pointIndex: number): number;
    setHeartRate(pointIndex: number, value: number): void;
    getCadence(pointIndex: number): number;
    setCadence(pointIndex: number, value: number): void;
    /**
     * Adds a new point with the provided data.
     * @param data Complete point data with all 36 properties
     * @returns The index of the newly added point
     */
    addPoint(data: Point): number;
    /**
     * Gets all data for a specific point.
     */
    getPointData(pointIndex: number): Point;
}

/**
 * Default configuration represents:
 * - Modern road bike with high-performance tires (Crr = 0.004)
 * - Lightweight racing wheels with typical rotational inertia
 * - Standard 700c wheel size (radius = 0.7m)
 * - High-efficiency modern drivetrain (97.6% efficiency)
 */
export declare const getDefaultBikeProperties: () => BikeProperties;

/**
 * Create cyclist properties validated from cycling research.
 *
 * Default configuration represents:
 * - 80kg total system mass (recreational cyclist + road bike)
 * - 280W sustainable power output (~3.5 W/kg FTP)
 * - Conservative braking and handling limits for safety
 * - Typical aerodynamic parameters for recreational cycling position
 *
 * @returns Cyclist instance with scientifically validated defaults
 */
export declare const getDefaultCyclistProperties: () => CyclistProperties;

/**
 * Parser for GPX files with comprehensive namespace and extension support.
 *
 * Handles GPX files from various GPS manufacturers and applications,
 * parsing track data, metadata, and device-specific extensions into
 * a standardized format.
 */
export declare class GPXParser {
    private namespaceResolver;
    private extensionParser;
    /**
     * Parse GPX XML content into structured data
     */
    parse(gpxContent: string): Paths;
    /**
     * Parse a GPX track element
     */
    private parseTrack;
    /**
     * Parse a GPX track segment element
     */
    private parseTrackSegment;
    /**
     * Parse a GPX track point element
     */
    private parseTrackPoint;
    /**
     * Static method to quickly parse GPX content
     */
    static parse(gpxContent: string): Paths;
}

/**
 * Writer for GPX files with namespace-aware extension generation.
 *
 * Converts Path objects to properly formatted GPX XML with support
 * for various extension formats and namespace declarations.
 */
export declare class GPXWriter {
    /**
     * Convert Path object to GPX XML string
     */
    writeFromPath(path: Path): string;
    /**
     * Convert GPXData to GPX XML string
     */
    write(gpxData: Paths): string;
    /**
     * Create XML document
     */
    private createDocument;
    /**
     * Create GPX root element with proper namespaces
     */
    private createGPXElement;
    /**
     * Create metadata element
     */
    private createMetadataElement;
    /**
     * Create track element
     */
    private createTrackElement;
    /**
     * Create track point element with extensions
     */
    private createTrackPointElement;
    /**
     * Create extensions element with proper namespace handling
     */
    private createExtensionsElement;
    /**
     * Format XML with indentation (basic implementation)
     */
    private formatXML;
    /**
     * Static method to quickly write GPX from Path
     */
    static writeFromPath(path: Path): string;
    /**
     * Static method to quickly write GPX data
     */
    static write(gpxData: Paths): string;
}

export declare const gravPowerProvider: PowerProvider;

/**
 * Logger class that provides conditional logging based on build environment
 * In production builds, all logging code is eliminated by the bundler
 *
 * Matches the full console API signatures for compatibility with printf-style formatting
 * and all console features
 */
export declare class Logger {
    private namespace;
    private level;
    constructor(namespace: string);
    private shouldLog;
    private doLog;
    private log;
    /**
     * Log debug information (verbose output for development)
     * Supports printf-style formatting: logger.debug('Value: %s, Count: %d', value, count)
     */
    trace(message?: any, ...optionalParams: any[]): void;
    /**
     * Log debug information (verbose output for development)
     * Supports printf-style formatting: logger.debug('Value: %s, Count: %d', value, count)
     */
    debug(message?: any, ...optionalParams: any[]): void;
    /**
     * Log general information
     * Supports printf-style formatting: logger.info('User %s logged in', username)
     */
    info(message?: any, ...optionalParams: any[]): void;
    /**
     * Log warnings
     * Supports printf-style formatting: logger.warn('Timeout after %dms', timeout)
     */
    warn(message?: any, ...optionalParams: any[]): void;
    /**
     * Log errors
     * Supports printf-style formatting: logger.error('Failed to load %s: %o', file, error)
     */
    error(message?: any, ...optionalParams: any[]): void;
    private getTimeLabel;
    private doTime;
    private doTimeEnd;
    /**
     * Log with timing information
     * Useful for performance debugging
     */
    timeLevel(level: LogLevelValue, label: string): void;
    /**
     * End timing and log duration
     */
    timeEndLevel(level: LogLevelValue, label: string): void;
    /**
     * Log with timing information
     * Useful for performance debugging
     */
    time(label: string): void;
    /**
     * End timing and log duration
     */
    timeEnd(label: string): void;
    private logDir;
    /**
     * Display an interactive list of object properties
     * Useful for exploring complex objects in development
     * @param obj - The object to inspect
     * @param options - Optional display options
     */
    dirLevel(level: LogLevelValue, message?: any, obj?: any, options?: any): void;
    /**
     * Display an interactive list of object properties
     * Useful for exploring complex objects in development
     * @param obj - The object to inspect
     * @param options - Optional display options
     */
    dir(message?: any, obj?: any, options?: any): void;
    /**
     * Clear the console
     */
    clear(): void;
}

export declare class LogLevel {
    static readonly ERROR: LogLevelValue;
    static readonly WARN: LogLevelValue;
    static readonly INFO: LogLevelValue;
    static readonly DEBUG: LogLevelValue;
    static readonly TRACE: LogLevelValue;
}

/**
 * Lightweight logger for development debugging
 * All logging is completely removed in production builds via __DEV__ constant
 */
declare type LogLevelValue = 0 | 1 | 2 | 3 | 4;

/**
 * MaxSpeedComputer calculates maximum safe speeds for cycling based on:
 * 1. Cornering physics (lean angle limits)
 * 2. Braking constraints (deceleration limits)
 *
 * Uses a two-pass algorithm:
 * - Forward pass: Compute cornering speed limits using circle geometry
 * - Reverse pass: Apply braking constraints working backwards
 *
 * Based on bicycle dynamics and physics research.
 */
export declare class MaxSpeedComputer {
    private constructor();
    /**
     * Compute maximum safe speeds for all points in the course.
     *
     * @param course Course containing path, cyclist, and bike parameters
     */
    static computeMaxSpeeds(course: MaxSpeedCourse): void;
    /**
     * First pass: Calculate maximum cornering speeds based on lean angle physics.
     * Works forward through the path, computing speeds limited by turning radius.
     *
     * Formula: v_max = √(g × radius × tan(max_lean_angle))
     *
     * @param course Course to process
     */
    protected static firstPass(course: MaxSpeedCourse): void;
    /**
     * Second pass: Apply braking constraints working backwards through the path.
     * Ensures that the cyclist can brake safely from any speed to the required
     * speed at the next point.
     *
     * @param course Course to process
     */
    protected static secondPass(course: MaxSpeedCourse): void;
    private static computeRadiusWindowed;
    private static normalizeAngleDiff;
    /**
     * Compute maximum cornering speed for a point based on the turning radius
     * defined by three consecutive points (previous, current, next).
     *
     * Uses bicycle dynamics: v_max = √(g × radius × tan(max_lean_angle))
     *
     * @param course Course containing cyclist parameters
     * @param prevIndex Index of previous point
     * @param currentIndex Index of current point
     * @param nextIndex Index of next point
     */
    private static computeMaxSpeedByIncline;
    /**
     * Apply braking constraint between two consecutive points.
     * Ensures that the cyclist can brake from the previous point's speed
     * to the current point's required speed within the available distance.
     *
     * Uses kinematic equation: v₀² = v_f² + 2 × a × distance
     *
     * @param course Course containing cyclist parameters
     * @param prevIndex Index of previous point
     * @param currentIndex Index of current point
     */
    private static computeMaxSpeedByBraking;
}

/**
 * Course configuration for MaxSpeedComputer using actual class instances
 */
declare interface MaxSpeedCourse {
    readonly path: Path;
    readonly cyclist: Cyclist;
    readonly bike: Bike;
}

/**
 * Minimal speed threshold = 2km/h (m/s)
 * Below this speed, physics calculations may become unstable
 */
export declare const MINIMAL_SPEED: number;

export declare const muscularPowerProvider: PowerProvider;

export declare class Path extends GeneratedPath {
    private totalDistance;
    private timeStart;
    private minElevation;
    private maxElevation;
    private totalElevationGain;
    private totalElevationLoss;
    private minLat;
    private maxLat;
    private minLon;
    private maxLon;
    /**
     * Clears all data and resets to initial state.
     */
    clear(): void;
    /**
     * Creates an iterator for efficient point traversal.
     */
    [Symbol.iterator](): Iterator<Point>;
    /**
     * Creates an iterator for accessing raw coordinate data efficiently.
     * Useful for integrating with existing Coordinates-based code.
     */
    coordinatesIterator(): IterableIterator<{
        latitude: number;
        longitude: number;
        elevation: number;
    }>;
    /**
     * Gets data for a range of points.
     */
    getPointRange(startIndex: number, count: number): Point[];
    /**
     * Get total distance of the track.
     * @returns Total distance in meters
     */
    getTotalDistance(): number;
    /**
     * Get minimum elevation in the track.
     * @returns Minimum elevation in meters
     */
    getMinElevation(): number;
    /**
     * Get maximum elevation in the track.
     * @returns Maximum elevation in meters
     */
    getMaxElevation(): number;
    /**
     * Get total elevation gain.
     * @returns Total elevation gain in meters
     */
    getTotalElevationGain(): number;
    /**
     * Get total elevation loss.
     * @returns Total elevation loss in meters (negative value)
     */
    getTotalElevationLoss(): number;
    /**
     * Get geographic bounds of the track.
     * @returns Bounding box with min/max latitude and longitude
     */
    getBounds(): {
        minLat: number;
        maxLat: number;
        minLon: number;
        maxLon: number;
    };
    /**
     * Get all cumulative distances as an array for efficient binary search.
     * This is used by VirtualizeService for GPS waypoint alignment.
     *
     * @returns Array of cumulative distances for all points
     */
    getAllDistances(): Float64Array;
    /**
     * Compute derived arrays and statistics from GPS track data.
     * Calculates distances, elevations, grades, speeds, and bearings.
     * Based on Java computeDerivedData() method from gpx2web project.
     */
    computeDerivedData(): void;
    computeBearing(from: number, to: number): number;
    /**
     * Calculate distance between two points using Haversine formula.
     * @param lat1 Latitude of first point (radians)
     * @param lon1 Longitude of first point (radians)
     * @param lat2 Latitude of second point (radians)
     * @param lon2 Longitude of second point (radians)
     * @returns Distance in meters
     */
    private distanceTo;
    /**
     * Simple coordinate projection to Cartesian coordinates for bearing calculation.
     * @param latitude Latitude in radians
     * @param longitude Longitude in radians
     * @returns Projected x,y coordinates
     */
    private project;
    /**
     * PERFORMANCE OPTIMIZATION: Directly interpolate between two points and write to a new index.
     * Avoids creating intermediate Point objects.
     *
     * @param targetIndex Index where interpolated point will be written (must be valid)
     * @param index1 First source point index
     * @param index2 Second source point index
     * @param coef Interpolation coefficient (0 = index1, 1 = index2)
     * @param fieldsToInterpolate Array of PointField values to interpolate (others will be NaN)
     */
    addInterpolatedFrom(from: Path, index1: number, index2: number, coef: number, fieldsToInterpolate: PointField[]): number;
    addFrom(from: Path, index: number, fieldsToInterpolate: PointField[]): number;
}

/**
 * Complete GPX document structure
 */
export declare interface Paths {
    name?: string;
    tracks: Path[];
}

/**
 * Interface representing a complete point with all 36 properties.
 * All values are stored as numbers with appropriate unit conversions.
 *
 * Note: Angles are stored in RADIANS for efficient physics calculations.
 */
export declare interface Point {
    readonly latitude: number;
    readonly longitude: number;
    readonly distance: number;
    readonly dx: number;
    readonly time: number;
    readonly elapsed: number;
    readonly dt: number;
    readonly bearing: number;
    readonly elevation: number;
    readonly grade: number;
    readonly radius: number;
    readonly aeroCoef: number;
    readonly windBearing: number;
    readonly windAlpha: number;
    readonly pAero: number;
    readonly pGravity: number;
    readonly pRollingResistance: number;
    readonly pWheelBearings: number;
    readonly pInputPower: number;
    readonly pCyclistProvidedOptimalPower: number;
    readonly pCyclistProvidedOptimalPowerWithHarmonics: number;
    readonly pCyclistPowerNeeded: number;
    readonly pCyclistProvidedMuscular: number;
    readonly PCyclistProvidedWheel: number;
    readonly pComputedTotalPower: number;
    readonly pComputedWheelPower: number;
    readonly pComputedPower: number;
    readonly speed: number;
    readonly speedMax: number;
    readonly speedMaxIncline: number;
    readonly virtSpeedCurrent: number;
    readonly temperature: number;
    readonly windSpeed: number;
    readonly windDirection: number;
    readonly heartRate: number;
    readonly cadence: number;
}

export declare const POINT_FIELDS: PointField[];

/**
 * Enum defining the index of each field in the chunked array storage.
 * Based on PropertyKeys.java from gpx2web project.
 * Each point has exactly 36 numeric values stored contiguously.
 */
export declare enum PointField {
    LATITUDE = 0,// Latitude (radians)
    LONGITUDE = 1,// Longitude (radians)
    DISTANCE = 2,// Distance (meters)
    DX = 3,// dx (meters)
    TIME = 4,// Timestamp (ms since epoch)
    ELAPSED = 5,// Elapsed duration (ms)
    DT = 6,// dt (ms)
    BEARING = 7,// Direction bearing (radians)
    ELEVATION = 8,// Elevation (meters)
    GRADE = 9,// Road grade/slope (%)
    RADIUS = 10,// Turn radius (meters)
    AERO_COEF = 11,// Aerodynamic coefficient
    WIND_BEARING = 12,// Wind bearing (radians)
    WIND_ALPHA = 13,// Wind angle (radians)
    P_AERO = 14,// Aerodynamic power
    P_GRAVITY = 15,// Gravitational power
    P_ROLLING_RESISTANCE = 16,// Rolling resistance power
    P_WHEEL_BEARINGS = 17,// Wheel bearings power
    P_INPUT_POWER = 18,// GPX input power
    P_CYCLIST_PROVIDED_OPTIMAL_POWER = 19,// Optimal power
    P_CYCLIST_PROVIDED_OPTIMAL_POWER_HARMONICS = 20,// Optimal power with harmonics
    P_CYCLIST_PROVIDED_POWER_NEEDED = 21,// Power needed
    P_CYCLIST_PROVIDED_MUSCULAR = 22,// Raw cyclist power
    P_CYCLIST_PROVIDED_WHEEL = 23,// Cyclist power transmitted to ground
    P_COMPUTED_TOTAL_POWER = 24,// Power from kinetic energy change
    P_COMPUTED_WHEEL_POWER = 25,// Wheel power from kinetic energy change
    POWER = 26,// Total power (watts)
    SPEED = 27,// Current speed (m/s)
    SPEED_MAX = 28,// Maximum speed (m/s)
    SPEED_MAX_INCLINE = 29,// Max speed on incline (m/s)
    VIRT_SPEED_CURRENT = 30,// Virtual current speed (m/s)
    TEMPERATURE = 31,// Temperature (celsius)
    WIND_SPEED = 32,// Wind speed (m/s)
    WIND_DIRECTION = 33,// Wind direction (radians)
    HEART_RATE = 34,// Heart rate (bpm)
    CADENCE = 35
}

export declare class PointPerDistance {
    private constructor();
    static compute(path: Path, minDist: number, maxDist: number, fields?: PointField[]): Path;
}

/**
 * Service for resampling GPS tracks to ensure one point per second.
 *
 * This class processes GPS tracks to create uniform temporal resolution by:
 * - Interpolating points between existing track points
 * - Ensuring exactly one point exists at each epoch second
 * - Preserving all point properties during interpolation
 *
 * Algorithm:
 * 1. For each segment between consecutive points:
 *    - If points span multiple seconds, interpolate points at each epoch second
 *    - Use linear interpolation weighted by time distance
 * 2. Special handling for first/last points if not on epoch boundary
 *
 * Based on GPXPerSecond.java from gpx2web project.
 *
 * Use cases:
 * - Standardizing GPS tracks from different devices with varying sampling rates
 * - Preparing data for time-series analysis requiring uniform intervals
 * - Synchronizing multiple GPS tracks to common time resolution
 *
 * @example
 * ```typescript
 * const perSecond = new GPXPerSecond();
 * const paths: Paths = parser.parse(gpxContent);
 * paths.tracks.forEach(track => {
 *   perSecond.computeOnePointPerSecond(track);
 * });
 * ```
 */
export declare class PointPerSecond {
    private constructor();
    /**
     * Resamples a single path to ensure one point per second.
     *
     * Creates a new path with interpolated points at exact epoch second boundaries.
     *
     * @param path The path to resample
     * @returns A new path with one point per second
     */
    static computeOnePointPerSecond(path: Path): Path;
    /**
     * Resamples all tracks in a Paths object (modified in-place).
     *
     * @param paths The paths object containing tracks to resample
     */
    static computeOnePointPerSecondForPaths(paths: Paths): void;
    /**
     * Creates a new path with resampled points.
     */
    private static createResampledPath;
}

export declare type PointWritable = Writable<Point>;

/**
 * Core power computation engine for virtual cycling simulations.
 *
 * This class implements the fundamental physics calculations that drive
 * the simulation, including:
 *
 * **Power Balance:**
 * - Calculates net power from all sources (cyclist + resistances)
 * - Determines acceleration/deceleration from power balance
 *
 * **Speed Integration:**
 * - Uses energy conservation for speed calculations
 * - Enforces minimum speed constraints
 *
 * **Time Stepping:**
 * - Adaptive time step calculations for GPS waypoint alignment
 * - Binary search for optimal time steps
 *
 * **Equivalent Mass:**
 * - Accounts for rotational inertia of wheels
 * - Uses effective mass for acceleration calculations
 *
 * ## Physics Model
 *
 * The core equation relates power to kinetic energy change:
 * ```
 * P_total = ΔKE / Δt = 0.5 × M_eq × (v₂² - v₁²) / Δt
 * ```
 *
 * Where:
 * - M_eq = m + (I_front + I_rear) / r²  (equivalent mass)
 * - v₁, v₂: speeds before and after time step
 * - Δt: time step duration
 *
 * Solving for new speed:
 * ```
 * v₂ = √(2ΔtP/M_eq + v₁²)
 * ```
 *
 * Uses singleton pattern since it's stateless and can be shared across simulations.
 *
 * @see https://en.wikipedia.org/wiki/Bicycle_performance#Power_and_energy
 */
export declare class PowerComputer {
    static INSTANCE: PowerComputer;
    protected constructor();
    /**
     * Calculates the net power at a specific point.
     *
     * Sums power from all providers to get the total power balance.
     * Can optionally exclude cyclist power to calculate only resistances.
     *
     * @param course Course configuration
     * @param path Path containing point data
     * @param pointIndex Index of current point
     * @param withCyclist If true, include cyclist power; if false, only resistances
     * @returns Net power in watts (sum of all powers)
     */
    getNewPower(course: CoursePhysics, path: Path, pointIndex: number, withCyclist: boolean): number;
    /**
     * Calculates distance traveled given power, mass, speed, and time step.
     *
     * Uses energy conservation to determine new speed, then calculates
     * distance.
     *
     * Physics:
     * 1. Power × time = change in kinetic energy
     * 2. Solve for new speed: v₂ = √(2ΔtP/M_eq + v₁²)
     * 3. Distance: Δx = (v₁ + v₂) × Δt / 2
     *
     * Enforces minimum speed constraint to avoid numerical instability.
     *
     * @param pSum Net power in watts
     * @param equivalentMass Equivalent mass including rotational inertia (kg)
     * @param currentSpeed Current speed in m/s
     * @param dt Time step in seconds
     * @returns Distance traveled in meters
     */
    getDx(pSum: number, equivalentMass: number, currentSpeed: number, dt: number): number;
    /**
     * Calculates the time step needed to travel a specific distance.
     *
     * Uses binary search to find the time step that produces the target
     * distance given current power balance and speed.
     *
     * This is used for GPS waypoint alignment, where we know the distance
     * between points and need to find the corresponding time step.
     *
     * Search range: -0.1 to DT+0.1 seconds
     * Convergence: dx / 10,000,000 (very tight tolerance)
     *
     * @param pSum Net power in watts
     * @param equivalentMass Equivalent mass including rotational inertia (kg)
     * @param currentSpeed Current speed in m/s
     * @param dx Target distance in meters
     * @returns Time step in seconds
     */
    getDt(pSum: number, equivalentMass: number, currentSpeed: number, dx: number): number;
    getDtInner(pSum: number, equivalentMass: number, currentSpeed: number, dx: number, dt1: number, dt2: number): number;
    /**
     * Computes cyclist power from measured speed change between two points.
     *
     * This is the inverse problem: given speed change, calculate the power
     * that must have been applied. Used for analyzing recorded rides with
     * speed data but no power meter.
     *
     * Process:
     * 1. Calculate resistance powers at point 1
     * 2. Calculate total power from speed change
     * 3. Cyclist power = total power - resistance powers
     * 4. Adjust for drivetrain efficiency
     *
     * @param course Course configuration
     * @param path Path containing point data
     * @param equivalentMass Equivalent mass including rotational inertia (kg)
     * @param pointIndex1 Index of first point
     * @param pointIndex2 Index of second point
     */
    computeCyclistPower(course: CoursePhysics, path: Path, equivalentMass: number, i: number): void;
    /**
     * Calculates total power from speed change using kinetic energy formula.
     *
     * P = ΔKE / Δt = 0.5 × M_eq × (v₂² - v₁²) / Δt
     *
     * @param equivalentMass Equivalent mass including rotational inertia (kg)
     * @param s1 Initial speed in m/s
     * @param s2 Final speed in m/s
     * @param dt Time step in seconds
     * @returns Power in watts
     */
    protected getTotPower(equivalentMass: number, s1: number, s2: number, dt: number): number;
    /**
     * Calculates time difference between two points in seconds.
     *
     * @param path Path containing point data
     * @param pointIndex1 Index of first point
     * @param pointIndex2 Index of second point
     * @returns Time difference in seconds
     */
    protected getDtBetweenPoints(path: Path, pointIndex1: number, pointIndex2: number): number;
    /**
     * Calculates the equivalent mass accounting for rotational inertia.
     *
     * Wheels have rotational inertia that effectively increases the mass
     * that must be accelerated. The equivalent mass formula is:
     *
     * M_eq = m + I_total / r²
     *
     * Where:
     * - m: total system mass (cyclist + bike)
     * - I_total: sum of wheel rotational inertias
     * - r: wheel radius
     *
     * This accounts for the fact that accelerating the wheels requires
     * energy for both linear and rotational motion.
     *
     * Typical values:
     * - System mass: 80 kg
     * - Wheel inertia: 0.12 kg⋅m² total
     * - Wheel radius: 0.7 m
     * - Equivalent mass: ~80.25 kg (~0.3% increase)
     *
     * @param course Course configuration with cyclist and bike parameters
     * @returns Equivalent mass in kg
     */
    getEquivalentMass(course: Course): number;
}

export declare interface PowerProvider {
    getPowerW(course: CoursePhysics, path: Path, pointIndex: number): number;
}

/**
 * Cyclist power provider with constant power output.
 *
 * This provider returns a fixed power value from the cyclist configuration
 * throughout the entire route. The power is subject to:
 * - Harmonic variations (if enabled)
 * - Speed-based adjustments (from base class)
 *
 * Use this for:
 * - Steady-state efforts (tempo, threshold, endurance rides)
 * - FTP-based simulations
 * - Constant wattage scenarios
 *
 * The base power comes from `course.cyclist.power` which represents
 * the sustained power output capability of the cyclist.
 *
 * Example:
 * ```typescript
 * const provider = new PowerProviderConstant();
 * // With cyclist.power = 250W
 * // Returns ~250W throughout route (plus harmonics/speed adjustments)
 * ```
 *
 * @see CyclistPowerProviderBase
 * @see PowerProviderConstantWithTiring
 */
export declare class PowerProviderConstant extends CyclistPowerProviderBase {
    readonly power: number;
    constructor(power: number, useHarmonics: boolean);
    /**
     * Returns the constant power from cyclist configuration.
     *
     * @param course Course configuration with cyclist power setting
     * @param _path Path containing point data (unused)
     * @param _pointIndex Index of current point (unused)
     * @returns Cyclist's configured power output in watts
     */
    protected getOptimalPower(_course: CoursePhysics, _path: Path, _pointIndex: number): number;
}

/**
 * Cyclist power provider with constant power that degrades over time (fatigue).
 *
 * This provider simulates the effects of muscular fatigue during long efforts
 * by applying a time-based power reduction factor. The power decreases linearly
 * from 100% at start to 50% at the specified duration.
 *
 * **Fatigue Model:**
 * ```
 * coefficient = max(0.5, 1 - 0.6 × (elapsed_time / duration))
 * power = base_power × coefficient
 * ```
 *
 * **Power Progression:**
 * - At start (0% duration): 100% power
 * - At 25% duration: 85% power
 * - At 50% duration: 70% power
 * - At 75% duration: 55% power
 * - At 100%+ duration: 50% power (minimum, constant thereafter)
 *
 * The model simulates:
 * - Glycogen depletion
 * - Muscular fatigue accumulation
 * - Mental fatigue effects
 * - Reduced neuromuscular efficiency
 *
 * Use this for:
 * - Long endurance rides (>1 hour)
 * - Ultra-distance simulations
 * - Realistic multi-hour efforts
 * - Testing pacing strategies
 *
 * Example:
 * ```typescript
 * // 3-hour ride with fatigue
 * const provider = new PowerProviderConstantWithTiring(3 * 3600); // 3 hours in seconds
 * // With cyclist.power = 250W
 * // Start: 250W, 1.5hr: 175W, 3hr+: 125W
 * ```
 *
 * @see PowerProviderConstant
 * @see CyclistPowerProviderBase
 */
export declare class PowerProviderConstantWithTiring extends CyclistPowerProviderBase {
    readonly power: number;
    readonly duration: number;
    /**
     * Creates a power provider with time-based fatigue.
     *
     * @param duration Duration in seconds after which power stabilizes at 50%
     *                 Typical values: 3600 (1hr), 7200 (2hr), 10800 (3hr)
     */
    constructor(power: number, useHarmonicsIn: boolean, duration: number);
    /**
     * Returns power adjusted for elapsed time fatigue.
     *
     * Applies fatigue factor to the base constant power:
     * - Power decreases linearly with time
     * - Minimum power is 50% of base power
     * - Fatigue stabilizes after specified duration
     *
     * @param course Course configuration
     * @param path Path containing point data
     * @param pointIndex Index of current point
     * @returns Fatigue-adjusted power in watts
     */
    protected getOptimalPower(_course: CoursePhysics, path: Path, pointIndex: number): number;
}

export declare const powerProviderFromData: CyclistPowerProvider;

export declare interface RhoProvider {
    /**
     * Gets the air density in kg/m³ at a specific location on the course.
     *
     * @param course The course configuration with cyclist and environmental parameters
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @returns Air density in kg/m³
     */
    getRho(course: Course, path: Path, pointIndex: number): number;
}

export declare const rhoProviderDefault: RhoProvider;

export declare const rhoProviderEstimate: RhoProvider;

export declare const rollingResistancePowerProvider: PowerProvider;

/**
 * WGS-84 semi-major axis (meters)
 * Source: World Geodetic System 1984 specification
 */
export declare const SEMI_MAJOR_AXIS = 6378137;

export declare interface SimplifyPathOptions {
    /** Enable path simplification (default: true) */
    readonly enable?: boolean;
    /** Maximum allowed distance from simplified line in meters (default: 10) */
    readonly tolerance?: number;
    /** Elevation exaggeration factor for 3D distance calculations (default: 3) */
    readonly zExaggeration?: number;
}

/**
 * Convert radians to degrees.
 *
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
export declare const toDegrees: (radians: number) => number;

/**
 * Convert degrees to radians.
 *
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export declare const toRadians: (degrees: number) => number;

/**
 * Total number of fields.
 */
export declare const TOTAL_FIELD_COUNT: number;

/**
 * 3D Vector class for ECEF coordinate operations
 */
export declare class Vector3D {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    constructor(x: number, y: number, z: number);
    /**
     * Calculate Euclidean distance between two vectors
     */
    distanceTo(other: Vector3D): number;
    /**
     * Subtract two vectors
     */
    subtract(other: Vector3D): Vector3D;
    /**
     * Add two vectors
     */
    add(other: Vector3D): Vector3D;
    /**
     * Multiply vector by scalar
     */
    multiply(scalar: number): Vector3D;
    /**
     * Calculate dot product with another vector
     */
    dot(other: Vector3D): number;
    /**
     * Calculate cross product with another vector
     */
    cross(other: Vector3D): Vector3D;
    /**
     * Calculate the magnitude (length) of the vector
     */
    magnitude(): number;
    /**
     * Normalize the vector to unit length
     */
    normalize(): Vector3D;
    /**
     * Calculate perpendicular distance from this point to a line segment defined by two points
     * Uses the formula: ||(p-a) × (p-b)|| / ||b-a||
     * where p is this point, a and b are the line segment endpoints
     */
    distanceToSegment(segmentStart: Vector3D, segmentEnd: Vector3D): number;
}

/**
 * Main simulation service for virtualizing GPS routes with physics-based cycling.
 *
 * This service transforms a static GPS route into a realistic cycling simulation by:
 * - Computing optimal speeds for all terrain/power combinations
 * - Integrating physics equations over time
 * - Aligning simulated trajectory with GPS waypoints
 * - Back-calculating cyclist power from speed changes
 *
 * ## Algorithm Overview
 *
 * 1. **Time-stepping loop**: Integrate physics from start to finish
 *    - Calculate power balance at each step
 *    - Determine distance traveled
 *    - Align with GPS waypoints or interpolate
 *    - Enforce maximum speed constraints
 * 2. **Post-processing**: Back-calculate cyclist power from speed profile
 *
 * ## GPS Waypoint Alignment
 *
 * The simulation stays on the actual GPS route by:
 * - Using binary search to find current segment
 * - Snapping to waypoints when crossing them
 * - Interpolating position between waypoints
 *
 * This ensures the virtual cyclist follows the exact recorded path.
 *
 * @see PowerComputer
 */
export declare class VirtualizeService {
    private static readonly powerComputer;
    /**
     * Virtualizes a GPS track using physics-based simulation.
     *
     * Transforms a static GPS route into a realistic cycling simulation with:
     * - Accurate time predictions based on power and terrain
     * - Speed profiles that respect physics and max speed limits
     * - Power estimates from speed changes
     *
     * The original path points are replaced with simulated points that have
     * physically consistent speeds, times, and power values.
     *
     * @param course Course configuration with path, cyclist, and bike parameters
     */
    static virtualizeTrack(course: CoursePhysics): Path;
}

export declare const wheelBearingsPowerProvider: PowerProvider;

/**
 * Represents wind conditions for aerodynamic calculations.
 *
 * Wind parameters are used to calculate the effective air velocity relative
 * to the cyclist, which significantly affects aerodynamic drag power.
 *
 * @property windSpeed Wind speed in m/s (meters per second)
 * @property windDirection Wind direction in radians
 *                        - 0 = North
 *                        - π/2 = East
 *                        - π = South
 *                        - 3π/2 = West
 */
export declare interface Wind {
    /** Wind speed in m/s */
    readonly windSpeed: number;
    /** Wind direction in radians (0 = North, π/2 = East) */
    readonly windDirection: number;
}

/**
 * Interface for wind data providers in virtual cycling simulations.
 *
 * WindProvider implementations supply wind conditions at specific locations
 * along a cycling route. Different implementations can provide:
 * - Constant wind (same throughout route)
 * - No wind (zero wind speed)
 * - Variable wind (weather data, time-based, location-based)
 * - Forecast data integration
 *
 * Wind significantly affects cycling aerodynamics, especially at higher speeds
 * or when the wind direction creates a headwind or crosswind component.
 */
export declare interface WindProvider {
    /**
     * Gets the wind conditions at a specific location on the course.
     *
     * @param course The course configuration
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @returns Wind conditions (speed and direction)
     */
    getWind(course: Course, path: Path, pointIndex: number): Wind;
}

/**
 * Wind provider that returns constant wind conditions throughout the route.
 *
 * This provider is useful for:
 * - Scenario analysis with specific wind conditions
 * - Testing the impact of wind on cycling performance
 * - Simulations where wind conditions are assumed constant
 *
 * The wind speed and direction remain unchanged regardless of location,
 * time, or other course parameters.
 *
 * Example usage:
 * ```typescript
 * // 5 m/s headwind from the north
 * const provider = new WindProviderConstant({ windSpeed: 5, windDirection: 0 });
 *
 * // 10 m/s crosswind from the east
 * const provider = new WindProviderConstant({ windSpeed: 10, windDirection: Math.PI / 2 });
 * ```
 */
export declare class WindProviderConstant implements WindProvider {
    private readonly wind;
    /**
     * Creates a constant wind provider with the specified wind conditions.
     *
     * @param wind The wind conditions to use throughout the route
     */
    constructor(wind: Wind);
    /**
     * Returns the constant wind conditions.
     *
     * @param _course The course configuration (unused)
     * @param _path The path containing point data (unused)
     * @param _pointIndex The index of the current point (unused)
     * @returns The constant wind conditions
     */
    getWind(_course: Course, _path: Path, _pointIndex: number): Wind;
}

export declare const windProviderNone: WindProvider;

declare type Writable<T> = {
    -readonly [K in keyof T]: T[K];
};

export { }
