import { PowerProvider } from '@/physics/power/';
import { CoursePhysics } from '@/types/course/';
import { Path, PointField } from '@/types/path/';

/**
 * Power provider for cyclist muscular power with drivetrain efficiency.
 *
 * This provider acts as a bridge between the cyclist's muscular power output
 * (from CyclistPowerProvider) and the actual power delivered to the wheel.
 *
 * **Power Flow:**
 * ```
 * Muscular Power → [Drivetrain Losses] → Wheel Power
 * ```
 *
 * **Process:**
 * 1. Get raw muscular power from cyclist power provider
 * 2. Apply drivetrain efficiency (typically ~97.6%)
 * 3. Return wheel power (what actually propels the bike)
 *
 * **Drivetrain Losses:**
 * - Chain friction: ~1-2%
 * - Derailleur pulleys: ~0.5-1%
 * - Bottom bracket: ~0.5%
 * - Total typical loss: ~2-4% (96-98% efficiency)
 *
 * The efficiency value comes from `course.bike.efficiency` and represents
 * a well-maintained modern drivetrain.
 *
 * **Debug Output:**
 * - `p_cyclist_raw`: Muscular power before efficiency losses
 * - `p_cyclist_wheel`: Wheel power after efficiency losses (returned value)
 *
 * This wheel power is what gets balanced against resistances (rolling, aero,
 * gravity, bearings) in the physics simulation.
 *
 * Example:
 * ```typescript
 * // With cyclist power = 250W, efficiency = 0.976
 * // p_cyclist_raw = 250W
 * // p_cyclist_wheel = 250W × 0.976 = 244W
 * // Lost to drivetrain: 6W
 * ```
 *
 * @see PowerProvider
 * @see CyclistPowerProvider
 */
class MuscularPowerProvider implements PowerProvider {
    /**
     * Calculates the wheel power from muscular power with drivetrain efficiency.
     *
     * Gets the cyclist's muscular power output and applies drivetrain
     * efficiency to calculate the actual power delivered to the wheel.
     *
     * @param course Course configuration with cyclist power provider and bike efficiency
     * @param path Path containing point data
     * @param pointIndex Index of current point
     * @returns Wheel power in watts (positive value, propulsive)
     */
    getPowerW(course: CoursePhysics, path: Path, pointIndex: number): number {
        // Get raw muscular power from cyclist power provider
        let w = course.cyclistPowerProvider.getPowerW(course, path, pointIndex);
        path.setField(pointIndex, PointField.P_CYCLIST_RAW, w);

        // Apply drivetrain efficiency
        w = w * course.bike.efficiency;
        path.setField(pointIndex, PointField.P_CYCLIST_WHEEL, w);

        return w;
    }
}

export const muscularPowerProvider: PowerProvider = new MuscularPowerProvider();
