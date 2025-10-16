import { MINIMAL_SPEED } from '@/constants/';
import { PowerComputer } from '@/physics/power/';
import { CoursePhysics } from '@/types/course/';
import { Path } from '@/types/path/';
import { createLogger, Logger } from '@/utils/';

const logger: Logger = createLogger('physics/VirtualService');

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
 * 1. **Time-stepping loop**: Integrate physics from start to finish
 *    - Calculate power balance at each step
 *    - Determine distance traveled
 *    - Align with GPS waypoints or interpolate
 *    - Enforce maximum speed constraints
 * 2. **Post-processing**: Back-calculate cyclist power from speed profile
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
    static virtualizeTrack(course: CoursePhysics): Path {
        const equivalentMass = this.powerComputer.getEquivalentMass(course);

        const path = new Path(course.path.name);
        const inputPath = course.path;

        // Get distances array for binary search
        const dists = inputPath.getAllDistances();
        const distsLength = dists.length;

        // Initialize with first point at minimal speed
        let i = 0;
        let point = inputPath.getPointData(i);
        let speed = MINIMAL_SPEED;
        let time = new Date().getTime();
        const startTime = time;

        // Add first point
        path.addPoint({
            ...point,
            time: time,
            elapsed: 0,
            speed: speed,
            virtSpeedCurrent: speed,
        });

        i++;
        let iteration = 0;
        // Main simulation loop
        while (i < distsLength - 1) {
            const pSum = this.powerComputer.getNewPower(course, path, i - 1, true);
            const dx = inputPath.getDistance(i) - inputPath.getDistance(i - 1);
            let dt = this.powerComputer.getDt(pSum, equivalentMass, speed, dx);
            let speedNew = dx / dt;

            point = inputPath.getPointData(i);

            // Enforce maximum speed constraint
            const speedMax = point.speedMax;
            if (speedNew > speedMax) {
                speedNew = speedMax;
                // Recalculate time with constrained speed
                dt = dx / speedNew;
            }

            speed = speedNew;
            time += dt * 1000; // Convert seconds to milliseconds

            // Add simulated point
            path.addPoint({
                ...point,
                time: time,
                elapsed: time - startTime,
                dx: dx,
                dt: dt * 1000,
                speed: speed,
                virtSpeedCurrent: speed,
            });

            i++;
            // Safety check to avoid infinite loop
            if (iteration++ > 100000) {
                logger.warn('VirtualizeService: Simulation exceeded 100000 iterations, stopping');
                break;
            }
        }

        // Post-process: back-calculate cyclist power from speed changes
        for (let i = 0; i < path.length - 1; i++) {
            this.powerComputer.computeCyclistPower(course, path, equivalentMass, i);
        }

        path.computeDerivedData();

        return path;
    }
}
