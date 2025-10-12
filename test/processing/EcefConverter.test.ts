import { EcefConverter } from '@/processing/';
import { Point } from '@/types/path/';

describe('EcefConverter', () => {
    test('should convert WGS84 to ECEF coordinates', () => {
        const point = {
            latitude: 45.0, // 45° N
            longitude: 6.0, // 6° E
            elevation: 1000, // 1000m elevation
        } as Point;

        const ecef = EcefConverter.toEcef(point, 1);

        // ECEF coordinates should be in Earth-centered system
        expect(ecef.x).toBeDefined();
        expect(ecef.y).toBeDefined();
        expect(ecef.z).toBeDefined();

        // At 45°N, 6°E, 1000m altitude, approximate values:
        // X ≈ 4.5M, Y ≈ 0.4M, Z ≈ 4.5M (rough order of magnitude)
        expect(Math.abs(ecef.x)).toBeGreaterThan(1000000);
        expect(Math.abs(ecef.z)).toBeGreaterThan(1000000);
    });

    test('should apply elevation exaggeration', () => {
        const point = {
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
        } as Point;

        const ecef1 = EcefConverter.toEcef(point, 1);
        const ecef10 = EcefConverter.toEcef(point, 10);

        // Higher exaggeration should give different Z component
        expect(ecef10.z).not.toEqual(ecef1.z);
    });

    test('should handle equator point', () => {
        const point = {
            latitude: 0, // Equator
            longitude: 0, // Prime meridian
            elevation: 0,
        } as Point;

        const ecef = EcefConverter.toEcef(point, 1);

        // At equator and prime meridian: X ≈ Earth radius, Y ≈ 0, Z ≈ 0
        expect(ecef.x).toBeGreaterThan(6_300_000); // Approx Earth radius
        expect(Math.abs(ecef.y)).toBeLessThan(1000);
        expect(Math.abs(ecef.z)).toBeLessThan(1000);
    });

    test('should handle north pole point', () => {
        const point = {
            latitude: Math.PI / 2, // 90 degrees in radians (North pole)
            longitude: 0,
            elevation: 0,
        } as Point;

        const ecef = EcefConverter.toEcef(point, 1);

        // At north pole: X ≈ 0, Y ≈ 0, Z ≈ Earth polar radius
        expect(Math.abs(ecef.x)).toBeLessThan(1000);
        expect(Math.abs(ecef.y)).toBeLessThan(1000);
        expect(ecef.z).toBeGreaterThan(6_300_000);
    });
});
