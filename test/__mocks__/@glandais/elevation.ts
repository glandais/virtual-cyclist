import { Path } from '../../../src/Path';
import { EMPTY_POINT } from '../../../src/types';
import { toRadians } from '../../../src/constants';

// Mock types for elevation provider
export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface CoordinatesElevation extends Coordinates {
    elevation: number;
}

// Mock ElevationProvider class
export class MockElevationProvider {
    async getElevationsAlong(
        coordinates: Coordinates[],
        _options?: {
            filterOptions?: { enabled: boolean };
            smoothingOptions?: { enabled: boolean; windowSize: number };
        }
    ): Promise<CoordinatesElevation[]> {
        // Return mock elevation data for testing
        return coordinates.map((coord, index) => ({
            ...coord,
            elevation: 100 + index * 10, // Simple mock elevation pattern
        }));
    }
}

// Mock the default export
const mockElevationProvider = new MockElevationProvider();

// Default export to match @glandais/elevation
export default MockElevationProvider;

export class Elevation {
    public static async fixElevation(path: Path): Promise<Path> {
        const coordinates: Coordinates[] = Array.from(path.coordinatesIterator());
        const resultCoordinates: CoordinatesElevation[] =
            await mockElevationProvider.getElevationsAlong(coordinates, {
                filterOptions: {
                    enabled: false,
                },
                smoothingOptions: {
                    enabled: true,
                    windowSize: 150,
                },
            });
        const result = new Path();

        // Add all corrected coordinates to the result path
        for (let i = 0; i < resultCoordinates.length; i++) {
            const coord = resultCoordinates[i];
            result.addPoint({
                ...EMPTY_POINT,
                lat: toRadians(coord.latitude),
                lon: toRadians(coord.longitude),
                ele: coord.elevation,
            });
        }

        return result;
    }
}
