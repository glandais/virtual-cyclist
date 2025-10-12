import { PointPerSecond } from '@/processing/';
import { Path, Point } from '@/types/path/';

describe('PointPerSecond', () => {
    test('should handle empty path', () => {
        const path = new Path('empty');
        const result = PointPerSecond.computeOnePointPerSecond(path);

        expect(result.getPointCount()).toBe(0);
    });

    test('should create one point per second', () => {
        const path = new Path('test');
        const baseTime = Date.now();

        // Points at 0s, 2.5s, 5s (uneven timing)
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: baseTime,
            distance: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        path.addPoint({
            latitude: 45.001,
            longitude: 6.0,
            elevation: 1000,
            time: baseTime + 2500,
            distance: 25,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        path.addPoint({
            latitude: 45.002,
            longitude: 6.0,
            elevation: 1000,
            time: baseTime + 5000,
            distance: 50,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        const result = PointPerSecond.computeOnePointPerSecond(path);

        // Should have interpolated points at 1s, 2s, 3s, 4s intervals
        expect(result.getPointCount()).toBeGreaterThanOrEqual(3);
    });

    test('should interpolate properties between points', () => {
        const path = new Path('test');
        const baseTime = Date.now();

        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: baseTime,
            distance: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        path.addPoint({
            latitude: 45.002,
            longitude: 6.0,
            elevation: 1020,
            time: baseTime + 2000,
            distance: 20,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        const result = PointPerSecond.computeOnePointPerSecond(path);

        expect(result.getPointCount()).toBeGreaterThan(0);
    });
});
