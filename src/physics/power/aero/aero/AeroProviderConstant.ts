import { CoursePhysics } from '../../../../types';
import { Path } from '../../../../Path';
import { AeroProvider } from './AeroProvider';

/**
 * Aerodynamic coefficient provider with constant values.
 *
 * This provider calculates the aerodynamic coefficient using the standard
 * formula based on cyclist parameters and air density from the course
 * configuration.
 *
 * Formula: aeroCoef = (Cd × A × ρ) / 2
 *
 * Where:
 * - Cd: Drag coefficient (from cyclist.cd, dimensionless)
 * - A: Frontal area (from cyclist.a, m²)
 * - ρ: Air density (from course.rho, kg/m³)
 *
 * This coefficient remains constant throughout the route, assuming:
 * - No position changes (same Cd and A)
 * - No altitude effects on air density
 * - No temperature or humidity variations
 *
 * The constant approach is suitable for:
 * - Routes with minimal elevation change
 * - Standard conditions analysis
 * - Performance comparisons at similar altitudes
 *
 * For routes with significant elevation gain, consider implementing a
 * variable provider that adjusts ρ based on altitude.
 *
 * Example calculation:
 * - Cd = 0.7 (typical road cyclist)
 * - A = 0.5 m² (frontal area)
 * - ρ = 1.225 kg/m³ (sea level)
 * - aeroCoef = (0.7 × 0.5 × 1.225) / 2 = 0.214 kg/m
 */
class AeroProviderConstant implements AeroProvider {
    /**
     * Calculates the constant aerodynamic coefficient.
     *
     * @param course The course configuration containing cyclist and environmental parameters
     * @param _path The path containing point data (unused)
     * @param _pointIndex The index of the current point (unused)
     * @returns Aerodynamic coefficient in kg/m
     */
    getAeroCoef(course: CoursePhysics, _path: Path, _pointIndex: number): number {
        return (course.cyclist.cd * course.cyclist.a * course.rho) / 2;
    }
}

export const aeroProviderConstant: AeroProvider = new AeroProviderConstant();
