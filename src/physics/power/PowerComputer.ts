import { DT, MINIMAL_SPEED } from '@/constants/';
import { Course, CoursePhysics } from '@/types/course/';
import { Path } from '@/types/path/';
import { aeroPowerProvider } from './aero';
import { muscularPowerProvider } from './cyclist';
import { gravPowerProvider } from './grav';
import { rollingResistancePowerProvider, wheelBearingsPowerProvider } from './rolling';

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
 * - Applies modified trapezoidal rule for numerical stability
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
 * Distance traveled (trapezoidal rule):
 * ```
 * Δx = (v₁ + v₂) × Δt / 2
 * ```
 *
 * Uses singleton pattern since it's stateless and can be shared across simulations.
 *
 * @see https://en.wikipedia.org/wiki/Bicycle_performance#Power_and_energy
 */
export class PowerComputer {
    static INSTANCE: PowerComputer = new PowerComputer();

    protected constructor() {}

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
    getNewPower(
        course: CoursePhysics,
        path: Path,
        pointIndex: number,
        withCyclist: boolean
    ): number {
        let pSum = 0;
        pSum += wheelBearingsPowerProvider.getPowerW(course, path, pointIndex);
        pSum += rollingResistancePowerProvider.getPowerW(course, path, pointIndex);
        pSum += aeroPowerProvider.getPowerW(course, path, pointIndex);
        pSum += gravPowerProvider.getPowerW(course, path, pointIndex);
        if (withCyclist) {
            pSum += muscularPowerProvider.getPowerW(course, path, pointIndex);
        }
        return pSum;
    }

    /**
     * Calculates distance traveled given power, mass, speed, and time step.
     *
     * Uses energy conservation to determine new speed, then calculates
     * distance using the trapezoidal rule (average of old and new speeds).
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
    getDx(pSum: number, equivalentMass: number, currentSpeed: number, dt: number): number {
        // Calculate new speed from energy balance
        // v_new² = v_old² + 2ΔtP/M_eq
        const newSpeed = Math.max(
            Math.sqrt((dt * pSum) / (0.5 * equivalentMass) + currentSpeed * currentSpeed),
            MINIMAL_SPEED
        );

        // Trapezoidal rule for distance
        return ((newSpeed + currentSpeed) * dt) / 2;
    }

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
    getDt(pSum: number, equivalentMass: number, currentSpeed: number, dx: number): number {
        let dt1 = -0.1;
        let dt2 = DT + 0.1;

        while (dt2 - dt1 >= dx / 10_000_000.0) {
            const dtMiddle = (dt1 + dt2) / 2;
            const dxMiddle = this.getDx(pSum, equivalentMass, currentSpeed, dtMiddle);

            if (dxMiddle < dx) {
                dt1 = dtMiddle;
            } else {
                dt2 = dtMiddle;
            }
        }

        return (dt1 + dt2) / 2;
    }

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
    computeCyclistPower(
        course: CoursePhysics,
        path: Path,
        equivalentMass: number,
        pointIndex1: number,
        pointIndex2: number
    ): void {
        // Calculate resistance powers (without cyclist)
        const power = this.getNewPower(course, path, pointIndex1, false);

        const s1 = path.getSpeed(pointIndex1);
        const s2 = path.getSpeed(pointIndex2);
        const dt = this.getDtBetweenPoints(path, pointIndex1, pointIndex2);

        // Calculate total power from kinetic energy change
        const totPower = this.getTotPower(equivalentMass, s1, s2, dt);
        path.setPComputedTotalPower(pointIndex1, totPower);

        // Cyclist wheel power = total - resistances
        let cyclistPower = totPower - power;
        path.setPComputedWheelPower(pointIndex1, cyclistPower);

        // Ensure non-negative
        cyclistPower = Math.max(0.0, cyclistPower);

        // Convert wheel power to muscular power (before drivetrain losses)
        cyclistPower = cyclistPower / course.bike.efficiency;

        // Set power on current point
        path.setPComputedPower(pointIndex1, cyclistPower);
    }

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
    protected getTotPower(equivalentMass: number, s1: number, s2: number, dt: number): number {
        return (0.5 * equivalentMass * (s2 * s2 - s1 * s1)) / dt;
    }

    /**
     * Calculates time difference between two points in seconds.
     *
     * @param path Path containing point data
     * @param pointIndex1 Index of first point
     * @param pointIndex2 Index of second point
     * @returns Time difference in seconds
     */
    protected getDtBetweenPoints(path: Path, pointIndex1: number, pointIndex2: number): number {
        const time1 = path.getTime(pointIndex1);
        const time2 = path.getTime(pointIndex2);
        return (time2 - time1) / 1000.0; // Convert ms to seconds
    }

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
    getEquivalentMass(course: Course): number {
        const mKg = course.cyclist.mKg;
        const inertiaFront = course.bike.inertiaFront;
        const inertiaRear = course.bike.inertiaRear;
        const wheelRadius = course.bike.wheelRadius;
        const inertia = inertiaFront + inertiaRear;
        return mKg + inertia / (wheelRadius * wheelRadius);
    }
}
