import { CoursePhysics } from '../../../types';
import { Path } from '../../../Path';

/**
 * Interface for cyclist power output providers in virtual cycling simulations.
 *
 * CyclistPowerProvider implementations determine how much power the virtual
 * cyclist generates at each point along the route. Different implementations
 * support various power models:
 *
 * - **Constant Power**: Fixed wattage output (e.g., 250W sustained)
 * - **Power with Tiring**: Degrading power over time simulating fatigue
 * - **Power from Data**: Use existing power measurements from GPX data
 * - **Variable Power**: Training plans, intervals, or terrain-responsive power
 *
 * The power value returned represents the cyclist's muscular power output
 * before drivetrain losses. The MuscularPowerProvider applies efficiency
 * to convert this to wheel power.
 *
 * @see MuscularPowerProvider
 * @see CyclistPowerProviderBase
 */
export interface CyclistPowerProvider {
    /**
     * Gets the cyclist's power output at a specific location on the course.
     *
     * This is the raw muscular power before drivetrain efficiency losses.
     * The value may vary based on:
     * - Course conditions (grade, speed requirements)
     * - Elapsed time (fatigue effects)
     * - Existing data (if using measured power)
     * - Training zones or intervals
     *
     * @param course The course configuration with cyclist parameters
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @returns Cyclist power output in watts (positive value)
     */
    getPowerW(course: CoursePhysics, path: Path, pointIndex: number): number;
}
