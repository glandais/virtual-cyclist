import { Course } from '../../../../types';
import { Path } from '../../../../Path';
import { Wind } from './Wind';

/**
 * Interface for wind data providers in virtual cycling simulations.
 *
 * WindProvider implementations supply wind conditions at specific locations
 * along a cycling route. Different implementations can provide:
 * - Constant wind (same throughout route)
 * - No wind (zero wind speed)
 * - Variable wind (weather data, time-based, location-based)
 * - Forecast data integration
 *
 * Wind significantly affects cycling aerodynamics, especially at higher speeds
 * or when the wind direction creates a headwind or crosswind component.
 */
export interface WindProvider {
    /**
     * Gets the wind conditions at a specific location on the course.
     *
     * @param course The course configuration
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @returns Wind conditions (speed and direction)
     */
    getWind(course: Course, path: Path, pointIndex: number): Wind;
}
