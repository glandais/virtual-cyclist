import { aeroPowerProvider } from '@/physics/power/aero/';
import { Path, PointField } from '@/types/path/';

describe('AeroPowerProvider', () => {
    let path: Path;

    beforeEach(() => {
        path = new Path('test-path');
    });

    test('should return aero provider ID', () => {
        expect(aeroPowerProvider.getId()).toBe('aero');
    });

    test('should calculate aero drag without wind (cubic relationship)', () => {
        path.addPoint({
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as any);

        const course: any = {
            aeroProvider: {
                getAeroCoef: () => 0.175, // Default aero coefficient
            },
            windProvider: {
                getWind: () => ({ windSpeed: 0, windDirection: 0 }),
            },
        };

        const power = aeroPowerProvider.getPowerW(course, path, 0);

        // P = -aeroCoef * v³
        // P = -0.175 * 10³ = -175W
        expect(power).toBeLessThan(0); // Always resistive
        expect(power).toBeCloseTo(-175, 0);
    });

    test('should scale with cube of velocity', () => {
        path.addPoint({
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 5,
            grade: 0,
            bearing: 0,
        } as any);

        const course: any = {
            aeroProvider: { getAeroCoef: () => 0.175 },
            windProvider: { getWind: () => ({ windSpeed: 0, windDirection: 0 }) },
        };

        const power5 = aeroPowerProvider.getPowerW(course, path, 0);

        path.setField(0, PointField.SPEED, 10); // Update speed from 5 to 10 m/s
        const power10 = aeroPowerProvider.getPowerW(course, path, 0);

        // Double speed → 8x power (2³)
        expect(power10 / power5).toBeCloseTo(8, 0);
    });

    test('should handle wind using Isvan model', () => {
        path.addPoint({
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 10,
            grade: 0,
            bearing: 0, // Heading east (0 radians)
        } as any);

        const course: any = {
            aeroProvider: { getAeroCoef: () => 0.175 },
            windProvider: {
                getWind: () => ({
                    windSpeed: 5, // 5 m/s headwind
                    windDirection: 0, // From north (straight headwind)
                }),
            },
        };

        const powerWithWind = aeroPowerProvider.getPowerW(course, path, 0);

        // Headwind increases resistance, so power should be more negative
        expect(powerWithWind).toBeLessThan(-175);
    });

    test('should handle tailwind (reduced resistance)', () => {
        path.addPoint({
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as any);

        const course: any = {
            aeroProvider: { getAeroCoef: () => 0.175 },
            windProvider: {
                getWind: () => ({
                    windSpeed: 5,
                    windDirection: Math.PI, // From south (tailwind)
                }),
            },
        };

        const powerWithTailwind = aeroPowerProvider.getPowerW(course, path, 0);

        // Tailwind still creates resistance (just reduced from headwind)
        expect(powerWithTailwind).toBeLessThan(0); // Still resistive
        expect(Math.abs(powerWithTailwind)).toBeLessThan(250); // Less than headwind
    });
});
