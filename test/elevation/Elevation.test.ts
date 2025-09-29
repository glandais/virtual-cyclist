import { Elevation } from '../../src/elevation/Elevation';
import { Path } from '../../src/Path';
import { toRadians } from '../../src/constants';

describe('Elevation', () => {
    describe('fixElevation', () => {
        test('should process path with single point', async () => {
            const inputPath = new Path('test');
            inputPath.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 300,
                time: Date.now(),
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                power: 0,
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
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(1);

            const resultPoint = result.getPointData(0);
            expect(resultPoint.lat).toBeCloseTo(toRadians(46.5197), 6);
            expect(resultPoint.lon).toBeCloseTo(toRadians(6.6323), 6);
            expect(resultPoint.ele).toBe(100); // Mock elevation
        });

        test('should process path with multiple points', async () => {
            const inputPath = new Path('test');

            // Add multiple points along a route
            const points = [
                { lat: 46.5197, lon: 6.6323, ele: 300 },
                { lat: 46.52, lon: 6.633, ele: 310 },
                { lat: 46.5203, lon: 6.6337, ele: 320 },
            ];

            points.forEach(point => {
                inputPath.addPoint({
                    lat: toRadians(point.lat),
                    lon: toRadians(point.lon),
                    ele: point.ele,
                    time: Date.now(),
                    bearing: 0,
                    dist: 0,
                    radius: 0,
                    elapsed: 0,
                    power: 0,
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
                    speed: 0,
                    speedMax: 0,
                    speedMaxIncline: 0,
                    virtSpeedCurrent: 0,
                    temperature: 0,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,
                    heartRate: 0,
                    cadence: 0,
                });
            });

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(3);

            // Check that elevations follow the mock pattern (100 + index * 10)
            for (let i = 0; i < 3; i++) {
                const resultPoint = result.getPointData(i);
                expect(resultPoint.ele).toBe(100 + i * 10);
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
                lat: originalLat,
                lon: originalLon,
                ele: 500,
                time: Date.now(),
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                power: 0,
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
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            const result = await Elevation.fixElevation(inputPath);

            const resultPoint = result.getPointData(0);
            expect(resultPoint.lat).toBeCloseTo(originalLat, 6);
            expect(resultPoint.lon).toBeCloseTo(originalLon, 6);
            expect(resultPoint.ele).toBe(100); // Mock elevation replaces original
        });

        test('should handle path with varying coordinates', async () => {
            const inputPath = new Path('test');

            // Add points with different coordinates and elevations
            const testPoints = [
                { lat: 45.0, lon: 0.0, ele: 0 },
                { lat: 46.0, lon: 1.0, ele: 100 },
                { lat: 47.0, lon: 2.0, ele: 200 },
                { lat: 48.0, lon: 3.0, ele: 300 },
                { lat: 49.0, lon: 4.0, ele: 400 },
            ];

            testPoints.forEach(point => {
                inputPath.addPoint({
                    lat: toRadians(point.lat),
                    lon: toRadians(point.lon),
                    ele: point.ele,
                    time: Date.now(),
                    bearing: 0,
                    dist: 0,
                    radius: 0,
                    elapsed: 0,
                    power: 0,
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
                    speed: 0,
                    speedMax: 0,
                    speedMaxIncline: 0,
                    virtSpeedCurrent: 0,
                    temperature: 0,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,
                    heartRate: 0,
                    cadence: 0,
                });
            });

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(5);

            // Verify all points are processed and have mock elevations
            for (let i = 0; i < 5; i++) {
                const resultPoint = result.getPointData(i);
                const originalPoint = testPoints[i];

                expect(resultPoint.lat).toBeCloseTo(toRadians(originalPoint.lat), 6);
                expect(resultPoint.lon).toBeCloseTo(toRadians(originalPoint.lon), 6);
                expect(resultPoint.ele).toBe(100 + i * 10); // Mock elevation pattern
            }
        });

        test('should create new path instance', async () => {
            const inputPath = new Path('test');
            inputPath.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 300,
                time: Date.now(),
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                power: 0,
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
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            const result = await Elevation.fixElevation(inputPath);

            // Should return a new path instance
            expect(result).not.toBe(inputPath);
            expect(result).toBeInstanceOf(Path);

            // Original path should remain unchanged
            expect(inputPath.getPointCount()).toBe(1);
            expect(inputPath.getPointData(0).ele).toBe(300);

            // Result path should have corrected elevation
            expect(result.getPointCount()).toBe(1);
            expect(result.getPointData(0).ele).toBe(100);
        });

        test('should handle large path with many points', async () => {
            const inputPath = new Path('test');

            // Create a path with 100 points
            for (let i = 0; i < 100; i++) {
                inputPath.addPoint({
                    lat: toRadians(46.0 + i * 0.001),
                    lon: toRadians(6.0 + i * 0.001),
                    ele: 1000 + i,
                    time: Date.now() + i * 1000,
                    bearing: 0,
                    dist: i * 10,
                    radius: 0,
                    elapsed: i,
                    power: 0,
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
                    speed: 0,
                    speedMax: 0,
                    speedMaxIncline: 0,
                    virtSpeedCurrent: 0,
                    temperature: 0,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,
                    heartRate: 0,
                    cadence: 0,
                });
            }

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(100);

            // Check that all points were processed
            for (let i = 0; i < 100; i++) {
                const resultPoint = result.getPointData(i);
                expect(resultPoint.ele).toBe(100 + i * 10); // Mock elevation pattern
            }
        });

        test('should handle extreme coordinate values', async () => {
            const inputPath = new Path('test');

            // Add points with extreme but valid coordinate values
            const extremePoints = [
                { lat: -89.0, lon: -179.0, ele: 0 },
                { lat: 89.0, lon: 179.0, ele: 8848 }, // Mount Everest height
                { lat: 0.0, lon: 0.0, ele: -400 }, // Below sea level
            ];

            extremePoints.forEach(point => {
                inputPath.addPoint({
                    lat: toRadians(point.lat),
                    lon: toRadians(point.lon),
                    ele: point.ele,
                    time: Date.now(),
                    bearing: 0,
                    dist: 0,
                    radius: 0,
                    elapsed: 0,
                    power: 0,
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
                    speed: 0,
                    speedMax: 0,
                    speedMaxIncline: 0,
                    virtSpeedCurrent: 0,
                    temperature: 0,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,
                    heartRate: 0,
                    cadence: 0,
                });
            });

            const result = await Elevation.fixElevation(inputPath);

            expect(result.getPointCount()).toBe(3);

            // Verify coordinates are preserved and elevations are updated
            for (let i = 0; i < 3; i++) {
                const resultPoint = result.getPointData(i);
                const originalPoint = extremePoints[i];

                expect(resultPoint.lat).toBeCloseTo(toRadians(originalPoint.lat), 6);
                expect(resultPoint.lon).toBeCloseTo(toRadians(originalPoint.lon), 6);
                expect(resultPoint.ele).toBe(100 + i * 10); // Mock elevation pattern
            }
        });
    });
});
