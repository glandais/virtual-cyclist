/**
 * 3D Vector class for ECEF coordinate operations
 */
export class Vector3D {
    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly z: number
    ) {}

    /**
     * Calculate Euclidean distance between two vectors
     */
    public distanceTo(other: Vector3D): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return Math.hypot(dx, dy, dz);
    }

    /**
     * Subtract two vectors
     */
    public subtract(other: Vector3D): Vector3D {
        return new Vector3D(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    /**
     * Add two vectors
     */
    public add(other: Vector3D): Vector3D {
        return new Vector3D(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    /**
     * Multiply vector by scalar
     */
    public multiply(scalar: number): Vector3D {
        return new Vector3D(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    /**
     * Calculate dot product with another vector
     */
    public dot(other: Vector3D): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    /**
     * Calculate cross product with another vector
     */
    public cross(other: Vector3D): Vector3D {
        return new Vector3D(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }

    /**
     * Calculate the magnitude (length) of the vector
     */
    public magnitude(): number {
        return Math.hypot(this.x, this.y, this.z);
    }

    /**
     * Normalize the vector to unit length
     */
    public normalize(): Vector3D {
        const mag = this.magnitude();
        if (mag === 0) {
            return new Vector3D(0, 0, 0);
        }
        return this.multiply(1 / mag);
    }

    /**
     * Calculate perpendicular distance from this point to a line segment defined by two points
     * Uses the formula: ||(p-a) × (p-b)|| / ||b-a||
     * where p is this point, a and b are the line segment endpoints
     */
    public distanceToSegment(segmentStart: Vector3D, segmentEnd: Vector3D): number {
        const segmentVector = segmentEnd.subtract(segmentStart);
        const segmentLength = segmentVector.magnitude();

        // Handle degenerate case where segment has zero length
        if (segmentLength === 0) {
            return this.distanceTo(segmentStart);
        }

        // Vector from segment start to this point
        const pointVector = this.subtract(segmentStart);

        // Project point vector onto segment vector
        const projection = pointVector.dot(segmentVector) / (segmentLength * segmentLength);

        // Clamp projection to segment bounds [0, 1]
        const clampedProjection = Math.max(0, Math.min(1, projection));

        // Find closest point on segment
        const closestPoint = segmentStart.add(segmentVector.multiply(clampedProjection));

        // Return distance to closest point
        return this.distanceTo(closestPoint);
    }
}
