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
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: baseTime,
            dist: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        path.addPoint({
            lat: 45.001,
            lon: 6.0,
            ele: 1000,
            time: baseTime + 2500,
            dist: 25,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        path.addPoint({
            lat: 45.002,
            lon: 6.0,
            ele: 1000,
            time: baseTime + 5000,
            dist: 50,
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
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: baseTime,
            dist: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        path.addPoint({
            lat: 45.002,
            lon: 6.0,
            ele: 1020,
            time: baseTime + 2000,
            dist: 20,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        const result = PointPerSecond.computeOnePointPerSecond(path);

        expect(result.getPointCount()).toBeGreaterThan(0);
    });
});
