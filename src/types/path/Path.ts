import { toDegrees } from '@/utils/';
import { GeneratedPath } from './GeneratedPath';
import { Point } from './Point';

export class Path extends GeneratedPath {
    // Computed statistics
    private totalDistance = 0;
    private timeStart = 0;
    private minElevation = Number.MAX_VALUE;
    private maxElevation = -Number.MAX_VALUE;
    private totalElevationGain = 0;
    private totalElevationLoss = 0;
    private minLat = Number.MAX_VALUE;
    private maxLat = -Number.MAX_VALUE;
    private minLon = Number.MAX_VALUE;
    private maxLon = -Number.MAX_VALUE;

    /**
     * Clears all data and resets to initial state.
     */
    clear(): void {
        super.clear();

        // Reset computed statistics
        this.totalDistance = 0;
        this.timeStart = 0;
        this.minElevation = Number.MAX_VALUE;
        this.maxElevation = -Number.MAX_VALUE;
        this.totalElevationGain = 0;
        this.totalElevationLoss = 0;
        this.minLat = Number.MAX_VALUE;
        this.maxLat = -Number.MAX_VALUE;
        this.minLon = Number.MAX_VALUE;
        this.maxLon = -Number.MAX_VALUE;
    }

    /**
     * Creates an iterator for efficient point traversal.
     */
    *[Symbol.iterator](): Iterator<Point> {
        for (let i = 0; i < this.pointCount; i++) {
            yield this.getPointData(i);
        }
    }

    /**
     * Creates an iterator for accessing raw coordinate data efficiently.
     * Useful for integrating with existing Coordinates-based code.
     */
    *coordinatesIterator(): IterableIterator<{
        latitude: number;
        longitude: number;
        elevation?: number;
    }> {
        for (let i = 0; i < this.pointCount; i++) {
            yield {
                latitude: toDegrees(this.getLatitude(i)),
                longitude: toDegrees(this.getLongitude(i)),
                elevation: this.getElevation(i),
            };
        }
    }

    /**
     * Gets data for a range of points.
     */
    getPointRange(startIndex: number, count: number): Point[] {
        if (startIndex < 0 || startIndex >= this.pointCount) {
            throw new Error(`Start index ${startIndex} out of bounds [0, ${this.pointCount})`);
        }
        if (startIndex + count > this.pointCount) {
            throw new Error(
                `Range [${startIndex}, ${startIndex + count}) exceeds point count ${this.pointCount}`
            );
        }

        const result: Point[] = [];
        for (let i = 0; i < count; i++) {
            result.push(this.getPointData(startIndex + i));
        }
        return result;
    }

    /**
     * Get total distance of the track.
     * @returns Total distance in meters
     */
    public getTotalDistance(): number {
        return this.totalDistance;
    }

    /**
     * Get minimum elevation in the track.
     * @returns Minimum elevation in meters
     */
    public getMinElevation(): number {
        return this.minElevation === Number.MAX_VALUE ? 0 : this.minElevation;
    }

    /**
     * Get maximum elevation in the track.
     * @returns Maximum elevation in meters
     */
    public getMaxElevation(): number {
        return this.maxElevation === -Number.MAX_VALUE ? 0 : this.maxElevation;
    }

    /**
     * Get total elevation gain.
     * @returns Total elevation gain in meters
     */
    public getTotalElevationGain(): number {
        return this.totalElevationGain;
    }

    /**
     * Get total elevation loss.
     * @returns Total elevation loss in meters (negative value)
     */
    public getTotalElevationLoss(): number {
        return this.totalElevationLoss;
    }

    /**
     * Get geographic bounds of the track.
     * @returns Bounding box with min/max latitude and longitude
     */
    public getBounds(): {
        minLat: number;
        maxLat: number;
        minLon: number;
        maxLon: number;
    } {
        return {
            minLat: this.minLat === Number.MAX_VALUE ? 0 : this.minLat,
            maxLat: this.maxLat === -Number.MAX_VALUE ? 0 : this.maxLat,
            minLon: this.minLon === Number.MAX_VALUE ? 0 : this.minLon,
            maxLon: this.maxLon === -Number.MAX_VALUE ? 0 : this.maxLon,
        };
    }

    /**
     * Get all cumulative distances as an array for efficient binary search.
     * This is used by VirtualizeService for GPS waypoint alignment.
     *
     * @returns Array of cumulative distances for all points
     */
    public getAllDistances(): Float64Array {
        const distances = new Float64Array(this.pointCount);
        for (let i = 0; i < this.pointCount; i++) {
            distances[i] = this.getDistance(i);
        }
        return distances;
    }

    /**
     * Compute derived arrays and statistics from GPS track data.
     * Calculates distances, elevations, grades, speeds, and bearings.
     * Based on Java computeDerivedData() method from gpx2web project.
     */
    public computeDerivedData(): void {
        // Reset statistics
        this.totalDistance = 0;
        this.timeStart = 0;
        this.minElevation = Number.MAX_VALUE;
        this.maxElevation = -Number.MAX_VALUE;
        this.totalElevationGain = 0;
        this.totalElevationLoss = 0;
        this.minLat = Number.MAX_VALUE;
        this.maxLat = -Number.MAX_VALUE;
        this.minLon = Number.MAX_VALUE;
        this.maxLon = -Number.MAX_VALUE;
        if (this.pointCount === 0) {
            return;
        }
        this.timeStart = this.getTime(0);

        // First pass: compute distances, elevation stats, and geographic bounds
        for (let i = 0; i < this.pointCount; i++) {
            const latitude = this.getLatitude(i);
            const longitude = this.getLongitude(i);
            const elevation = this.getElevation(i);

            // Update geographic bounds
            this.minLat = Math.min(this.minLat, latitude);
            this.maxLat = Math.max(this.maxLat, latitude);
            this.minLon = Math.min(this.minLon, longitude);
            this.maxLon = Math.max(this.maxLon, longitude);

            // Update elevation statistics
            this.minElevation = Math.min(this.minElevation, elevation);
            this.maxElevation = Math.max(this.maxElevation, elevation);

            // Calculate cumulative distance
            if (i > 0) {
                const prevLat = this.getLatitude(i - 1);
                const prevLon = this.getLongitude(i - 1);
                const prevEle = this.getElevation(i - 1);

                const distance = this.distanceTo(prevLat, prevLon, latitude, longitude);
                this.totalDistance += distance;

                // Calculate elevation gain/loss
                const elevationDiff = elevation - prevEle;
                if (elevationDiff > 0) {
                    this.totalElevationGain += elevationDiff;
                } else {
                    this.totalElevationLoss += elevationDiff;
                }
            }

            // Set cumulative distance for this point
            this.setDistance(i, this.totalDistance);
        }

        // Second pass: compute grades, speeds, and bearings
        for (let i = 0; i < this.pointCount; i++) {
            const currentDist = this.getDistance(i);
            const currentEle = this.getElevation(i);
            const currentTime = this.getTime(i);
            this.setElapsed(i, (currentTime - this.timeStart) / 1000);

            // Find next point with different distance (forward-looking calculation)
            let maxIndex = i + 1;
            while (
                maxIndex < this.pointCount &&
                Math.abs(this.getDistance(maxIndex) - currentDist) < 0.001
            ) {
                maxIndex++;
            }
            maxIndex = Math.min(this.pointCount - 1, maxIndex);

            const distDiff = this.getDistance(maxIndex) - currentDist;

            if (distDiff > 0) {
                // Calculate grade
                const elevationDiff = this.getElevation(maxIndex) - currentEle;
                const grade = elevationDiff / distDiff;
                this.setGrade(i, grade);

                // Calculate speed
                const timeDiff = this.getTime(maxIndex) - currentTime;
                if (timeDiff > 0) {
                    const speed = (distDiff * 1000) / timeDiff; // m/s (timeDiff is in ms)
                    this.setSpeed(i, speed);
                }

                // Calculate bearing
                const currentLat = this.getLatitude(i);
                const currentLon = this.getLongitude(i);
                const targetLat = this.getLatitude(maxIndex);
                const targetLon = this.getLongitude(maxIndex);

                const fromProj = this.project(currentLat, currentLon);
                const toProj = this.project(targetLat, targetLon);

                const dy = toProj.y - fromProj.y;
                const dx = toProj.x - fromProj.x;
                const bearing = Math.atan2(-dy, dx); // Negative dy for correct bearing
                this.setBearing(i, bearing);
            } else {
                // No distance change, set defaults
                this.setGrade(i, 0);
                this.setBearing(i, 0);
                // Keep existing speed if any
            }
        }
    }

    /**
     * Calculate distance between two points using Haversine formula.
     * @param lat1 Latitude of first point (radians)
     * @param lon1 Longitude of first point (radians)
     * @param lat2 Latitude of second point (radians)
     * @param lon2 Longitude of second point (radians)
     * @returns Distance in meters
     */
    private distanceTo(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1;
        const φ2 = lat2;
        const Δφ = lat2 - lat1;
        const Δλ = lon2 - lon1;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Simple coordinate projection to Cartesian coordinates for bearing calculation.
     * @param latitude Latitude in radians
     * @param longitude Longitude in radians
     * @returns Projected x,y coordinates
     */
    private project(latitude: number, longitude: number): { x: number; y: number } {
        // Simple cylindrical projection (adequate for bearing calculations)
        return {
            x: longitude * Math.cos(latitude),
            y: latitude,
        };
    }
}

/**
 * Complete GPX document structure
 */
export interface Paths {
    name?: string;
    tracks: Path[];
}
