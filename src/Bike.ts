import {
    DEFAULT_CRR,
    DEFAULT_INERTIA_FRONT,
    DEFAULT_INERTIA_REAR,
    DEFAULT_WHEEL_RADIUS,
    DEFAULT_DRIVETRAIN_EFFICIENCY,
} from './constants';

/**
 * Bike class implementing the Bike interface with utility methods.
 * Represents a bicycle with mechanical and physical characteristics
 * for virtual cycling simulations.
 *
 * Based on the Java Bike class from gpx2web project.
 */
export class Bike {
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
    constructor(
        crr: number,
        inertiaFront: number,
        inertiaRear: number,
        wheelRadius: number,
        efficiency: number
    ) {
        this.crr = crr;
        this.inertiaFront = inertiaFront;
        this.inertiaRear = inertiaRear;
        this.wheelRadius = wheelRadius;
        this.efficiency = efficiency;
    }

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
    static getDefault(): Bike {
        return new Bike(
            DEFAULT_CRR,
            DEFAULT_INERTIA_FRONT,
            DEFAULT_INERTIA_REAR,
            DEFAULT_WHEEL_RADIUS,
            DEFAULT_DRIVETRAIN_EFFICIENCY
        );
    }

    /**
     * Get total rotational inertia of both wheels.
     * Used in physics calculations for acceleration resistance
     * due to wheel rotation.
     *
     * Formula: I_total = I_front + I_rear
     *
     * @returns Total rotational inertia (kg⋅m²)
     */
    getTotalInertia(): number {
        return this.inertiaFront + this.inertiaRear;
    }

    /**
     * Get wheel diameter.
     * Useful for gear ratio calculations and general specifications.
     *
     * Formula: diameter = 2 × radius
     *
     * @returns Wheel diameter (meters)
     */
    getWheelDiameter(): number {
        return 2 * this.wheelRadius;
    }

    /**
     * Get wheel circumference.
     * Used in speed and distance calculations from wheel rotations.
     *
     * Formula: circumference = 2π × radius
     *
     * @returns Wheel circumference (meters)
     */
    getWheelCircumference(): number {
        return 2 * Math.PI * this.wheelRadius;
    }

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
    getEquivalentMass(): number {
        return this.getTotalInertia() / (this.wheelRadius * this.wheelRadius);
    }

    /**
     * Calculate power loss due to drivetrain inefficiency.
     * Determines how much input power is lost in the drivetrain.
     *
     * Formula: loss_factor = 1 - efficiency
     *
     * @returns Power loss factor (0-1, dimensionless)
     */
    getPowerLossFactor(): number {
        return 1 - this.efficiency;
    }

    /**
     * Calculate effective power delivered to the wheel.
     * Accounts for drivetrain losses in power transmission.
     *
     * Formula: P_wheel = P_input × efficiency
     *
     * @param inputPower Input power from cyclist (watts)
     * @returns Effective power at wheel (watts)
     */
    getWheelPower(inputPower: number): number {
        return inputPower * this.efficiency;
    }

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
    getRollingResistanceForce(normalForce: number): number {
        return this.crr * normalForce;
    }

    /**
     * Get a string representation of the bike configuration.
     *
     * @returns Human-readable string describing the bike
     */
    toString(): string {
        return `Bike {
            wheelSize: ${(this.getWheelDiameter() * 1000).toFixed(0)}mm (${this.getWheelCircumference().toFixed(2)}m circumference),
            crr: ${this.crr.toFixed(4)},
            totalInertia: ${this.getTotalInertia().toFixed(3)}kg⋅m² (${this.getEquivalentMass().toFixed(1)}kg equiv),
            efficiency: ${(this.efficiency * 100).toFixed(1)}% (${(this.getPowerLossFactor() * 100).toFixed(1)}% loss)
        }`;
    }
}
