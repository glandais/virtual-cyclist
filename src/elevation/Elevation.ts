import ElevationProvider, { Coordinates, CoordinatesElevation } from '@glandais/elevation';

import { EMPTY_POINT, Path } from '@/types/path/';
import { toRadians } from '@/utils/';

const elevationProvider = new ElevationProvider();

export class Elevation {
    public static async fixElevation(path: Path): Promise<Path> {
        const coordinates: Coordinates[] = Array.from(path.coordinatesIterator());
        const resultCoordinates: CoordinatesElevation[] =
            await elevationProvider.getElevationsAlong(coordinates, {
                filterOptions: {
                    enabled: false,
                },
                smoothingOptions: {
                    enabled: true,
                    windowSize: 150,
                },
            });
        const result = new Path(path.name);

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
        result.computeDerivedData();
        return result;
    }
}
