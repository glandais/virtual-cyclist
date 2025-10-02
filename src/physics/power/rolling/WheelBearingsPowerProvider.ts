import { PowerProvider } from '@/physics/power/';
import { Course } from '@/types/course/';
import { Path, PointField } from '@/types/path/';

/**
 * Provides wheel bearings friction power calculations for virtual cycling.
 *
 * Wheel bearings create mechanical resistance due to friction in the hubs.
 * This implementation uses an empirical model that accounts for both static
 * friction and speed-dependent dynamic friction.
 *
 * Formula: P_bearings = -v * (91 + 8.7 * v) / 1000
 *
 * Where:
 * - v: velocity in m/s
 * - Constants derived from empirical measurements of bicycle wheel bearings
 *
 * The model includes:
 * - Static component (91): Base friction independent of speed
 * - Dynamic component (8.7 * v): Speed-dependent friction losses
 * - Division by 1000: Unit conversion to watts
 *
 * This represents typical well-maintained cartridge bearings in bicycle wheels.
 * The power loss is always negative (resistive) and increases quadratically
 * with speed.
 *
 * @see PowerProvider
 * @see https://www.sheldonbrown.com/brandt/rolling-resistance.html
 */
class WheelBearingsPowerProvider implements PowerProvider {
    /**
     * Calculates the wheel bearings friction power at a specific location.
     *
     * Bearings friction is always negative (resistive force) and increases
     * with the square of speed due to the linear speed term multiplied by
     * the speed-dependent friction coefficient.
     *
     * At typical cycling speeds (5-15 m/s), this represents 5-20 watts of
     * power loss, which is small compared to aerodynamic drag but still
     * measurable.
     *
     * @param course The course configuration (not used for bearings calculation)
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @returns Wheel bearings friction power in watts (always negative or zero)
     */
    getPowerW(_course: Course, path: Path, pointIndex: number): number {
        const speed = path.getSpeed(pointIndex);

        // Calculate bearings friction power using empirical model
        // P = -v * (91 + 8.7 * v) / 1000
        const powerWheelBearings = (-speed * (91 + 8.7 * speed)) / 1000.0;

        // Store debug value in the point
        path.setField(pointIndex, PointField.P_WHEEL_BEARINGS, powerWheelBearings);

        return powerWheelBearings;
    }
}

export const wheelBearingsPowerProvider: PowerProvider = new WheelBearingsPowerProvider();
