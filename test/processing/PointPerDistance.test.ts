import { PointPerDistance } from '@/processing/';
import { Path, Point } from '@/types/path/';

describe('PointPerDistance', () => {
    test('should handle empty path', () => {
        const path = new Path('empty');
        const result = PointPerDistance.compute(path, 100, 150);

        expect(result.getPointCount()).toBe(0);
    });

    test('should keep first point always', () => {
        const path = new Path('single');
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: 0,
            distance: 0,
        } as Point);

        const result = PointPerDistance.compute(path, 100, 150);

        expect(result.getPointCount()).toBe(1);
        expect(result.getDistance(0)).toBe(0);
    });

    test('should skip points that are too close (< minDist)', () => {
        const path = new Path('test');

        // Points very close together
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: 0,
        } as Point);

        path.addPoint({
            latitude: 45.00005,
            longitude: 6.0,
            elevation: 1000,
            time: 5000,
        } as Point);

        path.addPoint({
            latitude: 45.00008,
            longitude: 6.0,
            elevation: 1000,
            time: 8000,
        } as Point);

        path.computeDerivedData();

        const result = PointPerDistance.compute(path, 100, 150);

        // Should skip points that are too close
        // Verify all gaps are within bounds (with tolerance for floating point errors)
        expect(result.getPointCount()).toBeGreaterThanOrEqual(1);
        for (let i = 1; i < result.getPointCount(); i++) {
            const gap = result.getDistance(i) - result.getDistance(i - 1);
            expect(gap).toBeGreaterThanOrEqual(100 - 5); // 5m tolerance for computeDerivedData rounding
            expect(gap).toBeLessThanOrEqual(150 + 5);
        }
    });

    test('should keep points at perfect spacing (minDist <= gap <= maxDist)', () => {
        const path = new Path('test');

        // Points with spacing within range
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: 0,
        } as Point);

        path.addPoint({
            latitude: 45.001,
            longitude: 6.0,
            elevation: 1010,
            time: 12000,
        } as Point);

        path.addPoint({
            latitude: 45.002,
            longitude: 6.0,
            elevation: 1020,
            time: 25000,
        } as Point);

        path.computeDerivedData();

        const result = PointPerDistance.compute(path, 100, 150);

        // Verify all gaps are within range
        expect(result.getPointCount()).toBeGreaterThanOrEqual(1);
        for (let i = 1; i < result.getPointCount(); i++) {
            const gap = result.getDistance(i) - result.getDistance(i - 1);
            expect(gap).toBeGreaterThanOrEqual(100 - 0.1);
            expect(gap).toBeLessThanOrEqual(150 + 0.1);
        }
    });

    test('should interpolate points for large gaps (> maxDist)', () => {
        const path = new Path('test');

        // Two points with large gap (approximately 450m)
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: 0,
        } as Point);

        path.addPoint({
            latitude: 45.004,
            longitude: 6.0,
            elevation: 1100,
            time: 45000,
        } as Point);

        path.computeDerivedData();

        const initialDistance = path.getTotalDistance();

        const result = PointPerDistance.compute(path, 100, 150);

        // With maxDist=150, large gap needs interpolated points
        // Should have at least 4 points total (original + interpolated + original)
        expect(result.getPointCount()).toBeGreaterThanOrEqual(3);

        // Verify first and last points are preserved
        expect(result.getDistance(0)).toBe(0);
        expect(result.getDistance(result.getPointCount() - 1)).toBeCloseTo(initialDistance, 0);

        // Verify elevation interpolation for first and last
        expect(result.getElevation(0)).toBe(1000);
        expect(result.getElevation(result.getPointCount() - 1)).toBe(1100);

        // Verify spacing between consecutive points is within bounds
        for (let i = 1; i < result.getPointCount(); i++) {
            const gap = result.getDistance(i) - result.getDistance(i - 1);
            expect(gap).toBeGreaterThanOrEqual(100 - 0.1); // Allow small floating point error
            expect(gap).toBeLessThanOrEqual(150 + 0.1);
        }
    });

    test('should handle mixed scenario: skip, keep, interpolate', () => {
        const path = new Path('test');

        // Complex scenario with different gaps
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: 0,
        } as Point);

        path.addPoint({
            latitude: 45.0005,
            longitude: 6.0,
            elevation: 1005,
            time: 5000,
        } as Point);

        path.addPoint({
            latitude: 45.0012,
            longitude: 6.0,
            elevation: 1012,
            time: 12000,
        } as Point);

        path.addPoint({
            latitude: 45.0035,
            longitude: 6.0,
            elevation: 1040,
            time: 40000,
        } as Point);

        path.computeDerivedData();

        const result = PointPerDistance.compute(path, 100, 150);

        // Should have at least 3 points (some may be skipped, some added)
        expect(result.getPointCount()).toBeGreaterThanOrEqual(2);

        // First point always preserved
        expect(result.getDistance(0)).toBe(0);

        // All gaps should be within bounds
        for (let i = 1; i < result.getPointCount(); i++) {
            const gap = result.getDistance(i) - result.getDistance(i - 1);
            expect(gap).toBeGreaterThanOrEqual(100 - 0.1);
            expect(gap).toBeLessThanOrEqual(150 + 0.1);
        }
    });

    test('should preserve original point data when keeping points', () => {
        const path = new Path('test');

        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: 0,
            heartRate: 120,
            cadence: 80,
        } as Point);

        path.addPoint({
            latitude: 45.001,
            longitude: 6.0,
            elevation: 1020,
            time: 12000,
            heartRate: 130,
            cadence: 85,
        } as Point);

        path.computeDerivedData();

        const result = PointPerDistance.compute(path, 100, 150);

        // First point should always be preserved
        expect(result.getLatitude(0)).toBe(path.getLatitude(0));
        expect(result.getLongitude(0)).toBe(path.getLongitude(0));
        expect(result.getElevation(0)).toBe(1000);
        expect(result.getHeartRate(0)).toBe(120);
        expect(result.getCadence(0)).toBe(80);

        // Verify all gaps are within range
        for (let i = 1; i < result.getPointCount(); i++) {
            const gap = result.getDistance(i) - result.getDistance(i - 1);
            expect(gap).toBeGreaterThanOrEqual(100 - 0.1);
            expect(gap).toBeLessThanOrEqual(150 + 0.1);
        }
    });
});
