import { CIRC, G } from '@/constants/';
import { Bike, Cyclist } from '@/types/models/';
import { Path } from '@/types/path/';
import { Vector3D } from '@/utils/';

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
                this.computeMaxSpeedByIncline(course, i - 1, i, i + 1);
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
    private static computeMaxSpeedByIncline(
        course: MaxSpeedCourse,
        prevIndex: number,
        currentIndex: number,
        nextIndex: number
    ): void {
        const path = course.path;
        const cyclist = course.cyclist;

        // Transform GPS coordinates to local Cartesian system
        const tPrev = this.transform(path, prevIndex, currentIndex);
        const tCurrent = new Vector3D(0, 0, 0); // Current point is origin
        const tNext = this.transform(path, nextIndex, currentIndex);

        // Find center of circle passing through the three points
        const circleCenter = this.getCircleCenter(tPrev, tCurrent, tNext);

        if (circleCenter === null) {
            path.setRadius(currentIndex, 150.0);
            // Points are collinear or identical - no turning constraint
            path.setSpeedMax(currentIndex, cyclist.getMaxSpeedMs());
            return;
        }

        // Calculate turning radius
        const radiusVector = circleCenter.subtract(tCurrent);
        let radius = Math.hypot(radiusVector.x, radiusVector.y);

        // Add 2m safety margin for trajectory uncertainty
        radius = radius + 2;

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

    /**
     * Find the center of a circle passing through three points.
     * Used to determine the turning radius for cornering speed calculations.
     *
     * Solves the system of linear equations to find the circumcenter.
     * Returns null if points are collinear (infinite radius).
     *
     * @param a First point (Vector3D)
     * @param b Second point (Vector3D)
     * @param c Third point (Vector3D)
     * @returns Circle center as Vector3D, or null if points are collinear
     */
    private static getCircleCenter(a: Vector3D, b: Vector3D, c: Vector3D): Vector3D | null {
        const ax = a.x,
            ay = a.y;
        const bx = b.x,
            by = b.y;
        const cx = c.x,
            cy = c.y;

        // Set up linear system for circumcenter calculation
        const A = bx - ax;
        const B = by - ay;
        const C = cx - ax;
        const D = cy - ay;

        const E = A * (ax + bx) + B * (ay + by);
        const F = C * (ax + cx) + D * (ay + cy);

        // Denominator of the solution
        const G = 2 * (A * (cy - by) - B * (cx - bx));

        if (Math.abs(G) < 0.001) {
            // Points are collinear (determinant ≈ 0)
            return null;
        }

        // Solve for circumcenter coordinates
        const px = (D * E - B * F) / G;
        const py = (A * F - C * E) / G;

        return new Vector3D(px, py, 0);
    }

    /**
     * Transform GPS coordinates to local Cartesian coordinates relative to a reference point.
     * Uses equirectangular projection for small distances (appropriate for cycling routes).
     *
     * Formula:
     * - x = (lon_diff / 360°) × circumference × cos(ref_lat)
     * - y = (lat_diff / 360°) × circumference
     *
     * @param path Path containing GPS coordinates
     * @param pointIndex Index of point to transform
     * @param refIndex Index of reference point (origin)
     * @returns Local Cartesian coordinates as Vector3D
     */
    private static transform(path: Path, pointIndex: number, refIndex: number): Vector3D {
        const lonRad = path.getLongitude(pointIndex) - path.getLongitude(refIndex);
        const latRad = path.getLatitude(pointIndex) - path.getLatitude(refIndex);

        // Convert radians to meters using Earth's circumference
        // latitude/longitude are already in radians, so direct scaling by circumference
        const x = (lonRad * CIRC * Math.cos(path.getLatitude(refIndex))) / (2 * Math.PI);
        const y = (latRad * CIRC) / (2 * Math.PI);

        return new Vector3D(x, y, 0);
    }
}
