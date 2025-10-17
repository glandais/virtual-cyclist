import ElevationProvider, { CoordinatesElevation, ElevationSmoother } from '@glandais/elevation';

import { Path } from '@/types/path/';

const elevationProvider = new ElevationProvider();

export class Elevation {
    public static async fixElevation(path: Path): Promise<Path> {
        const coordinatesElevation: CoordinatesElevation[] = Array.from(path.coordinatesIterator());
        await elevationProvider.setElevations(coordinatesElevation);
        const result = new Path(path.name);

        // Add all corrected coordinates to the result path
        for (let i = 0; i < path.length; i++) {
            const coord = coordinatesElevation[i];
            result.addFrom(path, i);
            result.setElevation(i, coord.elevation);
        }
        result.computeDerivedData();
        return result;
    }

    public static async smoothElevation(path: Path): Promise<Path> {
        const coordinatesElevation = ElevationSmoother.smooth(
            Array.from(path.coordinatesIterator()),
            150
        );
        const result = new Path(path.name);

        // Add all corrected coordinates to the result path
        for (let i = 0; i < path.length; i++) {
            const coord = coordinatesElevation[i];
            result.addFrom(path, i);
            result.setElevation(i, coord.elevation);
        }
        result.computeDerivedData();
        return result;
    }
}
