import { DouglasPeucker } from '@/processing/';
import { Path, Point } from '@/types/path/';

describe('DouglasPeucker', () => {
    test('should return path unchanged with < 2 points', () => {
        const path = new Path('test');
        path.addPoint({
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 0,
            grade: 0,
            bearing: 0,
        } as Point);

        const simplified = DouglasPeucker.simplify(path, 10);

        expect(simplified.getPointCount()).toBe(1);
    });

    test('should simplify straight line to endpoints only', () => {
        const path = new Path('test');
        const baseTime = Date.now();

        // Straight line: 5 points
        for (let i = 0; i < 5; i++) {
            path.addPoint({
                lat: 45.0 + i * 0.001,
                lon: 6.0,
                ele: 1000,
                time: baseTime + i * 1000,
                dist: i * 100,
                speed: 10,
                grade: 0,
                bearing: 0,
            } as Point);
        }

        const simplified = DouglasPeucker.simplify(path, 100, 1); // 100m tolerance, no elevation exaggeration

        // Should keep only first and last points (straight line)
        expect(simplified.getPointCount()).toBe(2);
    });

    test('should preserve significant elevation changes', () => {
        const path = new Path('test');
        const baseTime = Date.now();

        // Path with peak in middle
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
            ele: 1050,
            time: baseTime + 1000,
            dist: 100,
            speed: 10,
            grade: 0.5,
            bearing: 0,
        } as Point);
        path.addPoint({
            lat: 45.002,
            lon: 6.0,
            ele: 1100,
            time: baseTime + 2000,
            dist: 200,
            speed: 10,
            grade: 0.5,
            bearing: 0,
        } as Point); // Peak
        path.addPoint({
            lat: 45.003,
            lon: 6.0,
            ele: 1050,
            time: baseTime + 3000,
            dist: 300,
            speed: 10,
            grade: -0.5,
            bearing: 0,
        } as Point);
        path.addPoint({
            lat: 45.004,
            lon: 6.0,
            ele: 1000,
            time: baseTime + 4000,
            dist: 400,
            speed: 10,
            grade: -0.5,
            bearing: 0,
        } as Point);

        const simplified = DouglasPeucker.simplify(path, 10, 3); // Elevation exaggerated

        // Should keep peak point plus endpoints
        expect(simplified.getPointCount()).toBeGreaterThan(2);
    });

    test('should use custom elevation exaggeration', () => {
        const path = new Path('test');
        const baseTime = Date.now();

        for (let i = 0; i < 3; i++) {
            path.addPoint({
                lat: 45.0 + i * 0.001,
                lon: 6.0,
                ele: 1000 + i * 10,
                time: baseTime + i * 1000,
                dist: i * 100,
                speed: 10,
                grade: 0.1,
                bearing: 0,
            } as Point);
        }

        const simplified1 = DouglasPeucker.simplify(path, 5, 1);
        const simplified2 = DouglasPeucker.simplify(path, 5, 10);

        // Different exaggeration may affect simplification
        expect(simplified2.getPointCount()).toBeGreaterThanOrEqual(simplified1.getPointCount());
    });
});
