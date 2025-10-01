import { rollingResistancePowerProvider } from '@/physics/power/rolling/';
import { CoursePhysics } from '@/types/course/';
import { Bike, Cyclist } from '@/types/models/';
import { Path, Point, PointField } from '@/types/path/';

describe('RollingResistancePowerProvider', () => {
    let path: Path;
    let cyclist: Cyclist;
    let bike: Bike;

    beforeEach(() => {
        cyclist = Cyclist.getDefault();
        bike = Bike.getDefault();
        path = new Path('test-path');
    });

    test('should calculate rolling resistance (always negative)', () => {
        path.addPoint({
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        const course = { cyclist, bike } as unknown as CoursePhysics;
        const power = rollingResistancePowerProvider.getPowerW(course, path, 0);

        // P = -cos(atan(grade)) * m * g * v * crr
        // P ≈ -1 * 80 * 9.8 * 10 * 0.004 ≈ -31.4W
        expect(power).toBeLessThan(0);
        expect(power).toBeCloseTo(-31.4, 1);
    });

    test('should scale linearly with speed', () => {
        path.addPoint({
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 5,
            grade: 0,
            bearing: 0,
        } as Point);

        const course = { cyclist, bike } as unknown as CoursePhysics;
        const power5 = rollingResistancePowerProvider.getPowerW(course, path, 0);

        path.setField(0, PointField.SPEED, 10);
        const power10 = rollingResistancePowerProvider.getPowerW(course, path, 0);

        expect(power10 / power5).toBeCloseTo(2, 1);
    });

    test('should be slightly less on climbs (cosine factor)', () => {
        path.addPoint({
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        const course = { cyclist, bike } as unknown as CoursePhysics;
        const powerFlat = rollingResistancePowerProvider.getPowerW(course, path, 0);

        path.setField(0, PointField.GRADE, 0.5); // 50% grade for noticeable cosine effect
        const powerClimb = rollingResistancePowerProvider.getPowerW(course, path, 0);

        // cos(atan(0.5)) ≈ 0.894 < 1, so climbing resistance is measurably less
        expect(Math.abs(powerClimb)).toBeLessThan(Math.abs(powerFlat));
    });
});
