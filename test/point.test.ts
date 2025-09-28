import { Coordinates } from '../src/types';

describe('Coordinates', () => {
    it('should create a coordinate with latitude and longitude', () => {
        const coord: Coordinates = {
            latitude: 48.8566,
            longitude: 2.3522,
        };

        expect(coord.latitude).toBe(48.8566);
        expect(coord.longitude).toBe(2.3522);
        expect(coord.elevation).toBeUndefined();
    });

    it('should create a coordinate with elevation', () => {
        const coord: Coordinates = {
            latitude: 48.8566,
            longitude: 2.3522,
            elevation: 35,
        };

        expect(coord.latitude).toBe(48.8566);
        expect(coord.longitude).toBe(2.3522);
        expect(coord.elevation).toBe(35);
    });

    it('should handle negative coordinates', () => {
        const coord: Coordinates = {
            latitude: -33.8688,
            longitude: -151.2093,
            elevation: -10,
        };

        expect(coord.latitude).toBe(-33.8688);
        expect(coord.longitude).toBe(-151.2093);
        expect(coord.elevation).toBe(-10);
    });

    it('should handle extreme coordinates', () => {
        const northPole: Coordinates = {
            latitude: 90,
            longitude: 0,
        };

        const southPole: Coordinates = {
            latitude: -90,
            longitude: 0,
        };

        const dateLine: Coordinates = {
            latitude: 0,
            longitude: 180,
        };

        expect(northPole.latitude).toBe(90);
        expect(southPole.latitude).toBe(-90);
        expect(dateLine.longitude).toBe(180);
    });

    it('should be immutable due to readonly properties', () => {
        const coord: Coordinates = {
            latitude: 48.8566,
            longitude: 2.3522,
            elevation: 35,
        };

        // TypeScript compiler prevents mutation at compile time
        // These would be compile errors:
        // coord.latitude = 50; // Error: Cannot assign to 'latitude' because it is a read-only property
        // coord.longitude = 3; // Error: Cannot assign to 'longitude' because it is a read-only property

        // Runtime behavior verification
        const frozenCoord = Object.freeze(coord);
        expect(frozenCoord.latitude).toBe(48.8566);
        expect(frozenCoord.longitude).toBe(2.3522);
        expect(frozenCoord.elevation).toBe(35);
    });
});
