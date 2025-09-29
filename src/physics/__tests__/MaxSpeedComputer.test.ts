import { MaxSpeedComputer } from '../MaxSpeedComputer';
import { Path } from '../../Path';
import { Cyclist } from '../../Cyclist';
import { Bike } from '../../Bike';
import { EMPTY_POINT } from '../../types';
import { toRadians } from '../../constants';

interface TestCourse {
    path: Path;
    cyclist: Cyclist;
    bike: Bike;
}

// Extended class to test protected methods
class MaxSpeedComputerExtended extends MaxSpeedComputer {
    public firstPass(course: TestCourse): void {
        return super.firstPass(course);
    }

    public secondPass(course: TestCourse): void {
        return super.secondPass(course);
    }
}

describe('MaxSpeedComputer', () => {
    let maxSpeedComputer: MaxSpeedComputerExtended;
    let path: Path;
    let cyclist: Cyclist;
    let bike: Bike;
    let course: TestCourse;

    beforeEach(() => {
        maxSpeedComputer = new MaxSpeedComputerExtended();
        path = new Path();
        cyclist = Cyclist.getDefault();
        bike = Bike.getDefault();
        course = { path, cyclist, bike };

        // Create a simple test path with 5 points
        // Coordinates are in radians (converted from degrees)
        const points = [
            { lat: toRadians(45.0), lon: toRadians(2.0), ele: 100 },
            { lat: toRadians(45.001), lon: toRadians(2.001), ele: 105 },
            { lat: toRadians(45.002), lon: toRadians(2.002), ele: 110 },
            { lat: toRadians(45.003), lon: toRadians(2.001), ele: 115 }, // Sharp turn
            { lat: toRadians(45.004), lon: toRadians(2.0), ele: 120 },
        ];

        for (const point of points) {
            path.addPoint({
                ...EMPTY_POINT,
                lat: point.lat,
                lon: point.lon,
                ele: point.ele,
            });
        }

        // Enhance the path to calculate distances and bearings
        path.computeArrays();
    });

    test('should create MaxSpeedComputer instance', () => {
        expect(maxSpeedComputer).toBeInstanceOf(MaxSpeedComputer);
    });

    test('should compute max speeds without errors', () => {
        expect(() => {
            maxSpeedComputer.computeMaxSpeeds(course);
        }).not.toThrow();
    });

    test('should set reasonable max speeds (not all 2.00 m/s)', () => {
        maxSpeedComputer.computeMaxSpeeds(course);

        const speeds: number[] = [];
        for (let i = 0; i < path.getPointCount(); i++) {
            const speed = path.getSpeedMax(i);
            speeds.push(speed);
        }

        // Check that not all speeds are exactly 2.00 m/s
        const allSame = speeds.every(speed => Math.abs(speed - 2.0) < 0.01);
        expect(allSame).toBe(false);

        // Check that speeds are reasonable (between 0.5 and cyclist's max speed)
        const maxSpeed = cyclist.getMaxSpeedMs();
        for (const speed of speeds) {
            expect(speed).toBeGreaterThan(0.5);
            expect(speed).toBeLessThanOrEqual(maxSpeed + 0.1); // Small tolerance
        }
    });

    test('should respect cyclist maximum speed limit', () => {
        maxSpeedComputer.computeMaxSpeeds(course);

        const maxCyclistSpeed = cyclist.getMaxSpeedMs();
        for (let i = 0; i < path.getPointCount(); i++) {
            const speed = path.getSpeedMax(i);
            expect(speed).toBeLessThanOrEqual(maxCyclistSpeed + 0.01); // Small tolerance
        }
    });

    test('should calculate different speeds for different points', () => {
        maxSpeedComputer.computeMaxSpeeds(course);

        const speeds: number[] = [];
        for (let i = 0; i < path.getPointCount(); i++) {
            speeds.push(path.getSpeedMax(i));
        }

        // Should have at least 2 different speed values
        const uniqueSpeeds = new Set(speeds.map(s => Math.round(s * 100) / 100));
        expect(uniqueSpeeds.size).toBeGreaterThan(1);
    });

    test('should handle straight path segments', () => {
        // Create a straight path
        const straightPath = new Path();
        for (let i = 0; i < 5; i++) {
            straightPath.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(45.0 + i * 0.001),
                lon: toRadians(2.0),
                ele: 100,
            });
        }
        straightPath.computeArrays();

        const straightCourse = { path: straightPath, cyclist, bike };
        maxSpeedComputer.computeMaxSpeeds(straightCourse);

        // Should complete without errors and set speed values
        const maxSpeed = cyclist.getMaxSpeedMs();
        for (let i = 0; i < straightPath.getPointCount(); i++) {
            const speed = straightPath.getSpeedMax(i);
            expect(speed).toBeGreaterThan(0);
            expect(speed).toBeLessThanOrEqual(maxSpeed);
            expect(speed).not.toBeNaN();
        }
    });

    test('should reduce speeds for sharp turns', () => {
        // Point 3 (index 3) should have a lower speed due to the sharp turn
        maxSpeedComputer.computeMaxSpeeds(course);

        const turnSpeed = path.getSpeedMax(3);
        const maxSpeed = cyclist.getMaxSpeedMs();

        // Turn speed should be significantly less than max speed
        expect(turnSpeed).toBeLessThan(maxSpeed * 0.9);
    });

    test('should set radius values for turning points', () => {
        maxSpeedComputer.computeMaxSpeeds(course);

        // Check that radius values are set for points with turns
        let hasRadius = false;
        for (let i = 1; i < path.getPointCount() - 1; i++) {
            const radius = path.getRadius(i);
            if (radius > 0) {
                hasRadius = true;
                expect(radius).toBeGreaterThan(0);
                expect(radius).toBeLessThan(10000); // Reasonable upper bound
            }
        }

        expect(hasRadius).toBe(true);
    });

    test('first pass should compute cornering constraints', () => {
        maxSpeedComputer.firstPass(course);

        // All speeds should be set to some value <= cyclist max speed
        const maxSpeed = cyclist.getMaxSpeedMs();
        for (let i = 0; i < path.getPointCount(); i++) {
            const speed = path.getSpeedMax(i);
            expect(speed).toBeGreaterThan(0);
            expect(speed).toBeLessThanOrEqual(maxSpeed + 0.01);
        }
    });

    test('second pass should apply braking constraints', () => {
        // First set high speeds
        for (let i = 0; i < path.getPointCount(); i++) {
            path.setSpeedMax(i, cyclist.getMaxSpeedMs());
        }

        // Set a very low speed at the last point to force braking
        path.setSpeedMax(path.getPointCount() - 1, 1.0);

        maxSpeedComputer.secondPass(course);

        // Speeds should be reduced towards the end to allow braking
        const penultimateSpeed = path.getSpeedMax(path.getPointCount() - 2);
        const finalSpeed = path.getSpeedMax(path.getPointCount() - 1);

        expect(finalSpeed).toBeCloseTo(1.0, 1);
        expect(penultimateSpeed).toBeLessThan(cyclist.getMaxSpeedMs());
    });
});
