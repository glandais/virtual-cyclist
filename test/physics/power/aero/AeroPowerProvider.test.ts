import { aeroPowerProvider } from '@/physics/power/aero/';
import { CoursePhysics } from '@/types/course/';
import { Path, Point } from '@/types/path/';

describe('AeroPowerProvider', () => {
    let path: Path;

    beforeEach(() => {
        path = new Path('test-path');
    });

    test('should calculate aero drag without wind (cubic relationship)', () => {
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

        const course = {
            aeroProvider: {
                getAeroCoef: () => 0.175, // Default aero coefficient
            },
            windProvider: {
                getWind: () => ({ windSpeed: 0, windDirection: 0 }),
            },
        } as unknown as CoursePhysics;

        const power = aeroPowerProvider.getPowerW(course, path, 0);

        // P = -aeroCoef * v³
        // P = -0.175 * 10³ = -175W
        expect(power).toBeLessThan(0); // Always resistive
        expect(power).toBeCloseTo(-175, 0);
    });

    test('should scale with cube of velocity', () => {
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: Date.now(),
            distance: 0,
            speed: 5,
            grade: 0,
            bearing: 0,
        } as Point);

        const course = {
            aeroProvider: { getAeroCoef: () => 0.175 },
            windProvider: { getWind: () => ({ windSpeed: 0, windDirection: 0 }) },
        } as unknown as CoursePhysics;

        const power5 = aeroPowerProvider.getPowerW(course, path, 0);

        path.setSpeed(0, 10); // Update speed from 5 to 10 m/s
        const power10 = aeroPowerProvider.getPowerW(course, path, 0);

        // Double speed → 8x power (2³)
        expect(power10 / power5).toBeCloseTo(8, 0);
    });

    test('should handle wind using Isvan model', () => {
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: Date.now(),
            distance: 0,
            speed: 10,
            grade: 0,
            bearing: 0, // Heading east (0 radians)
        } as Point);

        const course = {
            aeroProvider: { getAeroCoef: () => 0.175 },
            windProvider: {
                getWind: () => ({
                    windSpeed: 5, // 5 m/s headwind
                    windDirection: 0, // From north (straight headwind)
                }),
            },
        } as unknown as CoursePhysics;

        const powerWithWind = aeroPowerProvider.getPowerW(course, path, 0);

        // Headwind increases resistance, so power should be more negative
        expect(powerWithWind).toBeLessThan(-175);
    });

    test('should handle tailwind (reduced resistance)', () => {
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

        const course = {
            aeroProvider: { getAeroCoef: () => 0.175 },
            windProvider: {
                getWind: () => ({
                    windSpeed: 5,
                    windDirection: Math.PI, // From south (tailwind)
                }),
            },
        } as unknown as CoursePhysics;

        const powerWithTailwind = aeroPowerProvider.getPowerW(course, path, 0);

        // Tailwind still creates resistance (just reduced from headwind)
        expect(powerWithTailwind).toBeLessThan(0); // Still resistive
        expect(Math.abs(powerWithTailwind)).toBeLessThan(250); // Less than headwind
    });
});
