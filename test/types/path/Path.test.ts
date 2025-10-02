import { EMPTY_POINT, Path, Point } from '@/types/path/';
import { toRadians } from '@/utils/';

describe('Path', () => {
    let pathData: Path;

    beforeEach(() => {
        pathData = new Path('example');
    });

    describe('constructor and basic properties', () => {
        it('should initialize with empty data', () => {
            expect(pathData.length).toBe(0);
            expect(pathData.capacity).toBeGreaterThan(0);
        });

        it('should have initial capacity for at least 2000 points', () => {
            expect(pathData.capacity).toBeGreaterThanOrEqual(2000);
        });

        it('should provide memory info', () => {
            const memInfo = pathData.getMemoryInfo();
            expect(memInfo.chunksCount).toBeGreaterThan(0);
            expect(memInfo.pointsCapacity).toBeGreaterThanOrEqual(2000);
            expect(memInfo.usedPoints).toBe(0);
            expect(memInfo.memoryMB).toBeGreaterThan(0);
        });
    });

    describe('single point operations', () => {
        const samplePoint: Point = {
            ...EMPTY_POINT,
            // Spatial & Navigation
            lat: toRadians(48.8566),
            lon: toRadians(2.3522),
            ele: 35,
            bearing: 45.5,
            dist: 1234.5,
            radius: 50.0,

            // Temporal
            time: Date.now(),
            elapsed: 3600000, // 1 hour in ms

            // Physics & Power
            power: 250,
            pCyclistRaw: 240,
            pCyclistWheel: 230,
            pCyclistOptimalPower: 245,
            pAero: -80,
            pGravity: -20,
            pRollingResistance: -15,
            pWheelBearings: -5,
            pPowerFromAcc: 10,
            pPowerWheelFromAcc: 9,
            aeroCoef: 0.7,
            grade: 3.5,

            // Speed & Motion
            speed: 15.5, // m/s
            speedMax: 25.0,
            speedMaxIncline: 12.0,
            virtSpeedCurrent: 15.2,

            // Environmental
            temperature: 20.5,
            windSpeed: 5.0,
            windDirection: 180,
            windBearing: 90,
            windAlpha: 30,

            // Physiological
            heartRate: 150,
            cadence: 90,
        };

        it('should add a point and return correct index', () => {
            const index = pathData.addPoint(samplePoint);
            expect(index).toBe(0);
            expect(pathData.length).toBe(1);
        });

        it('should retrieve point data correctly', () => {
            pathData.addPoint(samplePoint);
            const retrieved = pathData.getPointData(0);

            // Check spatial data
            expect(retrieved.lat).toBe(samplePoint.lat);
            expect(retrieved.lon).toBe(samplePoint.lon);
            expect(retrieved.ele).toBe(samplePoint.ele);
            expect(retrieved.bearing).toBe(samplePoint.bearing);
            expect(retrieved.dist).toBe(samplePoint.dist);
            expect(retrieved.radius).toBe(samplePoint.radius);

            // Check temporal data
            expect(retrieved.time).toBe(samplePoint.time);
            expect(retrieved.elapsed).toBe(samplePoint.elapsed);

            // Check physics data
            expect(retrieved.power).toBe(samplePoint.power);
            expect(retrieved.pCyclistRaw).toBe(samplePoint.pCyclistRaw);
            expect(retrieved.grade).toBe(samplePoint.grade);

            // Check environmental data
            expect(retrieved.temperature).toBe(samplePoint.temperature);
            expect(retrieved.windSpeed).toBe(samplePoint.windSpeed);

            // Check physiological data
            expect(retrieved.heartRate).toBe(samplePoint.heartRate);
            expect(retrieved.cadence).toBe(samplePoint.cadence);
        });

        it('should handle individual field access correctly', () => {
            pathData.addPoint(samplePoint);

            // Test spatial accessors
            expect(pathData.getLatitude(0)).toBe(samplePoint.lat);
            expect(pathData.getLongitude(0)).toBe(samplePoint.lon);
            expect(pathData.getElevation(0)).toBe(samplePoint.ele);
            expect(pathData.getBearing(0)).toBe(samplePoint.bearing);
            expect(pathData.getDistance(0)).toBe(samplePoint.dist);
            expect(pathData.getRadius(0)).toBe(samplePoint.radius);

            // Test temporal accessors
            expect(pathData.getTime(0)).toBe(samplePoint.time);
            expect(pathData.getElapsed(0)).toBe(samplePoint.elapsed);

            // Test physics accessors
            expect(pathData.getPower(0)).toBe(samplePoint.power);
            expect(pathData.getSpeed(0)).toBe(samplePoint.speed);
            expect(pathData.getGrade(0)).toBe(samplePoint.grade);

            // Test environmental accessors
            expect(pathData.getTemperature(0)).toBe(samplePoint.temperature);
            expect(pathData.getWindSpeed(0)).toBe(samplePoint.windSpeed);

            // Test physiological accessors
            expect(pathData.getHeartRate(0)).toBe(samplePoint.heartRate);
            expect(pathData.getCadence(0)).toBe(samplePoint.cadence);
        });

        it('should handle individual field setting correctly', () => {
            pathData.addPoint(samplePoint);

            // Test spatial setters
            pathData.setLatitude(0, 49.0);
            expect(pathData.getLatitude(0)).toBe(49.0);

            pathData.setLongitude(0, 3.0);
            expect(pathData.getLongitude(0)).toBe(3.0);

            pathData.setElevation(0, 100);
            expect(pathData.getElevation(0)).toBe(100);

            // Test temporal setters
            const newTime = Date.now() + 1000;
            pathData.setTime(0, newTime);
            expect(pathData.getTime(0)).toBe(newTime);

            pathData.setElapsed(0, 7200000); // 2 hours
            expect(pathData.getElapsed(0)).toBe(7200000);

            // Test physics setters
            pathData.setPower(0, 300);
            expect(pathData.getPower(0)).toBe(300);

            pathData.setSpeed(0, 20.0);
            expect(pathData.getSpeed(0)).toBe(20.0);

            // Test environmental setters
            pathData.setTemperature(0, 25.0);
            expect(pathData.getTemperature(0)).toBe(25.0);

            pathData.setWindSpeed(0, 10.0);
            expect(pathData.getWindSpeed(0)).toBe(10.0);

            // Test physiological setters
            pathData.setHeartRate(0, 160);
            expect(pathData.getHeartRate(0)).toBe(160);

            pathData.setCadence(0, 95);
            expect(pathData.getCadence(0)).toBe(95);
        });

        it('should handle Date conversion for time field', () => {
            pathData.addPoint(samplePoint);

            const testDate = new Date('2024-01-01T12:00:00Z');
            pathData.setTime(0, testDate);
            expect(pathData.getTime(0)).toBe(testDate.getTime());

            const retrievedDate = pathData.getTimeAsDate(0);
            expect(retrievedDate.getTime()).toBe(testDate.getTime());
        });
    });

    describe('multiple points and chunk management', () => {
        it('should handle multiple points correctly', () => {
            const points: Point[] = [];
            for (let i = 0; i < 5; i++) {
                points.push({
                    ...EMPTY_POINT,
                    lat: toRadians(48.8566 + i * 0.001),
                    lon: toRadians(2.3522 + i * 0.001),
                    ele: 35 + i,
                    bearing: 45.5 + i,
                    dist: 1234.5 + i * 100,
                    radius: 50.0 + i,
                    time: Date.now() + i * 1000,
                    elapsed: 3600000 + i * 1000,
                    power: 250 + i,
                    pCyclistRaw: 240 + i,
                    pCyclistWheel: 230 + i,
                    pCyclistOptimalPower: 245 + i,
                    pAero: -80 - i,
                    pGravity: -20 - i,
                    pRollingResistance: -15 - i,
                    pWheelBearings: -5 - i,
                    pPowerFromAcc: 10 + i,
                    pPowerWheelFromAcc: 9 + i,
                    aeroCoef: 0.7 + i * 0.01,
                    grade: 3.5 + i * 0.1,
                    speed: 15.5 + i * 0.5,
                    speedMax: 25.0 + i,
                    speedMaxIncline: 12.0 + i,
                    virtSpeedCurrent: 15.2 + i * 0.5,
                    temperature: 20.5 + i,
                    windSpeed: 5.0 + i,
                    windDirection: 180 + i * 10,
                    windBearing: 90 + i * 10,
                    windAlpha: 30 + i * 5,
                    heartRate: 150 + i,
                    cadence: 90 + i,
                });
            }

            // Add all points
            for (let i = 0; i < points.length; i++) {
                const index = pathData.addPoint(points[i]);
                expect(index).toBe(i);
            }

            expect(pathData.length).toBe(5);

            // Verify all points can be retrieved correctly
            for (let i = 0; i < points.length; i++) {
                const retrieved = pathData.getPointData(i);
                expect(retrieved.lat).toBe(points[i].lat);
                expect(retrieved.power).toBe(points[i].power);
                expect(retrieved.heartRate).toBe(points[i].heartRate);
            }
        });

        it('should automatically allocate new chunks when needed', () => {
            const initialMemInfo = pathData.getMemoryInfo();
            const initialCapacity = pathData.capacity;

            // Add enough points to exceed initial capacity
            const pointsToAdd = initialCapacity + 100;
            for (let i = 0; i < pointsToAdd; i++) {
                pathData.addPoint({
                    ...EMPTY_POINT,
                    lat: toRadians(48.8566 + i * 0.001),
                    lon: toRadians(2.3522 + i * 0.001),
                    ele: 35,
                    bearing: 0,
                    dist: i,
                    radius: 0,
                    time: Date.now() + i * 1000,
                    elapsed: i * 1000,
                    power: 250,
                    pCyclistRaw: 240,
                    pCyclistWheel: 230,
                    pCyclistOptimalPower: 245,

                    pAero: -80,
                    pGravity: -20,
                    pRollingResistance: -15,
                    pWheelBearings: -5,
                    pPowerFromAcc: 10,
                    pPowerWheelFromAcc: 9,
                    aeroCoef: 0.7,
                    grade: 0,
                    speed: 15,
                    speedMax: 25,
                    speedMaxIncline: 12,
                    virtSpeedCurrent: 15,
                    temperature: 20,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,
                    heartRate: 150,
                    cadence: 90,
                });
            }

            expect(pathData.length).toBe(pointsToAdd);
            expect(pathData.capacity).toBeGreaterThan(initialCapacity);

            const finalMemInfo = pathData.getMemoryInfo();
            expect(finalMemInfo.chunksCount).toBeGreaterThan(initialMemInfo.chunksCount);

            // Verify we can still access all points correctly
            expect(pathData.getLatitude(0)).toBe(toRadians(48.8566));
            expect(pathData.getLatitude(pointsToAdd - 1)).toBe(
                toRadians(48.8566 + (pointsToAdd - 1) * 0.001)
            );
        });
    });

    describe('batch operations', () => {
        beforeEach(() => {
            // Add test data
            for (let i = 0; i < 10; i++) {
                pathData.addPoint({
                    ...EMPTY_POINT,
                    lat: toRadians(48.8566 + i * 0.001),
                    lon: toRadians(2.3522 + i * 0.001),
                    ele: 35 + i,
                    bearing: 0,
                    dist: i * 100,
                    radius: 0,
                    time: Date.now() + i * 1000,
                    elapsed: i * 1000,
                    power: 250 + i,
                    pCyclistRaw: 240,
                    pCyclistWheel: 230,
                    pCyclistOptimalPower: 245,
                    pAero: -80,
                    pGravity: -20,
                    pRollingResistance: -15,
                    pWheelBearings: -5,
                    pPowerFromAcc: 10,
                    pPowerWheelFromAcc: 9,
                    aeroCoef: 0.7,
                    grade: 0,
                    speed: 15 + i,
                    speedMax: 25,
                    speedMaxIncline: 12,
                    virtSpeedCurrent: 15,
                    temperature: 20,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,
                    heartRate: 150 + i,
                    cadence: 90,
                });
            }
        });

        it('should get point range correctly', () => {
            const range = pathData.getPointRange(2, 3);
            expect(range).toHaveLength(3);

            expect(range[0].lat).toBe(toRadians(48.8566 + 2 * 0.001));
            expect(range[0].power).toBe(252);
            expect(range[1].lat).toBe(toRadians(48.8566 + 3 * 0.001));
            expect(range[1].power).toBe(253);
            expect(range[2].lat).toBe(toRadians(48.8566 + 4 * 0.001));
            expect(range[2].power).toBe(254);
        });

        it('should handle iteration correctly', () => {
            const allPoints = Array.from(pathData);
            expect(allPoints).toHaveLength(10);

            for (let i = 0; i < allPoints.length; i++) {
                expect(allPoints[i].lat).toBe(toRadians(48.8566 + i * 0.001));
                expect(allPoints[i].power).toBe(250 + i);
            }
        });

        it('should handle coordinates iteration correctly', () => {
            const coords: Array<{ latitude: number; longitude: number; elevation?: number }> = [];
            for (const coord of pathData.coordinatesIterator()) {
                coords.push(coord);
            }
            expect(coords).toHaveLength(10);

            for (let i = 0; i < coords.length; i++) {
                expect(coords[i].latitude).toBeCloseTo(48.8566 + i * 0.001, 10);
                expect(coords[i].longitude).toBeCloseTo(2.3522 + i * 0.001, 10);
                expect(coords[i].elevation).toBe(35 + i);
            }
        });

        it('should clear data correctly', () => {
            expect(pathData.length).toBe(10);

            pathData.clear();
            expect(pathData.length).toBe(0);
            expect(pathData.capacity).toBeGreaterThan(0); // Should keep initial capacity
        });

        it('should clear data and shrink chunks when too many chunks exist', () => {
            // Add enough points to force more than initial chunks
            const pointsToAdd = 5000; // Force multiple chunks
            for (let i = 0; i < pointsToAdd; i++) {
                pathData.addPoint({
                    ...EMPTY_POINT,
                    lat: 48.8566,
                    lon: 2.3522,
                    ele: 35,
                    bearing: 0,
                    dist: 0,
                    radius: 0,
                    time: Date.now(),
                    elapsed: 0,
                    power: 250,
                    pCyclistRaw: 240,
                    pCyclistWheel: 230,
                    pCyclistOptimalPower: 245,
                    pAero: -80,
                    pGravity: -20,
                    pRollingResistance: -15,
                    pWheelBearings: -5,
                    pPowerFromAcc: 10,
                    pPowerWheelFromAcc: 9,
                    aeroCoef: 0.7,
                    grade: 0,
                    speed: 15,
                    speedMax: 25,
                    speedMaxIncline: 12,
                    virtSpeedCurrent: 15,
                    temperature: 20,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,
                    heartRate: 150,
                    cadence: 90,
                });
            }

            const memInfoBeforeClear = pathData.getMemoryInfo();
            expect(memInfoBeforeClear.chunksCount).toBeGreaterThan(2);

            pathData.clear();
            const memInfoAfterClear = pathData.getMemoryInfo();

            expect(pathData.length).toBe(0);
            expect(memInfoAfterClear.chunksCount).toBe(2); // Should shrink to initial chunks
        });
    });

    describe('error handling', () => {
        it('should throw error for invalid point index in getField', () => {
            expect(() => pathData.getLatitude(-1)).toThrow('Point index -1 out of bounds');
            expect(() => pathData.getLatitude(0)).toThrow('Point index 0 out of bounds');

            pathData.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(48.8566),
                lon: toRadians(2.3522),
                ele: 35,
                bearing: 0,
                dist: 0,
                radius: 0,
                time: Date.now(),
                elapsed: 0,
                power: 250,
                pCyclistRaw: 240,
                pCyclistWheel: 230,
                pCyclistOptimalPower: 245,
                pAero: -80,
                pGravity: -20,
                pRollingResistance: -15,
                pWheelBearings: -5,
                pPowerFromAcc: 10,
                pPowerWheelFromAcc: 9,
                aeroCoef: 0.7,
                grade: 0,
                speed: 15,
                speedMax: 25,
                speedMaxIncline: 12,
                virtSpeedCurrent: 15,
                temperature: 20,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 150,
                cadence: 90,
            });

            expect(() => pathData.getLatitude(1)).toThrow('Point index 1 out of bounds');
        });

        it('should throw error for invalid point index in setField', () => {
            expect(() => pathData.setLatitude(-1, 48.0)).toThrow('Point index -1 out of bounds');
            expect(() => pathData.setLatitude(0, 48.0)).toThrow('Point index 0 out of bounds');
        });

        it('should throw error for invalid range in getPointRange', () => {
            pathData.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(48.8566),
                lon: toRadians(2.3522),
                ele: 35,
                bearing: 0,
                dist: 0,
                radius: 0,
                time: Date.now(),
                elapsed: 0,
                power: 250,
                pCyclistRaw: 240,
                pCyclistWheel: 230,
                pCyclistOptimalPower: 245,
                pAero: -80,
                pGravity: -20,
                pRollingResistance: -15,
                pWheelBearings: -5,
                pPowerFromAcc: 10,
                pPowerWheelFromAcc: 9,
                aeroCoef: 0.7,
                grade: 0,
                speed: 15,
                speedMax: 25,
                speedMaxIncline: 12,
                virtSpeedCurrent: 15,
                temperature: 20,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 150,
                cadence: 90,
            });

            expect(() => pathData.getPointRange(-1, 1)).toThrow('Start index -1 out of bounds');
            expect(() => pathData.getPointRange(1, 1)).toThrow('Start index 1 out of bounds');
            expect(() => pathData.getPointRange(0, 2)).toThrow(
                'Range [0, 2) exceeds point count 1'
            );
        });
    });

    describe('field accessor methods', () => {
        beforeEach(() => {
            // Add a test point with known values
            pathData.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(48.8566),
                lon: toRadians(2.3522),
                ele: 35,
                bearing: 45.5,
                dist: 1234.5,
                radius: 50.0,
                time: Date.now(),
                elapsed: 3600000,
                power: 250,
                pCyclistRaw: 240,
                pCyclistWheel: 230,
                pCyclistOptimalPower: 245,
                pAero: -80,
                pGravity: -20,
                pRollingResistance: -15,
                pWheelBearings: -5,
                pPowerFromAcc: 10,
                pPowerWheelFromAcc: 9,
                aeroCoef: 0.7,
                grade: 0.05,
                speed: 15.5,
                speedMax: 18.0,
                speedMaxIncline: 16.0,
                virtSpeedCurrent: 15.5,
                temperature: 20,
                windSpeed: 2.0,
                windDirection: 180,
                windBearing: 170,
                windAlpha: 10,
                heartRate: 150,
                cadence: 90,
            });
        });

        it('should handle speedMaxIncline field', () => {
            expect(pathData.getSpeedMaxIncline(0)).toBe(16.0);
            pathData.setSpeedMaxIncline(0, 14.5);
            expect(pathData.getSpeedMaxIncline(0)).toBe(14.5);
        });
    });

    describe('computeDerivedData method', () => {
        it('should handle empty path correctly', () => {
            // Test early return for empty path
            expect(() => pathData.computeDerivedData()).not.toThrow();
            expect(pathData.getTotalDistance()).toBe(0);
            expect(pathData.getMinElevation()).toBe(0);
            expect(pathData.getMaxElevation()).toBe(0);
        });

        it('should calculate speed when time difference exists', () => {
            // Add points with time and distance differences to trigger speed calculation
            const baseTime = Date.now();
            pathData.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(45.0),
                lon: toRadians(2.0),
                ele: 100,
                bearing: 0,
                dist: 0,
                radius: 0,
                time: baseTime,
                elapsed: 0,
                power: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0.7,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 20,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            pathData.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(45.001),
                lon: toRadians(2.001),
                ele: 105,
                bearing: 0,
                dist: 100, // 100 meter distance
                radius: 0,
                time: baseTime + 10000, // 10 seconds later
                elapsed: 10000,
                power: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0.7,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 20,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            pathData.computeDerivedData();

            // Speed calculation should trigger the code path (actual value depends on algorithm)
            expect(pathData.getSpeed(0)).toBeGreaterThan(0);
            // Grade calculation should be positive (actual value depends on distance calculation)
            expect(pathData.getGrade(0)).toBeGreaterThan(0);
        });
    });

    describe('statistics methods', () => {
        beforeEach(() => {
            // Add test points with varying elevations
            pathData.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(45.0),
                lon: toRadians(2.0),
                ele: 100,
                bearing: 0,
                dist: 0,
                radius: 0,
                time: Date.now(),
                elapsed: 0,
                power: 250,
                pCyclistRaw: 240,
                pCyclistWheel: 230,
                pCyclistOptimalPower: 245,
                pAero: -80,
                pGravity: -20,
                pRollingResistance: -15,
                pWheelBearings: -5,
                pPowerFromAcc: 10,
                pPowerWheelFromAcc: 9,
                aeroCoef: 0.7,
                grade: 0.05,
                speed: 15.5,
                speedMax: 18.0,
                speedMaxIncline: 16.0,
                virtSpeedCurrent: 15.5,
                temperature: 20,
                windSpeed: 2.0,
                windDirection: 180,
                windBearing: 170,
                windAlpha: 10,
                heartRate: 150,
                cadence: 90,
            });

            const p = {
                ...EMPTY_POINT,
                lat: toRadians(45.001),
                lon: toRadians(2.001),
                ele: 150, // Higher elevation
                bearing: 0,
                dist: 1000,
                radius: 0,
                time: Date.now() + 60000,
                elapsed: 60000,
                power: 250,
                pCyclistRaw: 240,
                pCyclistWheel: 230,
                pCyclistOptimalPower: 245,
                pAero: -80,
                pGravity: -20,
                pRollingResistance: -15,
                pWheelBearings: -5,
                pPowerFromAcc: 10,
                pPowerWheelFromAcc: 9,
                aeroCoef: 0.7,
                grade: 0.05,
                speed: 15.5,
                speedMax: 18.0,
                speedMaxIncline: 16.0,
                virtSpeedCurrent: 15.5,
                temperature: 20,
                windSpeed: 2.0,
                windDirection: 180,
                windBearing: 170,
                windAlpha: 10,
                heartRate: 150,
                cadence: 90,
            };

            pathData.addPoint(p);
            pathData.addPoint(p);

            pathData.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(45.002),
                lon: toRadians(2.002),
                ele: 80, // Lower elevation
                bearing: 0,
                dist: 2000,
                radius: 0,
                time: Date.now() + 120000,
                elapsed: 120000,
                power: 250,
                pCyclistRaw: 240,
                pCyclistWheel: 230,
                pCyclistOptimalPower: 245,
                pAero: -80,
                pGravity: -20,
                pRollingResistance: -15,
                pWheelBearings: -5,
                pPowerFromAcc: 10,
                pPowerWheelFromAcc: 9,
                aeroCoef: 0.7,
                grade: 0.05,
                speed: 15.5,
                speedMax: 18.0,
                speedMaxIncline: 16.0,
                virtSpeedCurrent: 15.5,
                temperature: 20,
                windSpeed: 2.0,
                windDirection: 180,
                windBearing: 170,
                windAlpha: 10,
                heartRate: 150,
                cadence: 90,
            });
        });

        it('should calculate elevation statistics', () => {
            pathData.computeDerivedData();
            expect(pathData.getMinElevation()).toBe(80);
            expect(pathData.getMaxElevation()).toBe(150);
            expect(pathData.getTotalElevationGain()).toBeGreaterThan(0);
            // Note: getTotalElevationLoss returns negative values, so check it's less than 0
            expect(pathData.getTotalElevationLoss()).toBeLessThan(0);
        });

        it('should calculate distance statistics', () => {
            pathData.computeDerivedData();
            expect(pathData.getTotalDistance()).toBeGreaterThan(0);
        });
    });

    describe('geographic bounds and enhancement status', () => {
        it('should return bounds and check enhancement status', () => {
            // Add points to create bounds
            pathData.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(45.0),
                lon: toRadians(2.0),
                ele: 100,
                bearing: 0,
                dist: 0,
                radius: 0,
                time: Date.now(),
                elapsed: 0,
                power: 250,
                pCyclistRaw: 240,
                pCyclistWheel: 230,
                pCyclistOptimalPower: 245,
                pAero: -80,
                pGravity: -20,
                pRollingResistance: -15,
                pWheelBearings: -5,
                pPowerFromAcc: 10,
                pPowerWheelFromAcc: 9,
                aeroCoef: 0.7,
                grade: 0.05,
                speed: 15.5,
                speedMax: 18.0,
                speedMaxIncline: 16.0,
                virtSpeedCurrent: 15.5,
                temperature: 20,
                windSpeed: 2.0,
                windDirection: 180,
                windBearing: 170,
                windAlpha: 10,
                heartRate: 150,
                cadence: 90,
            });
            pathData.computeDerivedData();

            const bounds = pathData.getBounds();
            expect(bounds).toHaveProperty('minLat');
            expect(bounds).toHaveProperty('maxLat');
            expect(bounds).toHaveProperty('minLon');
            expect(bounds).toHaveProperty('maxLon');
            expect(bounds.minLat).toBeCloseTo(toRadians(45.0), 5);
            expect(bounds.maxLat).toBeCloseTo(toRadians(45.0), 5);
        });
    });

    describe('distance calculation edge cases', () => {
        it('should handle points with very similar distances', () => {
            // Create a fresh path for this specific test
            const testPath = new Path('edge case');
            const baseTime = Date.now();
            const baseDist = 1000.0;

            // Add first point
            testPath.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(45.0),
                lon: toRadians(2.0),
                ele: 100,
                bearing: 0,
                dist: baseDist,
                radius: 0,
                time: baseTime,
                elapsed: 0,
                power: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0.7,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 20,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            // Add multiple consecutive points with identical distances (to trigger maxIndex++ loop)
            for (let i = 1; i <= 4; i++) {
                testPath.addPoint({
                    ...EMPTY_POINT,
                    lat: toRadians(45.0 + i * 0.0001),
                    lon: toRadians(2.0 + i * 0.0001),
                    ele: 100,
                    bearing: 0,
                    dist: baseDist, // Exact same distance to trigger the loop condition
                    radius: 0,
                    time: baseTime + i * 1000,
                    elapsed: i * 1000,
                    power: 0,
                    pCyclistRaw: 0,
                    pCyclistWheel: 0,
                    pCyclistOptimalPower: 0,
                    pAero: 0,
                    pGravity: 0,
                    pRollingResistance: 0,
                    pWheelBearings: 0,
                    pPowerFromAcc: 0,
                    pPowerWheelFromAcc: 0,
                    aeroCoef: 0.7,
                    grade: 0,
                    speed: 0,
                    speedMax: 0,
                    speedMaxIncline: 0,
                    virtSpeedCurrent: 0,
                    temperature: 20,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,
                    heartRate: 0,
                    cadence: 0,
                });
            }

            // Add a final point with significantly different distance
            testPath.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(45.01),
                lon: toRadians(2.01),
                ele: 110,
                bearing: 0,
                dist: baseDist + 100, // Much larger distance difference
                radius: 0,
                time: baseTime + 5000,
                elapsed: 5000,
                power: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0.7,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 20,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            // This should trigger the while loop with multiple iterations of maxIndex++ (line 565)
            testPath.computeDerivedData();

            // Verify computation completed without errors
            expect(testPath.length).toBe(6);
        });
    });

    describe('performance characteristics', () => {
        it('should handle large datasets efficiently', () => {
            const pointCount = 5000;
            const startTime = performance.now();

            // Add many points
            for (let i = 0; i < pointCount; i++) {
                pathData.addPoint({
                    ...EMPTY_POINT,
                    lat: toRadians(48.8566 + i * 0.0001),
                    lon: toRadians(2.3522 + i * 0.0001),
                    ele: 35 + (i % 100),
                    bearing: (i * 7) % 360,
                    dist: i * 10,
                    radius: 50 + (i % 20),
                    time: Date.now() + i * 1000,
                    elapsed: i * 1000,
                    power: 250 + (i % 50),
                    pCyclistRaw: 240,
                    pCyclistWheel: 230,
                    pCyclistOptimalPower: 245,
                    pAero: -80,
                    pGravity: -20,
                    pRollingResistance: -15,
                    pWheelBearings: -5,
                    pPowerFromAcc: 10,
                    pPowerWheelFromAcc: 9,
                    aeroCoef: 0.7,
                    grade: (i % 200) / 10 - 10, // -10% to +10% grade
                    speed: 15 + (i % 30) / 2, // 15-30 m/s
                    speedMax: 25,
                    speedMaxIncline: 12,
                    virtSpeedCurrent: 15,
                    temperature: 20 + (i % 40) - 20, // 0-40°C
                    windSpeed: (i % 20) / 2, // 0-10 m/s
                    windDirection: (i * 13) % 360,
                    windBearing: (i * 17) % 360,
                    windAlpha: (i * 3) % 90,
                    heartRate: 120 + (i % 80), // 120-200 bpm
                    cadence: 60 + (i % 60), // 60-120 rpm
                });
            }

            const addTime = performance.now() - startTime;

            expect(pathData.length).toBe(pointCount);

            // Test random access performance
            const accessStartTime = performance.now();
            for (let i = 0; i < 1000; i++) {
                const randomIndex = Math.floor(Math.random() * pointCount);
                const lat = pathData.getLatitude(randomIndex);
                const power = pathData.getPower(randomIndex);
                expect(lat).toBeDefined();
                expect(power).toBeDefined();
            }
            const accessTime = performance.now() - accessStartTime;

            // Test iteration performance
            const iterStartTime = performance.now();
            let count = 0;
            const iterator = pathData[Symbol.iterator]();
            while (count < 100) {
                const next = iterator.next();
                if (next.done) {
                    break;
                }
                count++;
            }
            const iterTime = performance.now() - iterStartTime;

            // Performance should be reasonable (these are generous limits)
            expect(addTime).toBeLessThan(10000); // Adding 5000 points < 10 second
            expect(accessTime).toBeLessThan(1000); // 1000 random accesses < 1 second
            expect(iterTime).toBeLessThan(500); // 100 iterations < 500ms

            console.log(
                `Performance test - Add: ${addTime.toFixed(2)}ms, Access: ${accessTime.toFixed(2)}ms, Iter: ${iterTime.toFixed(2)}ms`
            );
        });
    });
});
