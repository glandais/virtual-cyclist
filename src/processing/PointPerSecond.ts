import { Path } from '../Path';
import { Point } from '../types';
import { Paths } from '../types';

/**
 * Service for resampling GPS tracks to ensure one point per second.
 *
 * This class processes GPS tracks to create uniform temporal resolution by:
 * - Interpolating points between existing track points
 * - Ensuring exactly one point exists at each epoch second
 * - Preserving all point properties during interpolation
 *
 * Algorithm:
 * 1. For each segment between consecutive points:
 *    - If points span multiple seconds, interpolate points at each epoch second
 *    - Use linear interpolation weighted by time distance
 * 2. Special handling for first/last points if not on epoch boundary
 *
 * Based on GPXPerSecond.java from gpx2web project.
 *
 * Use cases:
 * - Standardizing GPS tracks from different devices with varying sampling rates
 * - Preparing data for time-series analysis requiring uniform intervals
 * - Synchronizing multiple GPS tracks to common time resolution
 *
 * @example
 * ```typescript
 * const perSecond = new GPXPerSecond();
 * const paths: Paths = parser.parse(gpxContent);
 * paths.tracks.forEach(track => {
 *   perSecond.computeOnePointPerSecond(track);
 * });
 * ```
 */
export class PointPerSecond {
    private constructor() {}
    /**
     * Resamples a single path to ensure one point per second.
     *
     * Creates a new path with interpolated points at exact epoch second boundaries.
     *
     * @param path The path to resample
     * @returns A new path with one point per second
     */
    static computeOnePointPerSecond(path: Path): Path {
        const originalCount = path.getPointCount();
        if (originalCount === 0) {
            return new Path(path.name);
        }

        // Build map of new points at epoch seconds
        const newPointsMap = new Map<number, InterpolationData>();

        for (let i = 0; i < originalCount; i++) {
            const time1 = path.getTime(i);
            const epochSec1 = Math.floor(time1 / 1000);
            const msInSec1 = time1 % 1000;

            // First point - add copy at start of second if not on epoch boundary
            if (i === 0) {
                if (msInSec1 !== 0) {
                    this.addPointToMap(newPointsMap, epochSec1, { type: 'copy', index: i });
                }
            }

            // Last point - add copy at end of second if not on epoch boundary
            if (i === originalCount - 1) {
                if (msInSec1 !== 0) {
                    this.addPointToMap(newPointsMap, epochSec1 + 1, { type: 'copy', index: i });
                }
            } else {
                const time2 = path.getTime(i + 1);
                const epochSec2 = Math.floor(time2 / 1000);

                // Points span different seconds
                if (epochSec1 !== epochSec2) {
                    const duration12 = time2 - time1; // Duration in milliseconds

                    // Determine epoch range to fill
                    const epochStart = msInSec1 === 0 ? epochSec1 : epochSec1 + 1;
                    const epochEnd = epochSec2;

                    // Create interpolated points for each epoch second in range
                    for (let epoch = epochStart; epoch <= epochEnd; epoch++) {
                        const epochTime = epoch * 1000; // Convert to milliseconds
                        const timeToEpoch = epochTime - time1;

                        // Interpolation coefficient (0.0 to 1.0)
                        const coef = timeToEpoch / duration12;

                        this.addPointToMap(newPointsMap, epoch, {
                            type: 'interpolate',
                            index1: i,
                            index2: i + 1,
                            coef,
                        });
                    }
                }
            }
        }

        // Create and return new path with resampled points
        return this.createResampledPath(path, newPointsMap);
    }

    /**
     * Resamples all tracks in a Paths object (modified in-place).
     *
     * @param paths The paths object containing tracks to resample
     */
    static computeOnePointPerSecondForPaths(paths: Paths): void {
        paths.tracks = paths.tracks.map(track => this.computeOnePointPerSecond(track));
    }

    /**
     * Adds a point specification to the map.
     */
    private static addPointToMap(
        map: Map<number, InterpolationData>,
        epochSecond: number,
        data: InterpolationData
    ): void {
        map.set(epochSecond, data);
    }

    /**
     * Creates a new path with resampled points.
     */
    private static createResampledPath(
        originalPath: Path,
        pointsMap: Map<number, InterpolationData>
    ): Path {
        const newPath = new Path(originalPath.name);

        // Sort epochs and create points
        const sortedEpochs = Array.from(pointsMap.keys()).sort((a, b) => a - b);

        for (const epoch of sortedEpochs) {
            const data = pointsMap.get(epoch)!;
            const epochTimeMs = epoch * 1000;

            if (data.type === 'copy') {
                // Copy existing point with updated time
                const point = originalPath.getPointData(data.index);
                const updatedPoint: Point = { ...point, time: epochTimeMs };
                newPath.addPoint(updatedPoint);
            } else {
                // Interpolate between two points
                const interpolated = originalPath.interpolatePoint(
                    data.index1,
                    data.index2,
                    data.coef
                );
                const updatedPoint: Point = { ...interpolated, time: epochTimeMs };
                newPath.addPoint(updatedPoint);
            }
        }

        return newPath;
    }
}

/**
 * Internal type for tracking interpolation data.
 */
type InterpolationData =
    | { type: 'copy'; index: number }
    | { type: 'interpolate'; index1: number; index2: number; coef: number };
