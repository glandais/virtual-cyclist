import {
    DEFAULT_CYCLIST_MASS_KG,
    DEFAULT_DRAG_COEFFICIENT,
    DEFAULT_FRONTAL_AREA,
    DEFAULT_MAX_BRAKE_G,
    DEFAULT_MAX_LEAN_ANGLE_DEG,
    DEFAULT_MAX_SPEED_KMH,
    G,
} from '@/constants/';

export interface CyclistProperties {
    mKg: number;
    maxBrakeG: number;
    cd: number;
    a: number;
    maxAngleDeg: number;
    maxSpeedKmH: number;
}

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
export const getDefaultCyclistProperties = (): CyclistProperties => {
    return {
        mKg: DEFAULT_CYCLIST_MASS_KG,
        maxBrakeG: DEFAULT_MAX_BRAKE_G,
        cd: DEFAULT_DRAG_COEFFICIENT,
        a: DEFAULT_FRONTAL_AREA,
        maxAngleDeg: DEFAULT_MAX_LEAN_ANGLE_DEG,
        maxSpeedKmH: DEFAULT_MAX_SPEED_KMH,
    };
};

/**
 * Cyclist class implementing the Cyclist interface with utility methods.
 * Represents a cyclist with physical and performance characteristics
 * for virtual cycling simulations.
 *
 * Based on the Java Cyclist class from gpx2web project.
 */
export class Cyclist {
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
    constructor(
        mKg: number,
        maxBrakeG: number,
        cd: number,
        a: number,
        maxAngleDeg: number,
        maxSpeedKmH: number
    ) {
        this.mKg = mKg;
        this.maxBrakeG = maxBrakeG;
        this.cd = cd;
        this.a = a;
        this.maxAngleDeg = maxAngleDeg;
        this.maxSpeedKmH = maxSpeedKmH;
    }

    static getCyclist(properties: CyclistProperties) {
        return new Cyclist(
            properties.mKg,
            properties.maxBrakeG,
            properties.cd,
            properties.a,
            properties.maxAngleDeg,
            properties.maxSpeedKmH
        );
    }

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
    static getDefault(): Cyclist {
        return this.getCyclist(getDefaultCyclistProperties());
    }

    /**
     * Get the tangent of the maximum lean angle.
     * Used in cornering physics calculations for determining maximum
     * lateral acceleration without losing traction.
     *
     * Formula: tan(θ) where θ is the maximum lean angle
     *
     * @returns Tangent of maximum lean angle (dimensionless)
     */
    getTanMaxAngle(): number {
        return Math.tan((this.maxAngleDeg * Math.PI) / 180.0);
    }

    /**
     * Get the maximum lean angle in radians.
     * Provides direct radian access for physics calculations.
     *
     * @returns Maximum lean angle in radians
     */
    getMaxAngleRad(): number {
        return (this.maxAngleDeg * Math.PI) / 180.0;
    }

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
    getMaxBrakeMS2(): number {
        return this.maxBrakeG * G;
    }

    /**
     * Get maximum speed in SI units.
     * Converts from km/h to meters per second for physics calculations.
     *
     * Formula: v_ms = v_kmh / 3.6
     *
     * @returns Maximum speed (m/s)
     */
    getMaxSpeedMs(): number {
        return this.maxSpeedKmH / 3.6;
    }

    /**
     * Calculate aerodynamic drag area (CdA).
     * Combined aerodynamic parameter used in drag force calculations.
     *
     * Formula: CdA = cd × a
     *
     * @returns Aerodynamic drag area (m²)
     */
    getAerodynamicDragArea(): number {
        return this.cd * this.a;
    }

    /**
     * Get a string representation of the cyclist configuration.
     *
     * @returns Human-readable string describing the cyclist
     */
    toString(): string {
        return `Cyclist {
            mass: ${this.mKg}kg,
            CdA: ${this.getAerodynamicDragArea().toFixed(3)}m²,
            maxBrake: ${this.maxBrakeG}g (${this.getMaxBrakeMS2().toFixed(1)} m/s²),
            maxLean: ${this.maxAngleDeg}°,
            maxSpeed: ${this.maxSpeedKmH}km/h (${this.getMaxSpeedMs().toFixed(1)} m/s)
        }`;
    }
}
