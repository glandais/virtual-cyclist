import { FIELDS_PER_POINT, PointField } from './Point';

/**
 * High-performance chunked storage for GPS path data with 33 properties per point.
 * Uses Float64Array chunks for memory efficiency and dynamic growth.
 *
 * Memory layout: [chunk0: point0_field0...point0_field32, point1_field0...point1_field32, ...]
 *
 * Based on PropertyKeys.java from gpx2web project, storing all simulation data
 * including spatial coordinates, physics calculations, and environmental conditions.
 */
export abstract class AbstractPath {
    private readonly CHUNK_SIZE = 1000; // Points per chunk
    private readonly INITIAL_CHUNKS = 2; // Start with 2 chunks (2000 points capacity)

    private chunks: Float64Array[] = [];
    protected pointCount = 0;

    constructor(public name: string) {
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
    protected ensureCapacity(minCapacity: number): void {
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
    public getField(pointIndex: number, field: PointField): number {
        const { chunkIndex, fieldOffset } = this.getOffset(pointIndex, field);
        return this.chunks[chunkIndex][fieldOffset];
    }

    /**
     * Sets a field value for a specific point.
     */
    public setField(pointIndex: number, field: PointField, value: number): void {
        const { chunkIndex, fieldOffset } = this.getOffset(pointIndex, field);
        this.chunks[chunkIndex][fieldOffset] = value;
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
}
