import { createLogger, Logger } from '@/utils/';

import { CoursePhysicsInput } from '@/types/course/';
import { OptimalSpeedService } from './OptimalSpeedService';

const logger: Logger = createLogger('physics/power/cyclist/OptimalSpeeds');

/**
 * Helper class for managing discretized ranges with ratio-based indexing.
 *
 * Used to create evenly-spaced grids for bearing, power, and grade values
 * in the optimal speed lookup table.
 */
class Ratio {
    readonly min: number;
    readonly max: number;
    readonly count: number;
    readonly ratio: number;

    constructor(min: number, max: number, count: number) {
        this.min = min;
        this.max = max;
        this.count = count;
        this.ratio = (max - min) / count;
    }

    /**
     * Gets the value at a specific grid index.
     */
    getValue(i: number): number {
        return this.min + i * this.ratio;
    }

    /**
     * Gets the grid index for a given value (clamped to range).
     */
    getIndex(value: number): number {
        const clamped = Math.max(this.min, Math.min(this.max, value));
        return Math.floor((clamped - this.min) / this.ratio);
    }

    /**
     * Iterates over all grid values, calling consumer for each index and value.
     */
    forValues(consumer: (index: number, value: number) => void): void {
        for (let i = 0; i <= this.count; i++) {
            consumer(i, this.getValue(i));
        }
    }
}

const bearingCount = 12;
const powerCount = 100;
const gradeCount = 400;

/**
 * Pre-computed lookup table for optimal cycling speeds.
 *
 * This class builds a 3D lookup table: bearing → power → grade → speed
 * that allows fast retrieval of optimal speeds during simulation without
 * expensive iterative calculations at each point.
 *
 * **Dimensions:**
 * - Bearing: 0 to π radians, 12 steps (~15° intervals)
 * - Power: 0 to 1000 watts, 100 steps (10W intervals)
 * - Grade: -20% to +20%, 400 steps (0.1% intervals)
 *
 * **Total entries:** 13 × 101 × 401 = ~526,000 speed values
 *
 * **Memory usage:** ~4 MB (Float64) for complete lookup table
 *
 * Pre-computation time depends on course configuration but typically
 * takes a few seconds for the complete table. This one-time cost
 * eliminates thousands of binary searches during simulation.
 *
 * @see OptimalSpeedService
 */
export class OptimalSpeeds {
    private static readonly bearingRatio = new Ratio(0, Math.PI, bearingCount);
    private static readonly powerRatio = new Ratio(0, 1000, powerCount);
    private static readonly gradeRatio = new Ratio(-0.2, 0.2, gradeCount);

    // 3D lookup: bearing index -> power index -> grade index -> speed (m/s)
    private readonly data: Float64Array = new Float64Array(bearingCount * powerCount * gradeCount);
    //private readonly speeds: Map<number, Map<number, Map<number, number>>>;

    /**
     * Constructs and pre-computes the optimal speed lookup table.
     *
     * This constructor performs all the expensive calculations upfront
     * by calling OptimalSpeedService.getSpeed() for every combination
     * of bearing, power, and grade values in the discretized grid.
     *
     */
    constructor() {
        this.data.fill(NaN);
    }

    private getIndex(bearingIndex: number, powerIndex: number, gradeIndex: number) {
        return bearingIndex * (powerCount * gradeCount) + powerIndex * gradeCount + gradeIndex;
    }

    /**
     * Retrieves the optimal speed from the lookup table.
     *
     * Uses nearest-neighbor lookup (no interpolation) for simplicity and speed.
     * The grid resolution is fine enough that interpolation provides minimal benefit.
     *
     * @param course Course configuration with cyclist and bike parameters
     * @param power Cyclist power output in watts (clamped to 0-1000W)
     * @param grade Road gradient (dimensionless, clamped to -0.2 to 0.2)
     * @param bearing Direction of travel in radians (clamped to 0-π)
     * @returns Optimal speed in m/s
     */
    getOptimalSpeed(
        course: CoursePhysicsInput,
        power: number,
        grade: number,
        bearing: number
    ): number {
        const bearingIndex = OptimalSpeeds.bearingRatio.getIndex(bearing);
        const powerIndex = OptimalSpeeds.powerRatio.getIndex(power);
        const gradeIndex = OptimalSpeeds.gradeRatio.getIndex(grade);

        const index = this.getIndex(bearingIndex, powerIndex, gradeIndex);
        if (isNaN(this.data[index])) {
            this.data[index] = OptimalSpeedService.INSTANCE.getSpeed(course, grade, power, bearing);
        }
        return this.data[index];
    }
}
