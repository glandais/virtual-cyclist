import { Path, Point } from '@/types/path/';
import { EcefConverter } from './EcefConverter';

/**
 * 3D Douglas-Peucker algorithm implementation for elevation profile simplification
 * Uses ECEF coordinates for true 3D distance calculations
 */
export class DouglasPeucker {
    /**
     * Simplify a path using the Douglas-Peucker algorithm in 3D space
     * @param points - Array of coordinates with elevation
     * @param tolerance - Maximum allowed distance from simplified line in meters
     * @param zExaggeration - Elevation exaggeration factor for ECEF conversion (default: 3)
     * @returns Simplified array of coordinates
     */
    public static simplify(path: Path, tolerance: number, zExaggeration: number = 3): Path {
        if (path.getPointCount() <= 2) {
            return path;
        }

        const lastIndex = path.getPointCount() - 1;
        const simplified: Path = new Path(path.name);

        // Always include first point
        simplified.addPoint(path.getPointData(0));

        // Recursively simplify the path
        const intermediatePoints = this.simplifyRecursive(
            path,
            0,
            lastIndex,
            tolerance,
            zExaggeration
        );
        for (const point of intermediatePoints) {
            simplified.addPoint(point);
        }

        // Always include last point
        simplified.addPoint(path.getPointData(lastIndex));

        simplified.computeDerivedData();
        return simplified;
    }

    /**
     * Recursive step of the Douglas-Peucker algorithm
     * @param points - Array of all points
     * @param firstIndex - Index of first point in current segment
     * @param lastIndex - Index of last point in current segment
     * @param tolerance - Maximum allowed distance in meters
     * @param zExaggeration - Elevation exaggeration factor
     * @returns Array of points to include in simplified path
     */
    private static simplifyRecursive(
        path: Path,
        firstIndex: number,
        lastIndex: number,
        tolerance: number,
        zExaggeration: number
    ): Point[] {
        let maxDistance = 0;
        let maxIndex = -1;
        const result: Point[] = [];

        // Convert segment endpoints to ECEF
        const firstEcef = EcefConverter.toEcef(path.getPointData(firstIndex), zExaggeration);
        const lastEcef = EcefConverter.toEcef(path.getPointData(lastIndex), zExaggeration);

        // Find the point with maximum perpendicular distance to the line segment
        for (let i = firstIndex + 1; i < lastIndex; i++) {
            const pointEcef = EcefConverter.toEcef(path.getPointData(i), zExaggeration);
            const distance = pointEcef.distanceToSegment(firstEcef, lastEcef);

            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }

        // If the maximum distance is greater than tolerance, split the segment
        if (maxDistance > tolerance && maxIndex !== -1) {
            // Recursively simplify the first sub-segment
            if (maxIndex - firstIndex > 1) {
                const leftSegment = this.simplifyRecursive(
                    path,
                    firstIndex,
                    maxIndex,
                    tolerance,
                    zExaggeration
                );
                result.push(...leftSegment);
            }

            // Include the point with maximum distance
            result.push(path.getPointData(maxIndex));

            // Recursively simplify the second sub-segment
            if (lastIndex - maxIndex > 1) {
                const rightSegment = this.simplifyRecursive(
                    path,
                    maxIndex,
                    lastIndex,
                    tolerance,
                    zExaggeration
                );
                result.push(...rightSegment);
            }
        }

        return result;
    }
}
