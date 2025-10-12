import { gravPowerProvider } from '@/physics/power/grav/';
import { CoursePhysics } from '@/types/course/';
import { Cyclist } from '@/types/models/';
import { Path, Point } from '@/types/path/';

describe('GravPowerProvider', () => {
    let path: Path;
    let cyclist: Cyclist;

    beforeEach(() => {
        cyclist = Cyclist.getDefault();
        path = new Path('test-path');
    });

    test('should calculate climbing power (negative, resistive)', () => {
        // 5% grade at 10 m/s
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: Date.now(),
            distance: 0,
            speed: 10,
            grade: 0.05, // 5% climb
            bearing: 0,
        } as Point);

        const course = { cyclist } as unknown as CoursePhysics;
        const power = gravPowerProvider.getPowerW(course, path, 0);

        // P = -m * g * v * sin(atan(grade))
        // P ≈ -80 * 9.8 * 10 * 0.0499 ≈ -391W
        expect(power).toBeLessThan(0); // Resistive when climbing
        expect(power).toBeCloseTo(-392, 0); // 1 decimal precision
    });

    test('should calculate descending power (positive, assistive)', () => {
        // -5% grade (descending) at 10 m/s
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: Date.now(),
            distance: 0,
            speed: 10,
            grade: -0.05,
            bearing: 0,
        } as Point);

        const course = { cyclist } as unknown as CoursePhysics;
        const power = gravPowerProvider.getPowerW(course, path, 0);

        expect(power).toBeGreaterThan(0); // Assistive when descending
        expect(power).toBeCloseTo(392, 0); // 1 decimal precision
    });

    test('should return zero power on flat road', () => {
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: Date.now(),
            distance: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        const course = { cyclist } as unknown as CoursePhysics;
        const power = gravPowerProvider.getPowerW(course, path, 0);

        expect(power).toBeCloseTo(0, 1);
    });

    test('should scale with speed', () => {
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: Date.now(),
            distance: 0,
            speed: 5,
            grade: 0.1, // 10% grade
            bearing: 0,
        } as Point);

        const course = { cyclist } as unknown as CoursePhysics;
        const power5 = gravPowerProvider.getPowerW(course, path, 0);

        // Double speed should double power
        path.setSpeed(0, 10); // speed
        const power10 = gravPowerProvider.getPowerW(course, path, 0);

        expect(power10 / power5).toBeCloseTo(2, 1);
    });
});
