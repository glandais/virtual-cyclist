import { Path } from '../Path';
import { EMPTY_POINT } from '../types';
import ElevationProvider, { Coordinates, CoordinatesElevation } from '@glandais/elevation';
import { toRadians } from '../constants';

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
