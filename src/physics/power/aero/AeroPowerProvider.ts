import { PowerProvider, PowerProviderId } from '@/physics/power/';

import { CoursePhysicsInput } from '@/types/course/';
import { Path, PointField } from '@/types/path/';
import { Wind } from './wind';

/**
 * Provides aerodynamic drag power calculations for virtual cycling.
 *
 * Aerodynamic drag is the most significant resistance at higher speeds and
 * increases with the cube of velocity. This implementation includes:
 * - Standard aerodynamic drag formula
 * - Wind effects (headwind, tailwind, crosswind)
 * - Advanced wind model based on Isvan's research
 *
 * Basic Formula (no wind): P_aero = -aeroCoef × v³
 *
 * Where:
 * - aeroCoef = (Cd × A × ρ) / 2 (from AeroProvider)
 * - v: cyclist velocity (m/s)
 *
 * With Wind: Uses Isvan's power management model for lightweight vehicles
 * that accounts for the complex interaction between cyclist velocity and
 * wind velocity at different angles.
 *
 * The power loss is always negative (resistive) for headwinds and slower
 * speeds, but can be reduced (less negative) with tailwinds.
 *
 * @see PowerProvider
 * @see https://www.sheldonbrown.com/isvan/Power%20Management%20for%20Lightweight%20Vehicles.pdf
 */
class AeroPowerProvider implements PowerProvider<CoursePhysicsInput> {
    /**
     * Returns the power provider identifier.
     *
     * @returns The unique ID for this power provider
     */
    getId(): PowerProviderId {
        return 'aero';
    }

    /**
     * Calculates the aerodynamic drag power at a specific location.
     *
     * For no wind conditions, uses the standard cubic relationship.
     * With wind, applies Isvan's advanced model that accounts for:
     * - Wind angle relative to direction of travel
     * - Combined velocity effects
     * - Turbulence factor (mu = 1.2)
     *
     * @param course The course configuration with aero and wind providers
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @returns Aerodynamic drag power in watts (negative for resistance)
     */
    getPowerW(course: CoursePhysicsInput, path: Path, pointIndex: number): number {
        const aeroCoef = course.aeroProvider.getAeroCoef(course, path, pointIndex);
        path.setField(pointIndex, PointField.AERO_COEF, aeroCoef);

        const wind = course.windProvider.getWind(course, path, pointIndex);

        let p_air: number;

        if (wind.windSpeed === 0) {
            // No wind: standard aerodynamic drag formula
            const speed = path.getSpeed(pointIndex);
            p_air = -aeroCoef * speed * speed * speed;
        } else {
            // With wind: use advanced Isvan model
            p_air = this.computePAirWithWind(path, pointIndex, aeroCoef, wind);
        }

        path.setField(pointIndex, PointField.P_AERO, p_air);
        return p_air;
    }

    /**
     * Computes aerodynamic power with wind effects using Isvan's model.
     *
     * This advanced model accounts for:
     * - Wind speed and direction
     * - Cyclist bearing (direction of travel)
     * - Combined velocity vector effects
     * - Turbulence coefficient (mu = 1.2)
     *
     * The model is more accurate than simple vector addition because it
     * accounts for the complex aerodynamic interactions when wind and
     * cyclist motion combine at various angles.
     *
     * Reference: Isvan, O. (2011). "Power Optimization for the Propulsion
     * of Lightweight Vehicles." Section on aerodynamic power with wind.
     *
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @param aeroCoef The aerodynamic coefficient
     * @param wind The wind conditions
     * @returns Aerodynamic power in watts (negative for resistance)
     */
    private computePAirWithWind(
        path: Path,
        pointIndex: number,
        aeroCoef: number,
        wind: Wind
    ): number {
        const speed = path.getSpeed(pointIndex);
        const bearing = path.getBearing(pointIndex);

        // Store wind data for debugging/analysis
        path.setField(pointIndex, PointField.WIND_SPEED, wind.windSpeed);
        path.setField(pointIndex, PointField.WIND_DIRECTION, wind.windDirection);

        // Convert wind direction to bearing convention
        // Wind direction: 0 = North, π/2 = East
        // Bearing: 0 = East, π/2 = North (standard math convention)
        const windDirectionAsBearing = Math.PI / 2 - wind.windDirection;
        path.setField(pointIndex, PointField.WIND_BEARING, windDirectionAsBearing);

        // Calculate angle between wind and cyclist direction
        const alpha = windDirectionAsBearing - bearing;
        path.setField(pointIndex, PointField.WIND_ALPHA, alpha);

        const v = wind.windSpeed;

        // Isvan's power model for aerodynamic drag with wind
        // https://www.sheldonbrown.com/isvan/Power%20Management%20for%20Lightweight%20Vehicles.pdf

        // Component of combined velocity in direction of travel
        const l1 = speed + v * Math.cos(alpha);

        // Square of velocity component
        const l2 = l1 * l1;

        // Magnitude squared of combined velocity vector
        const l3 = speed * speed + v * v + 2 * speed * v * Math.cos(alpha);

        // Ratio of directional component to total magnitude
        const l4 = l2 / l3;

        // Turbulence factor: accounts for non-ideal flow conditions
        const mu = 1.2;

        // Lambda factor: weighted combination of ideal and turbulent flow
        const lambda = l4 + mu * (1 - l4);

        // Final power calculation with wind effects
        return -aeroCoef * lambda * Math.sqrt(l3) * l1 * speed;
    }
}

export const aeroPowerProvider: PowerProvider<CoursePhysicsInput> = new AeroPowerProvider();
