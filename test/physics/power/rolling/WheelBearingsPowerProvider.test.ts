import { wheelBearingsPowerProvider } from '@/physics/power/rolling/';
import { CoursePhysics } from '@/types/course/';
import { EMPTY_POINT, Path, Point, PointField } from '@/types/path/';

describe('WheelBearingsPowerProvider', () => {
    let path: Path;

    beforeEach(() => {
        path = new Path('test-path');
    });

    test('should calculate bearing friction (always negative)', () => {
        path.addPoint({
            ...EMPTY_POINT,
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        });

        const power = wheelBearingsPowerProvider.getPowerW({} as CoursePhysics, path, 0);

        // P = -speed * (91 + 8.7 * speed) / 1000
        // P = -10 * (91 + 8.7 * 10) / 1000 = -10 * 178 / 1000 = -1.78W
        expect(power).toBeLessThan(0);
        expect(power).toBeCloseTo(-1.78, 2);
    });

    test('should increase non-linearly with speed', () => {
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

        const power5 = wheelBearingsPowerProvider.getPowerW({} as CoursePhysics, path, 0);

        path.setField(0, PointField.SPEED, 10);
        const power10 = wheelBearingsPowerProvider.getPowerW({} as CoursePhysics, path, 0);

        // Should be more than double (quadratic component)
        expect(power10 / power5).toBeGreaterThan(2);
        expect(power10 / power5).toBeLessThan(3);
    });

    test('should handle zero speed', () => {
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

        const power = wheelBearingsPowerProvider.getPowerW({} as CoursePhysics, path, 0);

        expect(power).toBeCloseTo(0, 5); // Handle -0 vs 0
    });
});
