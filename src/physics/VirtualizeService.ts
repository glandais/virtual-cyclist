import { DT, MINIMAL_SPEED } from '@/constants/';
import { PowerComputer } from '@/physics/power/';
import { OptimalSpeeds } from '@/physics/power/cyclist/';
import { CoursePhysics, CoursePhysicsInput } from '@/types/course/';
import { Path } from '@/types/path/';

/**
 * Main simulation service for virtualizing GPS routes with physics-based cycling.
 *
 * This service transforms a static GPS route into a realistic cycling simulation by:
 * - Computing optimal speeds for all terrain/power combinations
 * - Integrating physics equations over time
 * - Aligning simulated trajectory with GPS waypoints
 * - Back-calculating cyclist power from speed changes
 *
 * ## Algorithm Overview
 *
 * 1. **Pre-computation**: Build OptimalSpeeds lookup table (~526k entries)
 * 2. **Time-stepping loop**: Integrate physics from start to finish
 *    - Calculate power balance at each step
 *    - Determine distance traveled
 *    - Align with GPS waypoints or interpolate
 *    - Enforce maximum speed constraints
 * 3. **Post-processing**: Back-calculate cyclist power from speed profile
 *
 * ## GPS Waypoint Alignment
 *
 * The simulation stays on the actual GPS route by:
 * - Using binary search to find current segment
 * - Snapping to waypoints when crossing them
 * - Interpolating position between waypoints
 *
 * This ensures the virtual cyclist follows the exact recorded path.
 *
 * @see PowerComputer
 * @see OptimalSpeeds
 */
export class VirtualizeService {
    private static readonly powerComputer: PowerComputer = PowerComputer.INSTANCE;

    /**
     * Virtualizes a GPS track using physics-based simulation.
     *
     * Transforms a static GPS route into a realistic cycling simulation with:
     * - Accurate time predictions based on power and terrain
     * - Speed profiles that respect physics and max speed limits
     * - Power estimates from speed changes
     *
     * The original path points are replaced with simulated points that have
     * physically consistent speeds, times, and power values.
     *
     * @param course Course configuration with path, cyclist, and bike parameters
     */
    static virtualizeTrack(courseInput: CoursePhysicsInput): Path {
        // Pre-compute optimal speeds lookup table
        const optimalSpeeds = new OptimalSpeeds(courseInput);
        const course: CoursePhysics = { ...courseInput, optimalSpeeds };

        const equivalentMass = this.powerComputer.getEquivalentMass(course);

        const newPath = new Path(course.path.name);
        const inputPath = course.path;

        // Get distances array for binary search
        const dists = inputPath.getAllDistances();
        const distsLength = dists.length;
        const totalDistance = inputPath.getTotalDistance();

        // Initialize with first point at minimal speed
        let currentPoint = inputPath.getPointData(0);
        let currentDist = 0;
        let currentSpeed = MINIMAL_SPEED;
        let currentTime = new Date().getTime();
        const startTime = currentTime;

        // Add first point
        newPath.addPoint({
            ...currentPoint,
            dist: currentDist,
            time: currentTime,
            elapsed: 0,
            speed: currentSpeed,
        });

        // Main simulation loop
        while (currentDist < totalDistance) {
            // Find current segment index
            const index = this.getIndex(dists, distsLength, currentDist);

            // Calculate power balance and distance for time step
            const pSum = this.powerComputer.getNewPower(course, newPath, newPath.length - 1, true);
            const dx = this.powerComputer.getDx(pSum, equivalentMass, currentSpeed, DT);

            // Determine if we cross to next waypoint
            const newIndex = this.getNextIndex(dists, distsLength, currentDist, dx);

            let dxToNext: number;
            let dtToNext: number;

            if (index !== newIndex) {
                // Crossing waypoint - snap to it
                dxToNext = inputPath.getDistance(newIndex) - currentDist;
                dtToNext = this.powerComputer.getDt(pSum, equivalentMass, currentSpeed, dxToNext);
                currentPoint = inputPath.getPointData(newIndex);
                currentDist = inputPath.getDistance(newIndex);
            } else {
                // Interpolate between waypoints
                dxToNext = dx;
                dtToNext = DT;

                const newDist = currentDist + dx;
                const p1dist = inputPath.getDistance(index);
                const p2dist = inputPath.getDistance(index + 1);
                const coef = (newDist - p1dist) / (p2dist - p1dist);

                currentPoint = inputPath.interpolatePoint(index, index + 1, coef);
                currentDist = newDist;
            }

            // Calculate new speed using trapezoidal rule
            let speedNew = 2 * (dxToNext / dtToNext) - currentSpeed;

            // Enforce maximum speed constraint
            const speedMax = currentPoint.speedMax;
            if (speedNew > speedMax) {
                speedNew = speedMax;
                // Recalculate time with constrained speed
                dtToNext = (2 * dxToNext) / (currentSpeed + speedNew);
            }

            currentSpeed = speedNew;
            currentTime += dtToNext * 1000; // Convert seconds to milliseconds

            // Add simulated point
            newPath.addPoint({
                ...currentPoint,
                dist: currentDist,
                time: currentTime,
                elapsed: currentTime - startTime,
                speed: currentSpeed,
            });

            // Safety check to avoid infinite loop
            if (newPath.length > inputPath.length * 10) {
                console.warn(
                    'VirtualizeService: Simulation exceeded 10x original points, stopping'
                );
                break;
            }
        }

        // Post-process: back-calculate cyclist power from speed changes
        for (let i = 0; i < newPath.length - 1; i++) {
            const cyclistPower = this.powerComputer.computeCyclistPower(
                course,
                newPath,
                equivalentMass,
                i,
                i + 1
            );
            // Set power on current point
            newPath.setField(i, 8, cyclistPower); // PointField.POWER = 8
        }
        newPath.computeDerivedData();
        return newPath;
    }

    /**
     * Binary search to find the next waypoint index after traveling distance dx.
     *
     * @param dists Array of cumulative distances
     * @param distsLength Length of dists array
     * @param dist Current distance
     * @param dx Distance to travel
     * @returns Index of next waypoint, or current index if not crossing
     */
    private static getNextIndex(
        dists: Float64Array,
        distsLength: number,
        dist: number,
        dx: number
    ): number {
        const i1 = this.getIndex(dists, distsLength, dist);
        const i2 = this.getIndex(dists, distsLength, dist + dx);
        if (i1 !== i2) {
            return i1 + 1;
        }
        return i1;
    }

    /**
     * Binary search to find the waypoint index at or before the given distance.
     *
     * @param dists Array of cumulative distances
     * @param distsLength Length of dists array
     * @param dist Target distance
     * @returns Index of waypoint at or before dist, or -1 if not found
     */
    private static getIndex(dists: Float64Array, distsLength: number, dist: number): number {
        let left = 0;
        let right = distsLength - 1;

        while (left <= right) {
            const mid = left + Math.floor((right - left) / 2);

            if (dists[mid] <= dist && (mid === distsLength - 1 || dist < dists[mid + 1])) {
                return mid;
            }

            if (dists[mid] < dist) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1;
    }
}
