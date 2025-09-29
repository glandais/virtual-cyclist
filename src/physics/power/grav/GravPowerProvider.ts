import { Course, CoursePhysicsInput, PointField } from '../../../types';
import { G } from '../../../constants';
import { PowerProvider, PowerProviderId } from '../PowerProvider';
import { Path } from '../../../Path';

/**
 * Provides gravitational power calculations for virtual cycling.
 *
 * Gravitational power represents the work done against (or with) gravity when
 * climbing or descending. This implementation follows the standard physics
 * model for gravitational potential energy rate of change.
 *
 * Formula: P_gravity = -m * g * v * sin(atan(grade))
 *
 * Where:
 * - m: total system mass (cyclist + bike) in kg
 * - g: gravitational acceleration (9.8 m/s²)
 * - v: velocity in m/s
 * - grade: road gradient (dimensionless, e.g., 0.05 for 5%)
 *
 * The sine term converts the grade to the vertical velocity component.
 * For small angles: sin(atan(grade)) ≈ grade / sqrt(1 + grade²) ≈ grade
 *
 * Sign convention:
 * - Negative power (resistance) when climbing (positive grade)
 * - Positive power (assistance) when descending (negative grade)
 *
 * @see PowerProvider
 * @see Martin, J.C., et al. (1998). "Validation of a mathematical model for road cycling power."
 */
class GravPowerProvider implements PowerProvider<CoursePhysicsInput> {
    /**
     * Returns the power provider identifier.
     *
     * @returns The unique ID for this power provider
     */
    getId(): PowerProviderId {
        return 'gravity';
    }

    /**
     * Calculates the gravitational power at a specific location.
     *
     * Gravitational power is the most significant resistance factor on climbs
     * and can provide significant assistance on descents. For a typical 80kg
     * cyclist+bike system:
     * - 5% grade at 5 m/s (18 km/h): ~196W resistance
     * - 10% grade at 5 m/s: ~392W resistance
     *
     * @param course The course configuration containing cyclist mass
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @returns Gravitational power in watts (negative=climbing, positive=descending)
     */
    getPowerW(course: Course, path: Path, pointIndex: number): number {
        const mKg = course.cyclist.mKg;
        const grade = path.getGrade(pointIndex);
        const speed = path.getSpeed(pointIndex);

        // Calculate the sine of the road angle from grade
        // For small angles: sin(atan(grade)) ≈ grade / sqrt(1 + grade²)
        const coef = Math.sin(Math.atan(grade));

        // Calculate gravitational power
        // Negative when climbing (doing work against gravity)
        // Positive when descending (gravity doing work)
        const powerGravity = -mKg * G * speed * coef;

        // Store debug value in the point
        path.setField(pointIndex, PointField.P_GRAVITY, powerGravity);

        return powerGravity;
    }
}

export const gravPowerProvider: PowerProvider<CoursePhysicsInput> = new GravPowerProvider();
