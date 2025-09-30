import { CoursePhysicsInput, EMPTY_POINT, PointField } from '../../../types';
import { Path } from '../../../Path';
import { PowerProvider } from '../PowerProvider';
import { wheelBearingsPowerProvider } from '../rolling/WheelBearingsPowerProvider';
import { rollingResistancePowerProvider } from '../rolling/RollingResistancePowerProvider';
import { gravPowerProvider } from '../grav/GravPowerProvider';
import { aeroPowerProvider } from '../aero/AeroPowerProvider';

/**
 * Service for calculating optimal cycling speed given power and terrain conditions.
 *
 * Uses binary search to find the speed where cyclist power output exactly
 * balances all resistance forces (rolling, aerodynamic, gravitational, bearings).
 *
 * This is used to pre-compute lookup tables for optimal speed determination
 * during simulation, avoiding expensive iterative calculations at each point.
 *
 * The balance equation solved is:
 * P_cyclist = -(P_rolling + P_aero + P_gravity + P_bearings)
 *
 * Where all resistance powers are negative (consuming energy), so we search
 * for the speed where: -sum(resistances) = cyclist_power
 *
 * Binary search range: 0.1 m/s to 30 m/s (~0.4 km/h to ~108 km/h)
 * Convergence tolerance: 0.1 m/s
 *
 * Uses singleton pattern since it's stateless and can be shared.
 *
 * @see OptimalSpeeds
 */
export class OptimalSpeedService {
    static INSTANCE: OptimalSpeedService = new OptimalSpeedService();

    private readonly powerProviders: PowerProvider<CoursePhysicsInput>[] = [
        wheelBearingsPowerProvider,
        rollingResistancePowerProvider,
        aeroPowerProvider,
        gravPowerProvider,
    ];
    private readonly path: Path;

    private constructor() {
        // Create a temporary single-point path for calculation
        this.path = new Path('temp');
        this.path.addPoint(EMPTY_POINT);
    }

    /**
     * Calculates the optimal speed for given power, grade, and bearing.
     *
     * Creates a temporary point with the specified conditions and searches
     * for the speed that balances power and resistances.
     *
     * @param course The course configuration with cyclist and bike parameters
     * @param grade Road gradient (dimensionless, e.g., 0.05 for 5%)
     * @param power Cyclist power output in watts
     * @param bearing Direction of travel in radians
     * @returns Optimal speed in m/s
     */
    getSpeed(course: CoursePhysicsInput, grade: number, power: number, bearing: number): number {
        this.path.setGrade(0, grade);
        this.path.setBearing(0, bearing);
        return this.getSpeedRecursive(course, power, 0.1, 30);
    }

    /**
     * Recursive binary search to find optimal speed.
     *
     * Searches for speed where: -sum(resistance_powers) = cyclist_power
     *
     * @param path Temporary path with point to calculate
     * @param course Course configuration
     * @param power Target cyclist power in watts
     * @param min Minimum speed bound in m/s
     * @param max Maximum speed bound in m/s
     * @returns Optimal speed in m/s
     */
    private getSpeedRecursive(
        course: CoursePhysicsInput,
        power: number,
        min: number,
        max: number
    ): number {
        const average = (min + max) / 2;

        // Converged: return average
        if (Math.abs(min - max) < 0.1) {
            return average;
        }

        // Set trial speed
        this.path.setField(0, PointField.SPEED, average);

        // Calculate total resistance power at this speed
        let pSum = 0.0;
        for (const powerProvider of this.powerProviders) {
            pSum += powerProvider.getPowerW(course, this.path, 0);
        }

        // Resistance powers are negative, so -pSum is the power needed
        // If needed power > available power, speed is too high
        if (-pSum > power) {
            // Need more power than available: search lower speeds
            return this.getSpeedRecursive(course, power, min, average);
        } else {
            // Have excess power: search higher speeds
            return this.getSpeedRecursive(course, power, average, max);
        }
    }
}
