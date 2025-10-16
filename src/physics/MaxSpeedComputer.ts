import { G } from '@/constants/';
import { Bike, Cyclist } from '@/types/models/';
import { Path } from '@/types/path/';

/**
 * Course configuration for MaxSpeedComputer using actual class instances
 */
export interface MaxSpeedCourse {
    readonly path: Path;
    readonly cyclist: Cyclist;
    readonly bike: Bike;
}

/**
 * MaxSpeedComputer calculates maximum safe speeds for cycling based on:
 * 1. Cornering physics (lean angle limits)
 * 2. Braking constraints (deceleration limits)
 *
 * Uses a two-pass algorithm:
 * - Forward pass: Compute cornering speed limits using circle geometry
 * - Reverse pass: Apply braking constraints working backwards
 *
 * Based on bicycle dynamics and physics research.
 */
export class MaxSpeedComputer {
    private constructor() {}

    /**
     * Compute maximum safe speeds for all points in the course.
     *
     * @param course Course containing path, cyclist, and bike parameters
     */
    static computeMaxSpeeds(course: MaxSpeedCourse): void {
        // First pass, forward: max speed by incline/cornering
        this.firstPass(course);

        // Second pass, reverse: max speed with braking constraints
        this.secondPass(course);
        course.path.computeDerivedData();
    }

    /**
     * First pass: Calculate maximum cornering speeds based on lean angle physics.
     * Works forward through the path, computing speeds limited by turning radius.
     *
     * Formula: v_max = √(g × radius × tan(max_lean_angle))
     *
     * @param course Course to process
     */
    protected static firstPass(course: MaxSpeedCourse): void {
        const path = course.path;
        const cyclist = course.cyclist;
        const pointCount = path.getPointCount();

        for (let i = 0; i < pointCount; i++) {
            if (i === 0) {
                // First point: use cyclist's maximum speed
                path.setSpeedMax(i, cyclist.getMaxSpeedMs());
            } else if (i === pointCount - 1) {
                // Last point: stop (2 m/s minimum for stability)
                path.setSpeedMax(i, 2);
            } else {
                // Middle points: compute max speed based on cornering
                this.computeMaxSpeedByIncline(course, i);
            }

            // Store the incline-limited speed for debugging
            path.setSpeedMaxIncline(i, path.getSpeedMax(i));
        }
    }

    /**
     * Second pass: Apply braking constraints working backwards through the path.
     * Ensures that the cyclist can brake safely from any speed to the required
     * speed at the next point.
     *
     * @param course Course to process
     */
    protected static secondPass(course: MaxSpeedCourse): void {
        const path = course.path;
        const pointCount = path.getPointCount();

        for (let i = pointCount - 1; i > 0; i--) {
            this.computeMaxSpeedByBraking(course, i - 1, i);
        }
    }

    private static computeRadiusWindowed(path: Path, i: number, k = 2): number {
        const mini = Math.max(0, i - k);
        const maxi = Math.min(path.length - 1, i + k);
        // Sum bearing changes over window
        const totalBearingChange = this.normalizeAngleDiff(
            path.getBearing(maxi) - path.getBearing(mini)
        );

        // Total distance over window
        const totalDistance = path.getDistance(maxi) - path.getDistance(mini);

        if (Math.abs(totalBearingChange) < 0.001) {
            return 150;
        }

        const radius = totalDistance / Math.abs(totalBearingChange);
        return Math.max(5, Math.min(150, radius));
    }

    private static normalizeAngleDiff(angle: number): number {
        // Wrap to [-π, π] to handle bearing wraparound
        while (angle > Math.PI) {
            angle -= 2 * Math.PI;
        }
        while (angle < -Math.PI) {
            angle += 2 * Math.PI;
        }
        return angle;
    }

    /**
     * Compute maximum cornering speed for a point based on the turning radius
     * defined by three consecutive points (previous, current, next).
     *
     * Uses bicycle dynamics: v_max = √(g × radius × tan(max_lean_angle))
     *
     * @param course Course containing cyclist parameters
     * @param prevIndex Index of previous point
     * @param currentIndex Index of current point
     * @param nextIndex Index of next point
     */
    private static computeMaxSpeedByIncline(course: MaxSpeedCourse, currentIndex: number): void {
        const path = course.path;
        const cyclist = course.cyclist;

        const radius = this.computeRadiusWindowed(path, currentIndex, 10);

        // Store radius for debugging/analysis
        path.setRadius(currentIndex, radius);

        // Calculate maximum cornering speed using bicycle dynamics
        // v_max = √(g × radius × tan(max_lean_angle))
        const vMax = Math.sqrt(G * radius * cyclist.getTanMaxAngle());

        // Apply the smaller of cornering limit or cyclist's absolute max speed
        path.setSpeedMax(currentIndex, Math.min(cyclist.getMaxSpeedMs(), vMax));
    }

    /**
     * Apply braking constraint between two consecutive points.
     * Ensures that the cyclist can brake from the previous point's speed
     * to the current point's required speed within the available distance.
     *
     * Uses kinematic equation: v₀² = v_f² + 2 × a × distance
     *
     * @param course Course containing cyclist parameters
     * @param prevIndex Index of previous point
     * @param currentIndex Index of current point
     */
    private static computeMaxSpeedByBraking(
        course: MaxSpeedCourse,
        prevIndex: number,
        currentIndex: number
    ): void {
        const path = course.path;
        const cyclist = course.cyclist;

        const v0 = path.getSpeedMax(prevIndex); // Current speed at previous point
        const vf = path.getSpeedMax(currentIndex); // Required speed at current point
        const a = -cyclist.getMaxBrakeMS2(); // Braking deceleration (negative)

        if (vf >= v0) {
            // No braking needed (target speed is higher or equal)
            return;
        }

        // Distance available for braking
        const distance = path.getDistance(currentIndex) - path.getDistance(prevIndex);

        // Check if we can brake from v0 to vf in the available distance
        // Using kinematic equation: vf² = v0² + 2×a×d
        // Rearranging: required_distance = (vf² - v0²) / (2×a)
        const requiredDistance = (vf * vf - v0 * v0) / (2 * a);

        if (requiredDistance <= distance) {
            // Sufficient distance available for braking
            return;
        }

        // Insufficient distance - reduce the maximum speed at previous point
        // Solve for maximum v0: v0² = vf² - 2×a×distance (a is negative)
        const newMaxSpeedPrevious = Math.sqrt(vf * vf - 2 * a * distance);
        path.setSpeedMax(prevIndex, newMaxSpeedPrevious);
    }
}
