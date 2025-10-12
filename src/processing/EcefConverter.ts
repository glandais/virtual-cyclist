import { FIRST_ECCENTRICITY_SQUARED, SEMI_MAJOR_AXIS } from '@/constants/';
import { Point } from '@/types/path/';
import { Vector3D } from '@/utils/';

/**
 * ECEF (Earth-Centered, Earth-Fixed) coordinate converter
 * Converts WGS84 coordinates (latitude/longitude/elevation) to ECEF Cartesian coordinates
 */
export class EcefConverter {
    /**
     * Convert WGS84 coordinates to ECEF coordinates with optional elevation exaggeration
     * @param coordinates - Geographic coordinates with elevation
     * @param zExaggeration - Elevation exaggeration factor (default: 3)
     * @returns ECEF coordinates as Vector3D
     */
    public static toEcef(coordinates: Point, zExaggeration: number = 3): Vector3D {
        // Convert degrees to radians
        const latRad = coordinates.latitude;
        const lonRad = coordinates.longitude;

        // Apply elevation exaggeration
        const elevation = isNaN(coordinates.elevation) ? 0 : coordinates.elevation;
        const elevationExaggerated = zExaggeration * elevation;

        // Calculate prime vertical radius of curvature
        const sinLat = Math.sin(latRad);
        const n = SEMI_MAJOR_AXIS / Math.sqrt(1 - FIRST_ECCENTRICITY_SQUARED * sinLat * sinLat);

        // Calculate ECEF coordinates
        const cosLat = Math.cos(latRad);
        const cosLon = Math.cos(lonRad);
        const sinLon = Math.sin(lonRad);

        const x = (n + elevationExaggerated) * cosLat * cosLon;
        const y = (n + elevationExaggerated) * cosLat * sinLon;
        const z = (n * (1 - FIRST_ECCENTRICITY_SQUARED) + elevationExaggerated) * sinLat;

        return new Vector3D(x, y, z);
    }
}
