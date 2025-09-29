import { Vector3D } from '../../src/utils/Vector3D';

describe('Vector3D', () => {
    describe('constructor', () => {
        test('should create vector with given coordinates', () => {
            const vector = new Vector3D(1, 2, 3);

            expect(vector.x).toBe(1);
            expect(vector.y).toBe(2);
            expect(vector.z).toBe(3);
        });

        test('should create vector with zero coordinates', () => {
            const vector = new Vector3D(0, 0, 0);

            expect(vector.x).toBe(0);
            expect(vector.y).toBe(0);
            expect(vector.z).toBe(0);
        });

        test('should create vector with negative coordinates', () => {
            const vector = new Vector3D(-1, -2, -3);

            expect(vector.x).toBe(-1);
            expect(vector.y).toBe(-2);
            expect(vector.z).toBe(-3);
        });

        test('should create vector with decimal coordinates', () => {
            const vector = new Vector3D(1.5, 2.7, 3.14159);

            expect(vector.x).toBe(1.5);
            expect(vector.y).toBe(2.7);
            expect(vector.z).toBe(3.14159);
        });
    });

    describe('distanceTo', () => {
        test('should calculate distance between two points', () => {
            const v1 = new Vector3D(0, 0, 0);
            const v2 = new Vector3D(3, 4, 0);

            expect(v1.distanceTo(v2)).toBe(5);
        });

        test('should calculate distance to same point', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(1, 2, 3);

            expect(v1.distanceTo(v2)).toBe(0);
        });

        test('should calculate 3D distance', () => {
            const v1 = new Vector3D(0, 0, 0);
            const v2 = new Vector3D(1, 1, 1);

            expect(v1.distanceTo(v2)).toBeCloseTo(Math.sqrt(3), 6);
        });

        test('should calculate distance with negative coordinates', () => {
            const v1 = new Vector3D(-1, -1, -1);
            const v2 = new Vector3D(1, 1, 1);

            expect(v1.distanceTo(v2)).toBeCloseTo(Math.sqrt(12), 6);
        });

        test('should handle large coordinates', () => {
            const v1 = new Vector3D(1000000, 2000000, 3000000);
            const v2 = new Vector3D(1000001, 2000001, 3000001);

            expect(v1.distanceTo(v2)).toBeCloseTo(Math.sqrt(3), 6);
        });
    });

    describe('subtract', () => {
        test('should subtract two vectors', () => {
            const v1 = new Vector3D(5, 7, 9);
            const v2 = new Vector3D(2, 3, 4);
            const result = v1.subtract(v2);

            expect(result.x).toBe(3);
            expect(result.y).toBe(4);
            expect(result.z).toBe(5);
        });

        test('should subtract zero vector', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(0, 0, 0);
            const result = v1.subtract(v2);

            expect(result.x).toBe(1);
            expect(result.y).toBe(2);
            expect(result.z).toBe(3);
        });

        test('should subtract negative coordinates', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(-1, -2, -3);
            const result = v1.subtract(v2);

            expect(result.x).toBe(2);
            expect(result.y).toBe(4);
            expect(result.z).toBe(6);
        });

        test('should not modify original vectors', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(4, 5, 6);
            v1.subtract(v2);

            expect(v1.x).toBe(1);
            expect(v1.y).toBe(2);
            expect(v1.z).toBe(3);
        });
    });

    describe('add', () => {
        test('should add two vectors', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(4, 5, 6);
            const result = v1.add(v2);

            expect(result.x).toBe(5);
            expect(result.y).toBe(7);
            expect(result.z).toBe(9);
        });

        test('should add zero vector', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(0, 0, 0);
            const result = v1.add(v2);

            expect(result.x).toBe(1);
            expect(result.y).toBe(2);
            expect(result.z).toBe(3);
        });

        test('should add negative coordinates', () => {
            const v1 = new Vector3D(5, 6, 7);
            const v2 = new Vector3D(-2, -3, -4);
            const result = v1.add(v2);

            expect(result.x).toBe(3);
            expect(result.y).toBe(3);
            expect(result.z).toBe(3);
        });

        test('should be commutative', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(4, 5, 6);
            const result1 = v1.add(v2);
            const result2 = v2.add(v1);

            expect(result1.x).toBe(result2.x);
            expect(result1.y).toBe(result2.y);
            expect(result1.z).toBe(result2.z);
        });
    });

    describe('multiply', () => {
        test('should multiply vector by positive scalar', () => {
            const vector = new Vector3D(1, 2, 3);
            const result = vector.multiply(2);

            expect(result.x).toBe(2);
            expect(result.y).toBe(4);
            expect(result.z).toBe(6);
        });

        test('should multiply vector by zero', () => {
            const vector = new Vector3D(5, 10, 15);
            const result = vector.multiply(0);

            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
        });

        test('should multiply vector by negative scalar', () => {
            const vector = new Vector3D(1, -2, 3);
            const result = vector.multiply(-1);

            expect(result.x).toBe(-1);
            expect(result.y).toBe(2);
            expect(result.z).toBe(-3);
        });

        test('should multiply vector by decimal scalar', () => {
            const vector = new Vector3D(2, 4, 6);
            const result = vector.multiply(0.5);

            expect(result.x).toBe(1);
            expect(result.y).toBe(2);
            expect(result.z).toBe(3);
        });

        test('should multiply by one', () => {
            const vector = new Vector3D(7, 8, 9);
            const result = vector.multiply(1);

            expect(result.x).toBe(7);
            expect(result.y).toBe(8);
            expect(result.z).toBe(9);
        });
    });

    describe('dot', () => {
        test('should calculate dot product', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(4, 5, 6);
            const result = v1.dot(v2);

            expect(result).toBe(32); // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
        });

        test('should calculate dot product with orthogonal vectors', () => {
            const v1 = new Vector3D(1, 0, 0);
            const v2 = new Vector3D(0, 1, 0);
            const result = v1.dot(v2);

            expect(result).toBe(0);
        });

        test('should calculate dot product with parallel vectors', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(2, 4, 6);
            const result = v1.dot(v2);

            expect(result).toBe(28); // 2 * (1² + 2² + 3²) = 2 * 14 = 28
        });

        test('should be commutative', () => {
            const v1 = new Vector3D(2, 3, 4);
            const v2 = new Vector3D(5, 6, 7);

            expect(v1.dot(v2)).toBe(v2.dot(v1));
        });

        test('should calculate dot product with zero vector', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(0, 0, 0);

            expect(v1.dot(v2)).toBe(0);
        });
    });

    describe('cross', () => {
        test('should calculate cross product', () => {
            const v1 = new Vector3D(1, 0, 0);
            const v2 = new Vector3D(0, 1, 0);
            const result = v1.cross(v2);

            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(1);
        });

        test('should calculate cross product with general vectors', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(4, 5, 6);
            const result = v1.cross(v2);

            expect(result.x).toBe(-3); // 2*6 - 3*5 = 12 - 15 = -3
            expect(result.y).toBe(6); // 3*4 - 1*6 = 12 - 6 = 6
            expect(result.z).toBe(-3); // 1*5 - 2*4 = 5 - 8 = -3
        });

        test('should be anticommutative', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(4, 5, 6);
            const result1 = v1.cross(v2);
            const result2 = v2.cross(v1);

            expect(result1.x).toBe(-result2.x);
            expect(result1.y).toBe(-result2.y);
            expect(result1.z).toBe(-result2.z);
        });

        test('should return zero vector for parallel vectors', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(2, 4, 6);
            const result = v1.cross(v2);

            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
        });

        test('should return zero vector for same vector', () => {
            const v1 = new Vector3D(1, 2, 3);
            const result = v1.cross(v1);

            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
        });
    });

    describe('magnitude', () => {
        test('should calculate magnitude of unit vectors', () => {
            const v1 = new Vector3D(1, 0, 0);
            const v2 = new Vector3D(0, 1, 0);
            const v3 = new Vector3D(0, 0, 1);

            expect(v1.magnitude()).toBe(1);
            expect(v2.magnitude()).toBe(1);
            expect(v3.magnitude()).toBe(1);
        });

        test('should calculate magnitude of zero vector', () => {
            const vector = new Vector3D(0, 0, 0);

            expect(vector.magnitude()).toBe(0);
        });

        test('should calculate magnitude of 3-4-5 triangle', () => {
            const vector = new Vector3D(3, 4, 0);

            expect(vector.magnitude()).toBe(5);
        });

        test('should calculate magnitude of general vector', () => {
            const vector = new Vector3D(1, 2, 2);

            expect(vector.magnitude()).toBe(3); // sqrt(1² + 2² + 2²) = sqrt(9) = 3
        });

        test('should calculate magnitude with negative coordinates', () => {
            const vector = new Vector3D(-3, -4, 0);

            expect(vector.magnitude()).toBe(5);
        });

        test('should calculate magnitude of decimal coordinates', () => {
            const vector = new Vector3D(1.5, 2.0, 2.5);

            expect(vector.magnitude()).toBeCloseTo(3.5355, 3);
        });
    });

    describe('normalize', () => {
        test('should normalize unit vector', () => {
            const vector = new Vector3D(1, 0, 0);
            const result = vector.normalize();

            expect(result.x).toBe(1);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
        });

        test('should normalize general vector', () => {
            const vector = new Vector3D(3, 4, 0);
            const result = vector.normalize();

            expect(result.x).toBeCloseTo(0.6, 6);
            expect(result.y).toBe(0.8);
            expect(result.z).toBe(0);
            expect(result.magnitude()).toBeCloseTo(1, 6);
        });

        test('should handle zero vector', () => {
            const vector = new Vector3D(0, 0, 0);
            const result = vector.normalize();

            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
        });

        test('should normalize vector with negative coordinates', () => {
            const vector = new Vector3D(-6, -8, 0);
            const result = vector.normalize();

            expect(result.x).toBeCloseTo(-0.6, 6);
            expect(result.y).toBe(-0.8);
            expect(result.z).toBe(0);
            expect(result.magnitude()).toBeCloseTo(1, 6);
        });

        test('should normalize 3D vector', () => {
            const vector = new Vector3D(1, 1, 1);
            const result = vector.normalize();
            const expectedComponent = 1 / Math.sqrt(3);

            expect(result.x).toBeCloseTo(expectedComponent, 6);
            expect(result.y).toBeCloseTo(expectedComponent, 6);
            expect(result.z).toBeCloseTo(expectedComponent, 6);
            expect(result.magnitude()).toBeCloseTo(1, 6);
        });

        test('should not modify original vector', () => {
            const vector = new Vector3D(3, 4, 0);
            vector.normalize();

            expect(vector.x).toBe(3);
            expect(vector.y).toBe(4);
            expect(vector.z).toBe(0);
        });
    });

    describe('distanceToSegment', () => {
        test('should calculate distance to point on segment', () => {
            const point = new Vector3D(1, 1, 0);
            const segmentStart = new Vector3D(0, 0, 0);
            const segmentEnd = new Vector3D(2, 0, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBe(1); // Distance from (1,1,0) to (1,0,0)
        });

        test('should calculate distance to segment endpoint when closest', () => {
            const point = new Vector3D(-1, 1, 0);
            const segmentStart = new Vector3D(0, 0, 0);
            const segmentEnd = new Vector3D(2, 0, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBeCloseTo(Math.sqrt(2), 6); // Distance to (0,0,0)
        });

        test('should calculate distance to other segment endpoint when closest', () => {
            const point = new Vector3D(3, 1, 0);
            const segmentStart = new Vector3D(0, 0, 0);
            const segmentEnd = new Vector3D(2, 0, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBeCloseTo(Math.sqrt(2), 6); // Distance to (2,0,0)
        });

        test('should handle degenerate segment (zero length)', () => {
            const point = new Vector3D(1, 1, 0);
            const segmentStart = new Vector3D(0, 0, 0);
            const segmentEnd = new Vector3D(0, 0, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBeCloseTo(Math.sqrt(2), 6); // Distance to (0,0,0)
        });

        test('should calculate distance in 3D space', () => {
            const point = new Vector3D(1, 1, 1);
            const segmentStart = new Vector3D(0, 0, 0);
            const segmentEnd = new Vector3D(2, 0, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBeCloseTo(Math.sqrt(2), 6); // Distance from (1,1,1) to (1,0,0)
        });

        test('should handle point on segment', () => {
            const point = new Vector3D(1, 0, 0);
            const segmentStart = new Vector3D(0, 0, 0);
            const segmentEnd = new Vector3D(2, 0, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBe(0);
        });

        test('should handle point at segment start', () => {
            const point = new Vector3D(0, 0, 0);
            const segmentStart = new Vector3D(0, 0, 0);
            const segmentEnd = new Vector3D(2, 0, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBe(0);
        });

        test('should handle point at segment end', () => {
            const point = new Vector3D(2, 0, 0);
            const segmentStart = new Vector3D(0, 0, 0);
            const segmentEnd = new Vector3D(2, 0, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBe(0);
        });

        test('should calculate distance to diagonal segment', () => {
            const point = new Vector3D(0, 0, 0);
            const segmentStart = new Vector3D(1, 1, 0);
            const segmentEnd = new Vector3D(2, 2, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBeCloseTo(Math.sqrt(2), 6); // Distance to (1,1,0)
        });

        test('should calculate distance with vertical segment', () => {
            const point = new Vector3D(1, 0.5, 0);
            const segmentStart = new Vector3D(0, 0, 0);
            const segmentEnd = new Vector3D(0, 1, 0);

            const distance = point.distanceToSegment(segmentStart, segmentEnd);

            expect(distance).toBe(1); // Distance from (1,0.5,0) to (0,0.5,0)
        });
    });

    describe('vector operations composition', () => {
        test('should maintain vector arithmetic properties', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(4, 5, 6);
            const v3 = new Vector3D(7, 8, 9);

            // Associativity of addition: (v1 + v2) + v3 = v1 + (v2 + v3)
            const result1 = v1.add(v2).add(v3);
            const result2 = v1.add(v2.add(v3));

            expect(result1.x).toBeCloseTo(result2.x, 6);
            expect(result1.y).toBeCloseTo(result2.y, 6);
            expect(result1.z).toBeCloseTo(result2.z, 6);
        });

        test('should maintain distributive property', () => {
            const v1 = new Vector3D(1, 2, 3);
            const v2 = new Vector3D(4, 5, 6);
            const scalar = 2.5;

            // Distributive: scalar * (v1 + v2) = scalar * v1 + scalar * v2
            const result1 = v1.add(v2).multiply(scalar);
            const result2 = v1.multiply(scalar).add(v2.multiply(scalar));

            expect(result1.x).toBeCloseTo(result2.x, 6);
            expect(result1.y).toBeCloseTo(result2.y, 6);
            expect(result1.z).toBeCloseTo(result2.z, 6);
        });

        test('should handle complex vector chain operations', () => {
            const v1 = new Vector3D(1, 0, 0);
            const v2 = new Vector3D(0, 1, 0);
            const v3 = new Vector3D(0, 0, 1);

            const result = v1.multiply(2).add(v2.multiply(3)).subtract(v3.multiply(1)).normalize();

            const expectedMagnitude = 1;
            expect(result.magnitude()).toBeCloseTo(expectedMagnitude, 6);
        });
    });
});
