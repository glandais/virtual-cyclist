import { CyclistPowerProviderBase } from './CyclistPowerProviderBase';
import { CoursePhysics } from '@/types/course/';
import { Path } from '@/types/path/';

/**
 * Cyclist power provider with constant power output.
 *
 * This provider returns a fixed power value from the cyclist configuration
 * throughout the entire route. The power is subject to:
 * - Harmonic variations (if enabled)
 * - Speed-based adjustments (from base class)
 *
 * Use this for:
 * - Steady-state efforts (tempo, threshold, endurance rides)
 * - FTP-based simulations
 * - Constant wattage scenarios
 *
 * The base power comes from `course.cyclist.power` which represents
 * the sustained power output capability of the cyclist.
 *
 * Example:
 * ```typescript
 * const provider = new PowerProviderConstant();
 * // With cyclist.power = 250W
 * // Returns ~250W throughout route (plus harmonics/speed adjustments)
 * ```
 *
 * @see CyclistPowerProviderBase
 * @see PowerProviderConstantWithTiring
 */
export class PowerProviderConstant extends CyclistPowerProviderBase {
    constructor(
        readonly power: number,
        useHarmonics: boolean
    ) {
        super(useHarmonics);
    }

    /**
     * Returns the constant power from cyclist configuration.
     *
     * @param course Course configuration with cyclist power setting
     * @param _path Path containing point data (unused)
     * @param _pointIndex Index of current point (unused)
     * @returns Cyclist's configured power output in watts
     */
    protected getOptimalPower(_course: CoursePhysics, _path: Path, _pointIndex: number): number {
        return this.power;
    }
}
