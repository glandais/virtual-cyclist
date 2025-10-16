import { EMPTY_POINT, Path } from '@/types/path/';
import { toRadians } from '@/utils/';

// Mock types for elevation provider
export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface CoordinatesElevation extends Coordinates {
    elevation: number;
}

// Mock ElevationSmoother class
export class ElevationSmoother {
    static smooth(
        coordinates: CoordinatesElevation[],
        _windowSize: number
    ): CoordinatesElevation[] {
        // Simple mock: return coordinates unchanged
        // In real implementation, this would apply a smoothing algorithm
        return coordinates;
    }
}

// Mock ElevationProvider class
export default class ElevationProvider {
    async setElevations(coordinates: CoordinatesElevation[]): Promise<void> {
        // Mock implementation: modify coordinates in-place with simple elevation pattern
        coordinates.forEach((coord, index) => {
            coord.elevation = 100 + index * 10;
        });
    }

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
const mockElevationProvider = new ElevationProvider();

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
        const result = new Path('fake');

        // Add all corrected coordinates to the result path
        for (let i = 0; i < resultCoordinates.length; i++) {
            const coord = resultCoordinates[i];
            result.addPoint({
                ...EMPTY_POINT,
                latitude: toRadians(coord.latitude),
                longitude: toRadians(coord.longitude),
                elevation: coord.elevation,
            });
        }

        return result;
    }
}
