import { PowerComputer } from '@/physics/power/';
import { CoursePhysics } from '@/types/course/';
import { Path } from '@/types/path/';
import { CyclistPowerProvider } from './CyclistPowerProvider';
import { Harmonic } from './Harmonic';

/**
 * Abstract base class for cyclist power providers with advanced power modeling.
 *
 * This base class provides:
 * - **Harmonic power variations**: Simulates natural power output fluctuations
 * - **Speed-based power adjustment**: Adapts power based on current vs optimal speed
 * - **Tolerance-based control**: ±5% speed tolerance around optimal
 * - **Power scaling**: Up to 3x power when too slow, reduced power when too fast
 *
 * Subclasses must implement `getOptimalPower()` to define the baseline power
 * output strategy (constant, variable, data-driven, etc.).
 *
 * ## Harmonic Variations
 *
 * When harmonics are enabled (`course.cyclist.harmonics = true`), the power
 * output includes sinusoidal variations:
 *
 * ```
 * P'(t) = P + Σ(amp_i × P × cos(freq_i × t - phase_i))
 * ```
 *
 * This creates realistic power fluctuations mimicking:
 * - Pedal stroke asymmetries
 * - Breathing patterns
 * - Micro-adjustments in cycling position
 * - Natural physiological rhythms
 *
 * ## Speed-Based Power Adjustment
 *
 * The actual power output is adjusted based on how current speed compares
 * to the optimal speed for the given power and terrain:
 *
 * - **Within tolerance (±5%)**: Full optimal power
 * - **Too slow (< 95% optimal)**: Linear increase up to 3x power
 * - **Too fast (> 105% optimal)**: Linear decrease down to 0
 *
 * This models:
 * - Increased effort when speed drops (climbing, headwind)
 * - Reduced effort when speed exceeds target (coasting, tailwind)
 *
 * @see CyclistPowerProvider
 */
export abstract class CyclistPowerProviderBase implements CyclistPowerProvider {
    private static readonly TOLERANCE = 0.05; // ±5% speed tolerance
    private static readonly MAX_MULTIPLIER = 3.0; // Maximum power boost when too slow

    private readonly harmonics: Harmonic[];

    /**
     * Constructs the base provider with randomly generated harmonics.
     *
     * Generates 20 harmonic components with:
     * - Frequency: 1.0 to 10.0 rad/s
     * - Phase: 0 to π radians
     * - Amplitude: 0 to 0.01 (1% max variation)
     *
     * Uses crypto.getRandomValues() for secure random generation
     * (compatible with both browser and Node.js environments).
     */
    constructor(readonly useHarmonics: boolean) {
        this.harmonics = [];

        if (useHarmonics) {
            const randomArray = new Uint32Array(60); // 20 harmonics × 3 values each
            for (let i = 0; i < randomArray.length; i++) {
                randomArray[i] = Math.floor(Math.random() * 0xffffffff);
            }

            // Convert random values to harmonics
            for (let i = 0; i < 20; i++) {
                const freq = 1.0 + (randomArray[i * 3] / 0xffffffff) * 9.0; // 1.0 to 10.0
                const d = (randomArray[i * 3 + 1] / 0xffffffff) * Math.PI; // 0 to π
                const amp = (randomArray[i * 3 + 2] / 0xffffffff) * 0.01; // 0 to 0.01

                this.harmonics.push({ freq, d, amp });
            }
        }
    }

    /**
     * Abstract method to get the optimal power for current conditions.
     *
     * Subclasses implement this to define their power strategy:
     * - PowerProviderConstant: Returns fixed power from cyclist config
     * - PowerProviderConstantWithTiring: Applies fatigue factor
     * - PowerProviderFromData: Returns power from point data
     *
     * @param course Course configuration
     * @param path Path containing point data
     * @param pointIndex Index of current point
     * @returns Optimal power output in watts
     */
    protected abstract getOptimalPower(
        course: CoursePhysics,
        path: Path,
        pointIndex: number
    ): number;

    /**
     * Calculates the cyclist's power output with harmonics and speed adjustments.
     *
     * Process:
     * 1. Get optimal power from subclass
     * 2. Apply harmonic variations (if enabled)
     * 3. Calculate optimal speed for this power
     * 4. Adjust power based on current vs optimal speed
     *
     * @param course Course configuration
     * @param path Path containing point data
     * @param pointIndex Index of current point
     * @returns Adjusted cyclist power in watts
     */
    getPowerW(course: CoursePhysics, path: Path, pointIndex: number): number {
        let optimalPower = this.getOptimalPower(course, path, pointIndex);

        // Apply harmonic variations if enabled
        if (this.useHarmonics) {
            const timeMs = path.getTime(pointIndex);
            const x = timeMs / 10000.0; // Convert to scaled time for harmonics

            for (const harmonic of this.harmonics) {
                optimalPower +=
                    harmonic.amp * optimalPower * Math.cos(harmonic.freq * x - harmonic.d);
            }
        }
        // Store debug value
        path.setPCyclistProvidedOptimalPower(pointIndex, optimalPower);

        const powerNeeded = -PowerComputer.INSTANCE.getNewPower(course, path, pointIndex, false);
        path.setPCyclistPowerNeeded(pointIndex, powerNeeded);

        return optimalPower;
        // return this.getRealOptimalPower(course, path, pointIndex, optimalPower);
    }

    protected getRealOptimalPower(
        course: CoursePhysics,
        path: Path,
        pointIndex: number,
        optimalPower: number
    ): number {
        const powerNeeded = -PowerComputer.INSTANCE.getNewPower(course, path, pointIndex, false);
        path.setPCyclistPowerNeeded(pointIndex, powerNeeded);
        const minOptimalPower = optimalPower * (1 - CyclistPowerProviderBase.TOLERANCE);
        const maxOptimalPower = optimalPower * (1 + CyclistPowerProviderBase.TOLERANCE);
        // Adjust power based on speed
        if (minOptimalPower <= powerNeeded && powerNeeded <= maxOptimalPower) {
            // Within tolerance: use optimal power
            return optimalPower;
        } else if (powerNeeded < minOptimalPower) {
            // Too slow: increase power linearly up to MAX_MULTIPLIER
            // At 0 speed: MAX_MULTIPLIER × power
            // At minOptimalSpeed: 1.0 × power
            return (
                optimalPower * CyclistPowerProviderBase.MAX_MULTIPLIER -
                (powerNeeded / minOptimalPower) *
                    optimalPower *
                    (CyclistPowerProviderBase.MAX_MULTIPLIER - 1.0)
            );
        } else {
            // Too fast: reduce power linearly down to 0
            const diffPower = powerNeeded - maxOptimalPower;
            const coef = Math.min(1.0, Math.max(0.0, diffPower / maxOptimalPower));
            return optimalPower - coef * optimalPower;
        }
    }
}
