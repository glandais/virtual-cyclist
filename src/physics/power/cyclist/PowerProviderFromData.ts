import { CyclistPowerProvider } from './CyclistPowerProvider';
import { CoursePhysics } from '@/types/course/';
import { Path } from '@/types/path/';

/**
 * Cyclist power provider that uses existing power data from GPX points.
 *
 * This provider reads power measurements directly from the point data,
 * typically from:
 * - Recorded rides with power meter data
 * - Previously simulated routes
 * - Imported training files with power measurements
 *
 * Unlike other power providers, this does NOT apply:
 * - Harmonic variations
 * - Speed-based adjustments
 * - Optimal power calculations
 *
 * It simply returns the raw power value stored in the point, making it
 * suitable for:
 * - Replaying actual rides
 * - Analyzing recorded power data
 * - Comparing virtual vs actual performance
 * - Training analysis and validation
 *
 * **Note:** The power field must contain valid data (not NaN) for this
 * provider to work correctly. If power data is missing, the simulation
 * results will be invalid.
 *
 * Example:
 * ```typescript
 * const provider = new PowerProviderFromData();
 * // Returns whatever power value is stored in each point
 * // No modifications or calculations applied
 * ```
 *
 * @see CyclistPowerProvider
 * @see CyclistPowerProviderBase
 */
class PowerProviderFromData implements CyclistPowerProvider {
    /**
     * Returns the power value stored in the point data.
     *
     * This is the raw power measurement without any modifications.
     *
     * @param _course Course configuration (unused)
     * @param path Path containing point data
     * @param pointIndex Index of current point
     * @returns Power from point data in watts
     */
    getPowerW(_course: CoursePhysics, path: Path, pointIndex: number): number {
        return path.getPInputPower(pointIndex);
    }
}

export const powerProviderFromData: CyclistPowerProvider = new PowerProviderFromData();
