import { Course } from '@/types/course/';
import { Path } from '@/types/path/';

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
export interface AeroProvider {
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
