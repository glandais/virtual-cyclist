import { CyclistPowerProviderBase } from './CyclistPowerProviderBase';
import { CoursePhysics } from '@/types/course/';
import { Path } from '@/types/path/';

/**
 * Cyclist power provider with constant power that degrades over time (fatigue).
 *
 * This provider simulates the effects of muscular fatigue during long efforts
 * by applying a time-based power reduction factor. The power decreases linearly
 * from 100% at start to 50% at the specified duration.
 *
 * **Fatigue Model:**
 * ```
 * coefficient = max(0.5, 1 - 0.6 × (elapsed_time / duration))
 * power = base_power × coefficient
 * ```
 *
 * **Power Progression:**
 * - At start (0% duration): 100% power
 * - At 25% duration: 85% power
 * - At 50% duration: 70% power
 * - At 75% duration: 55% power
 * - At 100%+ duration: 50% power (minimum, constant thereafter)
 *
 * The model simulates:
 * - Glycogen depletion
 * - Muscular fatigue accumulation
 * - Mental fatigue effects
 * - Reduced neuromuscular efficiency
 *
 * Use this for:
 * - Long endurance rides (>1 hour)
 * - Ultra-distance simulations
 * - Realistic multi-hour efforts
 * - Testing pacing strategies
 *
 * Example:
 * ```typescript
 * // 3-hour ride with fatigue
 * const provider = new PowerProviderConstantWithTiring(3 * 3600); // 3 hours in seconds
 * // With cyclist.power = 250W
 * // Start: 250W, 1.5hr: 175W, 3hr+: 125W
 * ```
 *
 * @see PowerProviderConstant
 * @see CyclistPowerProviderBase
 */
export class PowerProviderConstantWithTiring extends CyclistPowerProviderBase {
    /**
     * Creates a power provider with time-based fatigue.
     *
     * @param duration Duration in seconds after which power stabilizes at 50%
     *                 Typical values: 3600 (1hr), 7200 (2hr), 10800 (3hr)
     */
    constructor(
        readonly power: number,
        useHarmonicsIn: boolean,
        readonly duration: number
    ) {
        super(useHarmonicsIn);
    }

    /**
     * Returns power adjusted for elapsed time fatigue.
     *
     * Applies fatigue factor to the base constant power:
     * - Power decreases linearly with time
     * - Minimum power is 50% of base power
     * - Fatigue stabilizes after specified duration
     *
     * @param course Course configuration
     * @param path Path containing point data
     * @param pointIndex Index of current point
     * @returns Fatigue-adjusted power in watts
     */
    protected getOptimalPower(_course: CoursePhysics, path: Path, pointIndex: number): number {
        const powerW = this.power;
        const elapsedSeconds = path.getElapsed(pointIndex) / 1000; // Convert ms to seconds

        // Calculate fatigue coefficient
        // c = max(0.5, 1 - 0.6 * (elapsed / duration))
        const c = Math.max(0.5, 1 - (0.6 * elapsedSeconds) / this.duration);

        return powerW * c;
    }
}
