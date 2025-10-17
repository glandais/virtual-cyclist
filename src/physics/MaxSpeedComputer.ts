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

const MAX_RADIUS = 200;

/**
 * MaxSpeedComputer calculates maximum safe speeds for cycling based on:
 * 1. Cornering physics (lean angle limits)
 * 2. Braking constraints (deceleration limits)
 *
 * Uses a single backward pass algorithm that combines both constraints:
 * - For each point (working backwards): compute v_max = min(cornering_limit, braking_limit)
 * - Cornering limit: v = √(g × radius × tan(max_lean_angle))
 * - Braking limit: max speed that can safely brake to next point's speed
 *
 * Based on bicycle dynamics and physics research.
 */
export class MaxSpeedComputer {
    private constructor() {}

    /**
     * Compute maximum safe speeds for all points in the course.
     *
     * Single backward pass: Calculate maximum speeds based on both cornering physics
     * and braking constraints. Works backwards through the path, ensuring each point's
     * speed is limited by both local geometry (cornering) and ability to brake to
     * the next point's speed.
     *
     * At each point i: v_max[i] = min(cornering_limit[i], max_speed_can_brake_to_v[i+1])
     *
     * @param course Course containing path, cyclist, and bike parameters
     */
    static computeMaxSpeeds(course: MaxSpeedCourse): void {
        const path = course.path;
        const pointCount = path.getPointCount();

        // Start from the end and work backwards
        for (let i = pointCount - 1; i >= 0; i--) {
            if (i === pointCount - 1) {
                // Last point: stop (2 m/s minimum for stability)
                path.setSpeedMax(i, 2);
            } else {
                // Compute cornering speed limit for this point
                const corneringLimit = this.computeCorneringLimit(course, i);

                // Compute maximum speed that can brake to next point's speed
                const brakingLimit = this.computeBrakingLimit(course, i, i + 1);

                // Final speed is the minimum of both constraints
                path.setSpeedMax(i, Math.min(corneringLimit, brakingLimit));
            }
        }
        course.path.computeDerivedData();
    }

    /**
     * Compute maximum cornering speed limit for a point based on turning radius
     * and lean angle physics.
     *
     * Uses bicycle dynamics: v_max = √(g × radius × tan(max_lean_angle))
     *
     * @param course Course containing cyclist parameters
     * @param currentIndex Index of current point
     * @returns Maximum speed limited by cornering physics
     */
    private static computeCorneringLimit(course: MaxSpeedCourse, currentIndex: number): number {
        const path = course.path;
        const cyclist = course.cyclist;

        const radius = this.computeRadiusWindowed(path, currentIndex, 10);

        // Calculate maximum cornering speed using bicycle dynamics
        // v_max = √(g × radius × tan(max_lean_angle))
        const vMax = Math.sqrt(G * radius * cyclist.getTanMaxAngle());

        // Return the smaller of cornering limit or cyclist's absolute max speed
        const result = Math.min(cyclist.getMaxSpeedMs(), vMax);
        path.setSpeedMaxIncline(currentIndex, result);
        return result;
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
            // Store radius for debugging/analysis
            path.setRadius(i, MAX_RADIUS);
            return MAX_RADIUS;
        }

        const radius = totalDistance / Math.abs(totalBearingChange);
        const result = Math.max(5, Math.min(MAX_RADIUS, radius));
        // Store radius for debugging/analysis
        path.setRadius(i, result);
        return result;
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
     * Compute maximum speed at a point that allows safe braking to the next point.
     * Uses kinematic equation to determine the maximum initial velocity that can
     * decelerate to the target velocity within the available distance.
     *
     * Formula: v₀ = √(vf² + 2 × a × distance)
     * where a is the braking deceleration (positive value)
     *
     * @param course Course containing cyclist braking parameters
     * @param currentIndex Index of current point (where we're computing max speed)
     * @param nextIndex Index of next point (target speed to brake to)
     * @returns Maximum speed that can safely brake to next point's speed
     */
    private static computeBrakingLimit(
        course: MaxSpeedCourse,
        currentIndex: number,
        nextIndex: number
    ): number {
        const path = course.path;
        const cyclist = course.cyclist;

        const vf = path.getSpeedMax(nextIndex); // Target speed at next point
        const a = cyclist.getMaxBrakeMS2(); // Braking deceleration (positive value)

        // Distance available for braking
        const distance = path.getDistance(nextIndex) - path.getDistance(currentIndex);

        // Calculate maximum initial speed that can brake to vf in the available distance
        // Using kinematic equation: v0² = vf² + 2×a×distance
        const maxSpeed = Math.sqrt(vf * vf + 2 * a * distance);

        return maxSpeed;
    }
}
