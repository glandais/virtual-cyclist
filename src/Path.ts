import { PointField, Point, FIELDS_PER_POINT } from './types';

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
                latitude: this.getLatitude(i),
                longitude: this.getLongitude(i),
                elevation: this.getElevation(i),
            };
        }
    }
}
