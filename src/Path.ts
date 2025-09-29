import { PointField, Point, FIELDS_PER_POINT } from './types';
import { GPXParser } from './gpx/GPXParser';
import { GPXWriter } from './gpx/GPXWriter';
import { GPXData, GPXWriteOptions } from './gpx/types';
import { toDegrees } from './constants';

/**
 * High-performance chunked storage for GPS path data with 33 properties per point.
 * Uses Float64Array chunks for memory efficiency and dynamic growth.
 *
 * Memory layout: [chunk0: point0_field0...point0_field32, point1_field0...point1_field32, ...]
 *
 * Based on PropertyKeys.java from gpx2web project, storing all simulation data
 * including spatial coordinates, physics calculations, and environmental conditions.
 */
export class Path {
    private readonly CHUNK_SIZE = 1000; // Points per chunk
    private readonly INITIAL_CHUNKS = 2; // Start with 2 chunks (2000 points capacity)

    private chunks: Float64Array[] = [];
    private pointCount = 0;

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
    private pointsEnhanced = false;

    constructor() {
        // Pre-allocate initial chunks for better performance
        this.ensureCapacity(this.INITIAL_CHUNKS * this.CHUNK_SIZE);
    }

    /**
     * Gets the total number of points stored.
     */
    get length(): number {
        return this.pointCount;
    }

    /**
     * Gets the total number of points stored.
     */
    getPointCount(): number {
        return this.pointCount;
    }

    /**
     * Gets the current capacity (total points that can be stored without reallocation).
     */
    get capacity(): number {
        return this.chunks.length * this.CHUNK_SIZE;
    }

    /**
     * Gets memory usage statistics.
     */
    getMemoryInfo(): {
        chunksCount: number;
        pointsCapacity: number;
        usedPoints: number;
        memoryMB: number;
    } {
        const memoryBytes = this.chunks.length * this.CHUNK_SIZE * FIELDS_PER_POINT * 8; // 8 bytes per Float64
        return {
            chunksCount: this.chunks.length,
            pointsCapacity: this.capacity,
            usedPoints: this.pointCount,
            memoryMB: memoryBytes / (1024 * 1024),
        };
    }

    /**
     * Ensures there is capacity for at least the specified number of points.
     */
    private ensureCapacity(minCapacity: number): void {
        const chunksNeeded = Math.ceil(minCapacity / this.CHUNK_SIZE);
        while (this.chunks.length < chunksNeeded) {
            this.chunks.push(new Float64Array(this.CHUNK_SIZE * FIELDS_PER_POINT));
        }
    }

    /**
     * Calculates the chunk index and field offset for a given point and field.
     */
    private getOffset(
        pointIndex: number,
        field: PointField
    ): { chunkIndex: number; fieldOffset: number } {
        if (pointIndex < 0 || pointIndex >= this.pointCount) {
            throw new Error(`Point index ${pointIndex} out of bounds [0, ${this.pointCount})`);
        }

        const chunkIndex = Math.floor(pointIndex / this.CHUNK_SIZE);
        const pointInChunk = pointIndex % this.CHUNK_SIZE;
        const fieldOffset = pointInChunk * FIELDS_PER_POINT + field;

        return { chunkIndex, fieldOffset };
    }

    /**
     * Gets a field value for a specific point.
     */
    private getField(pointIndex: number, field: PointField): number {
        const { chunkIndex, fieldOffset } = this.getOffset(pointIndex, field);
        return this.chunks[chunkIndex][fieldOffset];
    }

    /**
     * Sets a field value for a specific point.
     */
    private setField(pointIndex: number, field: PointField, value: number): void {
        const { chunkIndex, fieldOffset } = this.getOffset(pointIndex, field);
        this.chunks[chunkIndex][fieldOffset] = value;
    }

    /**
     * Calculate distance between two points using Haversine formula.
     * @param lat1 Latitude of first point (degrees)
     * @param lon1 Longitude of first point (degrees)
     * @param lat2 Latitude of second point (degrees)
     * @param lon2 Longitude of second point (degrees)
     * @returns Distance in meters
     */
    private distanceTo(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Simple coordinate projection to Cartesian coordinates for bearing calculation.
     * @param lat Latitude in degrees
     * @param lon Longitude in degrees
     * @returns Projected x,y coordinates
     */
    private project(lat: number, lon: number): { x: number; y: number } {
        // Simple cylindrical projection (adequate for bearing calculations)
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;

        return {
            x: lonRad * Math.cos(latRad),
            y: latRad,
        };
    }

    // === Spatial & Navigation Accessors ===

    getLatitude(pointIndex: number): number {
        return this.getField(pointIndex, PointField.LAT);
    }

    setLatitude(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.LAT, value);
    }

    getLongitude(pointIndex: number): number {
        return this.getField(pointIndex, PointField.LON);
    }

    setLongitude(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.LON, value);
    }

    getElevation(pointIndex: number): number {
        return this.getField(pointIndex, PointField.ELE);
    }

    setElevation(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.ELE, value);
    }

    getBearing(pointIndex: number): number {
        return this.getField(pointIndex, PointField.BEARING);
    }

    setBearing(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.BEARING, value);
    }

    getDistance(pointIndex: number): number {
        return this.getField(pointIndex, PointField.DIST);
    }

    setDistance(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.DIST, value);
    }

    getRadius(pointIndex: number): number {
        return this.getField(pointIndex, PointField.RADIUS);
    }

    setRadius(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.RADIUS, value);
    }

    // === Temporal Accessors ===

    getTime(pointIndex: number): number {
        return this.getField(pointIndex, PointField.TIME);
    }

    setTime(pointIndex: number, value: number | Date): void {
        const timestamp = value instanceof Date ? value.getTime() : value;
        this.setField(pointIndex, PointField.TIME, timestamp);
    }

    getTimeAsDate(pointIndex: number): Date {
        return new Date(this.getTime(pointIndex));
    }

    getElapsed(pointIndex: number): number {
        return this.getField(pointIndex, PointField.ELAPSED);
    }

    setElapsed(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.ELAPSED, value);
    }

    // === Physics & Power Accessors ===

    getPower(pointIndex: number): number {
        return this.getField(pointIndex, PointField.POWER);
    }

    setPower(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.POWER, value);
    }

    getSpeed(pointIndex: number): number {
        return this.getField(pointIndex, PointField.SPEED);
    }

    setSpeed(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.SPEED, value);
    }

    getSpeedMax(pointIndex: number): number {
        return this.getField(pointIndex, PointField.SPEED_MAX);
    }

    setSpeedMax(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.SPEED_MAX, value);
    }

    getSpeedMaxIncline(pointIndex: number): number {
        return this.getField(pointIndex, PointField.SPEED_MAX_INCLINE);
    }

    setSpeedMaxIncline(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.SPEED_MAX_INCLINE, value);
    }

    getGrade(pointIndex: number): number {
        return this.getField(pointIndex, PointField.GRADE);
    }

    setGrade(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.GRADE, value);
    }

    // === Environmental Accessors ===

    getTemperature(pointIndex: number): number {
        return this.getField(pointIndex, PointField.TEMPERATURE);
    }

    setTemperature(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.TEMPERATURE, value);
    }

    getWindSpeed(pointIndex: number): number {
        return this.getField(pointIndex, PointField.WIND_SPEED);
    }

    setWindSpeed(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.WIND_SPEED, value);
    }

    // === Physiological Accessors ===

    getHeartRate(pointIndex: number): number {
        return this.getField(pointIndex, PointField.HEART_RATE);
    }

    setHeartRate(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.HEART_RATE, value);
    }

    getCadence(pointIndex: number): number {
        return this.getField(pointIndex, PointField.CADENCE);
    }

    setCadence(pointIndex: number, value: number): void {
        this.setField(pointIndex, PointField.CADENCE, value);
    }

    /**
     * Adds a new point with the provided data.
     * @param data Complete point data with all 33 properties
     * @returns The index of the newly added point
     */
    addPoint(data: Point): number {
        const pointIndex = this.pointCount;
        this.ensureCapacity(pointIndex + 1);

        // Increment point count first so bounds checking works
        this.pointCount++;

        // Set all fields from the provided data
        this.setLatitude(pointIndex, data.lat);
        this.setLongitude(pointIndex, data.lon);
        this.setElevation(pointIndex, data.ele);
        this.setBearing(pointIndex, data.bearing);
        this.setDistance(pointIndex, data.dist);
        this.setRadius(pointIndex, data.radius);

        this.setTime(pointIndex, data.time);
        this.setElapsed(pointIndex, data.elapsed);

        this.setPower(pointIndex, data.power);
        this.setField(pointIndex, PointField.P_CYCLIST_RAW, data.pCyclistRaw);
        this.setField(pointIndex, PointField.P_CYCLIST_WHEEL, data.pCyclistWheel);
        this.setField(pointIndex, PointField.P_CYCLIST_OPTIMAL_POWER, data.pCyclistOptimalPower);
        this.setField(pointIndex, PointField.P_CYCLIST_CURRENT_SPEED, data.pCyclistCurrentSpeed);
        this.setField(pointIndex, PointField.P_CYCLIST_OPTIMAL_SPEED, data.pCyclistOptimalSpeed);
        this.setField(pointIndex, PointField.P_AERO, data.pAero);
        this.setField(pointIndex, PointField.P_GRAVITY, data.pGravity);
        this.setField(pointIndex, PointField.P_ROLLING_RESISTANCE, data.pRollingResistance);
        this.setField(pointIndex, PointField.P_WHEEL_BEARINGS, data.pWheelBearings);
        this.setField(pointIndex, PointField.P_POWER_FROM_ACC, data.pPowerFromAcc);
        this.setField(pointIndex, PointField.P_POWER_WHEEL_FROM_ACC, data.pPowerWheelFromAcc);
        this.setField(pointIndex, PointField.AERO_COEF, data.aeroCoef);
        this.setGrade(pointIndex, data.grade);

        this.setSpeed(pointIndex, data.speed);
        this.setField(pointIndex, PointField.SPEED_MAX, data.speedMax);
        this.setField(pointIndex, PointField.SPEED_MAX_INCLINE, data.speedMaxIncline);
        this.setField(pointIndex, PointField.VIRT_SPEED_CURRENT, data.virtSpeedCurrent);

        this.setTemperature(pointIndex, data.temperature);
        this.setWindSpeed(pointIndex, data.windSpeed);
        this.setField(pointIndex, PointField.WIND_DIRECTION, data.windDirection);
        this.setField(pointIndex, PointField.WIND_BEARING, data.windBearing);
        this.setField(pointIndex, PointField.WIND_ALPHA, data.windAlpha);

        this.setHeartRate(pointIndex, data.heartRate);
        this.setCadence(pointIndex, data.cadence);

        return pointIndex;
    }

    /**
     * Gets all data for a specific point.
     */
    getPointData(pointIndex: number): Point {
        return {
            lat: this.getLatitude(pointIndex),
            lon: this.getLongitude(pointIndex),
            ele: this.getElevation(pointIndex),
            bearing: this.getBearing(pointIndex),
            dist: this.getDistance(pointIndex),
            radius: this.getRadius(pointIndex),

            time: this.getTime(pointIndex),
            elapsed: this.getElapsed(pointIndex),

            power: this.getPower(pointIndex),
            pCyclistRaw: this.getField(pointIndex, PointField.P_CYCLIST_RAW),
            pCyclistWheel: this.getField(pointIndex, PointField.P_CYCLIST_WHEEL),
            pCyclistOptimalPower: this.getField(pointIndex, PointField.P_CYCLIST_OPTIMAL_POWER),
            pCyclistCurrentSpeed: this.getField(pointIndex, PointField.P_CYCLIST_CURRENT_SPEED),
            pCyclistOptimalSpeed: this.getField(pointIndex, PointField.P_CYCLIST_OPTIMAL_SPEED),
            pAero: this.getField(pointIndex, PointField.P_AERO),
            pGravity: this.getField(pointIndex, PointField.P_GRAVITY),
            pRollingResistance: this.getField(pointIndex, PointField.P_ROLLING_RESISTANCE),
            pWheelBearings: this.getField(pointIndex, PointField.P_WHEEL_BEARINGS),
            pPowerFromAcc: this.getField(pointIndex, PointField.P_POWER_FROM_ACC),
            pPowerWheelFromAcc: this.getField(pointIndex, PointField.P_POWER_WHEEL_FROM_ACC),
            aeroCoef: this.getField(pointIndex, PointField.AERO_COEF),
            grade: this.getGrade(pointIndex),

            speed: this.getSpeed(pointIndex),
            speedMax: this.getField(pointIndex, PointField.SPEED_MAX),
            speedMaxIncline: this.getField(pointIndex, PointField.SPEED_MAX_INCLINE),
            virtSpeedCurrent: this.getField(pointIndex, PointField.VIRT_SPEED_CURRENT),

            temperature: this.getTemperature(pointIndex),
            windSpeed: this.getWindSpeed(pointIndex),
            windDirection: this.getField(pointIndex, PointField.WIND_DIRECTION),
            windBearing: this.getField(pointIndex, PointField.WIND_BEARING),
            windAlpha: this.getField(pointIndex, PointField.WIND_ALPHA),

            heartRate: this.getHeartRate(pointIndex),
            cadence: this.getCadence(pointIndex),
        };
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
     * Clears all data and resets to initial state.
     */
    clear(): void {
        this.pointCount = 0;
        // Keep initial chunks allocated for performance
        if (this.chunks.length > this.INITIAL_CHUNKS) {
            this.chunks.length = this.INITIAL_CHUNKS;
        }
        // Zero out the kept chunks
        for (const chunk of this.chunks) {
            chunk.fill(0);
        }

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
        this.pointsEnhanced = false;
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
     * Compute derived arrays and statistics from GPS track data.
     * Calculates distances, elevations, grades, speeds, and bearings.
     * Based on Java computeArrays() method from gpx2web project.
     */
    public computeArrays(): void {
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
            this.pointsEnhanced = false;
            return;
        }
        this.timeStart = this.getTime(0);

        // First pass: compute distances, elevation stats, and geographic bounds
        for (let i = 0; i < this.pointCount; i++) {
            const lat = this.getLatitude(i);
            const lon = this.getLongitude(i);
            const ele = this.getElevation(i);

            // Update geographic bounds
            this.minLat = Math.min(this.minLat, lat);
            this.maxLat = Math.max(this.maxLat, lat);
            this.minLon = Math.min(this.minLon, lon);
            this.maxLon = Math.max(this.maxLon, lon);

            // Update elevation statistics
            this.minElevation = Math.min(this.minElevation, ele);
            this.maxElevation = Math.max(this.maxElevation, ele);

            // Calculate cumulative distance
            if (i > 0) {
                const prevLat = this.getLatitude(i - 1);
                const prevLon = this.getLongitude(i - 1);
                const prevEle = this.getElevation(i - 1);

                const distance = this.distanceTo(prevLat, prevLon, lat, lon);
                this.totalDistance += distance;

                // Calculate elevation gain/loss
                const elevationDiff = ele - prevEle;
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

        this.pointsEnhanced = true;
    }

    /**
     * Get total distance of the track.
     * @returns Total distance in meters
     */
    public getTotalDistance(): number {
        if (!this.pointsEnhanced) {
            this.computeArrays();
        }
        return this.totalDistance;
    }

    /**
     * Get minimum elevation in the track.
     * @returns Minimum elevation in meters
     */
    public getMinElevation(): number {
        if (!this.pointsEnhanced) {
            this.computeArrays();
        }
        return this.minElevation === Number.MAX_VALUE ? 0 : this.minElevation;
    }

    /**
     * Get maximum elevation in the track.
     * @returns Maximum elevation in meters
     */
    public getMaxElevation(): number {
        if (!this.pointsEnhanced) {
            this.computeArrays();
        }
        return this.maxElevation === -Number.MAX_VALUE ? 0 : this.maxElevation;
    }

    /**
     * Get total elevation gain.
     * @returns Total elevation gain in meters
     */
    public getTotalElevationGain(): number {
        if (!this.pointsEnhanced) {
            this.computeArrays();
        }
        return this.totalElevationGain;
    }

    /**
     * Get total elevation loss.
     * @returns Total elevation loss in meters (negative value)
     */
    public getTotalElevationLoss(): number {
        if (!this.pointsEnhanced) {
            this.computeArrays();
        }
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
        if (!this.pointsEnhanced) {
            this.computeArrays();
        }
        return {
            minLat: this.minLat === Number.MAX_VALUE ? 0 : this.minLat,
            maxLat: this.maxLat === -Number.MAX_VALUE ? 0 : this.maxLat,
            minLon: this.minLon === Number.MAX_VALUE ? 0 : this.minLon,
            maxLon: this.maxLon === -Number.MAX_VALUE ? 0 : this.maxLon,
        };
    }

    /**
     * Check if arrays have been computed.
     * @returns True if computeArrays() has been called
     */
    public arePointsEnhanced(): boolean {
        return this.pointsEnhanced;
    }

    // === GPX Import/Export Methods ===

    /**
     * Create a Path from GPX file content.
     * @param gpxContent GPX XML content as string
     * @returns New Path instance with data from the first track
     */
    static fromGPX(gpxContent: string): Path {
        const parser = new GPXParser();
        const gpxData = parser.parse(gpxContent);

        const path = new Path();

        // Process first track if available
        if (gpxData.tracks.length === 0) {
            throw new Error('No tracks found in GPX file');
        }

        const track = gpxData.tracks[0];
        if (track.segments.length === 0) {
            throw new Error('No segments found in GPX track');
        }

        // Process all segments
        for (const segment of track.segments) {
            for (const trackPoint of segment.trackPoints) {
                const point: Point = {
                    // Required coordinates
                    lat: trackPoint.lat,
                    lon: trackPoint.lon,
                    ele: trackPoint.ele ?? 0,

                    // Navigation
                    bearing: trackPoint.extensions?.bearing ?? 0,
                    dist: trackPoint.extensions?.distance ?? 0,
                    radius: 0,

                    // Time
                    time: trackPoint.time?.getTime() ?? 0,
                    elapsed: 0,

                    // Physics & Power (zeros for GPX import)
                    power: trackPoint.extensions?.power ?? 0,
                    pCyclistRaw: 0,
                    pCyclistWheel: 0,
                    pCyclistOptimalPower: 0,
                    pCyclistCurrentSpeed: 0,
                    pCyclistOptimalSpeed: 0,
                    pAero: 0,
                    pGravity: 0,
                    pRollingResistance: 0,
                    pWheelBearings: 0,
                    pPowerFromAcc: 0,
                    pPowerWheelFromAcc: 0,
                    aeroCoef: 0,
                    grade: 0,

                    // Speed
                    speed: trackPoint.extensions?.speed ?? 0,
                    speedMax: 0,
                    speedMaxIncline: 0,
                    virtSpeedCurrent: 0,

                    // Environment
                    temperature: trackPoint.extensions?.temperature ?? 0,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,

                    // Physiology
                    heartRate: trackPoint.extensions?.heartRate ?? 0,
                    cadence: trackPoint.extensions?.cadence ?? 0,
                };

                path.addPoint(point);
            }
        }

        return path;
    }

    /**
     * Export this Path to GPX XML format.
     * @param options GPX write options
     * @returns GPX XML string
     */
    toGPX(options?: GPXWriteOptions): string {
        const writer = new GPXWriter(options);
        return writer.writeFromPath(this);
    }

    /**
     * Load GPX content into this existing Path instance (clears existing data).
     * @param gpxContent GPX XML content as string
     */
    loadFromGPX(gpxContent: string): void {
        this.clear();
        const tempPath = Path.fromGPX(gpxContent);

        // Copy all points from temp path
        for (let i = 0; i < tempPath.getPointCount(); i++) {
            this.addPoint(tempPath.getPointData(i));
        }
    }

    /**
     * Export to GPXData structure for advanced customization.
     * @returns GPXData object
     */
    toGPXData(): GPXData {
        const gpxData: GPXData = {
            version: '1.1',
            creator: '@glandais/virtual-cyclist',
            tracks: [
                {
                    name: 'Virtual Cyclist Track',
                    type: 'cycling',
                    segments: [
                        {
                            trackPoints: [],
                        },
                    ],
                },
            ],
        };

        const segment = gpxData.tracks[0].segments[0];

        for (let i = 0; i < this.pointCount; i++) {
            const point = this.getPointData(i);

            segment.trackPoints.push({
                lat: point.lat,
                lon: point.lon,
                ele: point.ele !== 0 ? point.ele : undefined,
                time: point.time !== 0 ? new Date(point.time) : undefined,
                extensions: {
                    heartRate: point.heartRate !== 0 ? point.heartRate : undefined,
                    cadence: point.cadence !== 0 ? point.cadence : undefined,
                    temperature: point.temperature !== 0 ? point.temperature : undefined,
                    power: point.power !== 0 ? point.power : undefined,
                    speed: point.speed !== 0 ? point.speed : undefined,
                },
            });
        }

        return gpxData;
    }
}
