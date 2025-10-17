import { MINIMAL_SPEED } from '@/constants/';
import { toDegrees } from '@/utils/';
import { GeneratedPath } from './GeneratedPath';
import { FIELDS_PER_POINT, Point, POINT_FIELDS } from './Point';

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
        elevation: number;
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
            const distance = this.getDistance(i);
            const elevation = this.getElevation(i);
            const time = this.getTime(i);
            this.setElapsed(i, (time - this.timeStart) / 1000);

            if (this.pointCount > 0) {
                const im1 = Math.max(0, i - 1);
                const ip1 = Math.min(this.pointCount - 1, i + 1);
                this.setBearing(i, this.computeBearing(im1, ip1));

                const dDistance = this.getDistance(ip1) - this.getDistance(im1);
                const dElevation = this.getElevation(ip1) - this.getElevation(im1);

                // Calculate grade
                const grade = dElevation / dDistance;
                this.setGrade(i, grade);
            }

            if (i === 0) {
                this.setSpeed(0, MINIMAL_SPEED);
                if (i + 1 < this.pointCount) {
                    const dDistance = distance - this.getDistance(i + 1);
                    const dElevation = elevation - this.getElevation(i + 1);

                    // Calculate grade
                    const grade = dElevation / dDistance;
                    this.setGrade(i, grade);

                    this.setBearing(i, this.computeBearing(0, 1));
                }
                this.setDx(i, 0);
                this.setDt(i, 0);
            }
            if (i > 0) {
                const im1 = i - 1;

                const dDistance = distance - this.getDistance(im1);
                const dTime = time - this.getTime(im1);

                // Calculate speed
                const speed = (dDistance * 1000) / dTime; // m/s (timeDiff is in ms)
                this.setSpeed(i, speed);
                this.setDx(i, dDistance);
                this.setDt(i, dTime);
            }
        }
    }

    computeBearing(from: number, to: number): number {
        // Calculate bearing
        const currentLat = this.getLatitude(from);
        const currentLon = this.getLongitude(from);
        const targetLat = this.getLatitude(to);
        const targetLon = this.getLongitude(to);

        const fromProj = this.project(currentLat, currentLon);
        const toProj = this.project(targetLat, targetLon);

        const dy = toProj.y - fromProj.y;
        const dx = toProj.x - fromProj.x;
        const bearing = Math.atan2(-dy, dx); // Negative dy for correct bearing
        return bearing;
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

    /**
     * Directly interpolate between two points and write to a new index.
     *
     * @param targetIndex Index where interpolated point will be written (must be valid)
     * @param index1 First source point index
     * @param index2 Second source point index
     * @param coef Interpolation coefficient (0 = index1, 1 = index2)
     * @param fieldsToInterpolate Array of PointField values to interpolate (others will be NaN)
     */
    public addInterpolatedFrom(
        from: Path,
        index1: number,
        index2: number,
        coef: number,
        fieldsToInterpolate = POINT_FIELDS
    ): number {
        const pointIndex = this.pointCount;
        this.ensureCapacity(pointIndex + 1);

        // Increment point count first so bounds checking works
        this.pointCount++;

        const chunk1Index = Math.floor(index1 / this.CHUNK_SIZE);
        const point1InChunk = index1 % this.CHUNK_SIZE;
        const base1Offset = point1InChunk * FIELDS_PER_POINT;
        const chunk1 = from.chunks[chunk1Index];

        const chunk2Index = Math.floor(index2 / this.CHUNK_SIZE);
        const point2InChunk = index2 % this.CHUNK_SIZE;
        const base2Offset = point2InChunk * FIELDS_PER_POINT;
        const chunk2 = from.chunks[chunk2Index];

        const targetChunkIndex = Math.floor(pointIndex / this.CHUNK_SIZE);
        const targetPointInChunk = pointIndex % this.CHUNK_SIZE;
        const targetBaseOffset = targetPointInChunk * FIELDS_PER_POINT;
        const targetChunk = this.chunks[targetChunkIndex];

        // Interpolate only specified fields
        for (const field of fieldsToInterpolate) {
            const v1 = chunk1[base1Offset + field];
            const v2 = chunk2[base2Offset + field];

            // Strict NaN handling - if either is NaN, result is NaN
            if (isNaN(v1) || isNaN(v2)) {
                targetChunk[targetBaseOffset + field] = NaN;
            } else {
                targetChunk[targetBaseOffset + field] = v1 + (v2 - v1) * coef;
            }
        }
        return pointIndex;
    }

    public addFrom(from: Path, index: number, fields = POINT_FIELDS): number {
        const pointIndex = this.pointCount;
        this.ensureCapacity(pointIndex + 1);

        // Increment point count first so bounds checking works
        this.pointCount++;

        const chunkIndex = Math.floor(index / this.CHUNK_SIZE);
        const pointInChunk = index % this.CHUNK_SIZE;
        const baseOffset = pointInChunk * FIELDS_PER_POINT;
        const chunk = from.chunks[chunkIndex];

        const targetChunkIndex = Math.floor(pointIndex / this.CHUNK_SIZE);
        const targetPointInChunk = pointIndex % this.CHUNK_SIZE;
        const targetBaseOffset = targetPointInChunk * FIELDS_PER_POINT;
        const targetChunk = this.chunks[targetChunkIndex];

        // Interpolate only specified fields
        for (const field of fields) {
            targetChunk[targetBaseOffset + field] = chunk[baseOffset + field];
        }

        return pointIndex;
    }
}

/**
 * Complete GPX document structure
 */
export interface Paths {
    name?: string;
    tracks: Path[];
}
