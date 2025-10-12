import { Elevation } from '@/elevation/';
import { EMPTY_POINT, Path } from '@/types/path/';
import { toRadians } from '@/utils/';

describe('Elevation', () => {
    describe('fixElevation', () => {
        test('should process path with single point', async () => {
            const inputPath = new Path('test');
            inputPath.addPoint({
                ...EMPTY_POINT,
                latitude: toRadians(46.5197),
                longitude: toRadians(6.6323),
                elevation: 300,
                time: Date.now(),
            });

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(1);

            const resultPoint = result.getPointData(0);
            expect(resultPoint.latitude).toBeCloseTo(toRadians(46.5197), 6);
            expect(resultPoint.longitude).toBeCloseTo(toRadians(6.6323), 6);
            expect(resultPoint.elevation).toBe(100); // Mock elevation
        });

        test('should process path with multiple points', async () => {
            const inputPath = new Path('test');

            // Add multiple points along a route
            const points = [
                { latitude: 46.5197, longitude: 6.6323, elevation: 300 },
                { latitude: 46.52, longitude: 6.633, elevation: 310 },
                { latitude: 46.5203, longitude: 6.6337, elevation: 320 },
            ];

            points.forEach(point => {
                inputPath.addPoint({
                    ...EMPTY_POINT,
                    latitude: toRadians(point.latitude),
                    longitude: toRadians(point.longitude),
                    elevation: point.elevation,
                    time: Date.now(),
                });
            });

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(3);

            // Check that elevations follow the mock pattern (100 + index * 10)
            for (let i = 0; i < 3; i++) {
                const resultPoint = result.getPointData(i);
                expect(resultPoint.elevation).toBe(100 + i * 10);
            }
        });

        test('should process empty path', async () => {
            const inputPath = new Path('test');

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(0);
        });

        test('should preserve coordinates while updating elevation', async () => {
            const inputPath = new Path('test');
            const originalLat = toRadians(47.3769);
            const originalLon = toRadians(8.5417);

            inputPath.addPoint({
                ...EMPTY_POINT,
                latitude: originalLat,
                longitude: originalLon,
                elevation: 500,
                time: Date.now(),
            });

            const result = await Elevation.fixElevation(inputPath);

            const resultPoint = result.getPointData(0);
            expect(resultPoint.latitude).toBeCloseTo(originalLat, 6);
            expect(resultPoint.longitude).toBeCloseTo(originalLon, 6);
            expect(resultPoint.elevation).toBe(100); // Mock elevation replaces original
        });

        test('should handle path with varying coordinates', async () => {
            const inputPath = new Path('test');

            // Add points with different coordinates and elevations
            const testPoints = [
                { latitude: 45.0, longitude: 0.0, elevation: 0 },
                { latitude: 46.0, longitude: 1.0, elevation: 100 },
                { latitude: 47.0, longitude: 2.0, elevation: 200 },
                { latitude: 48.0, longitude: 3.0, elevation: 300 },
                { latitude: 49.0, longitude: 4.0, elevation: 400 },
            ];

            testPoints.forEach(point => {
                inputPath.addPoint({
                    ...EMPTY_POINT,
                    latitude: toRadians(point.latitude),
                    longitude: toRadians(point.longitude),
                    elevation: point.elevation,
                    time: Date.now(),
                });
            });

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(5);

            // Verify all points are processed and have mock elevations
            for (let i = 0; i < 5; i++) {
                const resultPoint = result.getPointData(i);
                const originalPoint = testPoints[i];

                expect(resultPoint.latitude).toBeCloseTo(toRadians(originalPoint.latitude), 6);
                expect(resultPoint.longitude).toBeCloseTo(toRadians(originalPoint.longitude), 6);
                expect(resultPoint.elevation).toBe(100 + i * 10); // Mock elevation pattern
            }
        });

        test('should create new path instance', async () => {
            const inputPath = new Path('test');
            inputPath.addPoint({
                ...EMPTY_POINT,
                latitude: toRadians(46.5197),
                longitude: toRadians(6.6323),
                elevation: 300,
                time: Date.now(),
            });

            const result = await Elevation.fixElevation(inputPath);

            // Should return a new path instance
            expect(result).not.toBe(inputPath);
            expect(result).toBeInstanceOf(Path);

            // Original path should remain unchanged
            expect(inputPath.getPointCount()).toBe(1);
            expect(inputPath.getPointData(0).elevation).toBe(300);

            // Result path should have corrected elevation
            expect(result.getPointCount()).toBe(1);
            expect(result.getPointData(0).elevation).toBe(100);
        });

        test('should handle large path with many points', async () => {
            const inputPath = new Path('test');

            // Create a path with 100 points
            for (let i = 0; i < 100; i++) {
                inputPath.addPoint({
                    ...EMPTY_POINT,
                    latitude: toRadians(46.0 + i * 0.001),
                    longitude: toRadians(6.0 + i * 0.001),
                    elevation: 1000 + i,
                    time: Date.now() + i * 1000,
                    distance: i * 10,
                    elapsed: i,
                });
            }

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(100);

            // Check that all points were processed
            for (let i = 0; i < 100; i++) {
                const resultPoint = result.getPointData(i);
                expect(resultPoint.elevation).toBe(100 + i * 10); // Mock elevation pattern
            }
        });

        test('should handle extreme coordinate values', async () => {
            const inputPath = new Path('test');

            // Add points with extreme but valid coordinate values
            const extremePoints = [
                { latitude: -89.0, longitude: -179.0, elevation: 0 },
                { latitude: 89.0, longitude: 179.0, elevation: 8848 }, // Mount Everest height
                { latitude: 0.0, longitude: 0.0, elevation: -400 }, // Below sea level
            ];

            extremePoints.forEach(point => {
                inputPath.addPoint({
                    ...EMPTY_POINT,
                    latitude: toRadians(point.latitude),
                    longitude: toRadians(point.longitude),
                    elevation: point.elevation,
                    time: Date.now(),
                });
            });

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(3);

            // Verify coordinates are preserved and elevations are updated
            for (let i = 0; i < 3; i++) {
                const resultPoint = result.getPointData(i);
                const originalPoint = extremePoints[i];

                expect(resultPoint.latitude).toBeCloseTo(toRadians(originalPoint.latitude), 6);
                expect(resultPoint.longitude).toBeCloseTo(toRadians(originalPoint.longitude), 6);
                expect(resultPoint.elevation).toBe(100 + i * 10); // Mock elevation pattern
            }
        });
    });
});
