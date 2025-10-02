import { Course } from '@/types/course/';
import { Path } from '@/types/path/';
import { Wind } from './Wind';
import { WindProvider } from './WindProvider';

/**
 * Wind provider that returns constant wind conditions throughout the route.
 *
 * This provider is useful for:
 * - Scenario analysis with specific wind conditions
 * - Testing the impact of wind on cycling performance
 * - Simulations where wind conditions are assumed constant
 *
 * The wind speed and direction remain unchanged regardless of location,
 * time, or other course parameters.
 *
 * Example usage:
 * ```typescript
 * // 5 m/s headwind from the north
 * const provider = new WindProviderConstant({ windSpeed: 5, windDirection: 0 });
 *
 * // 10 m/s crosswind from the east
 * const provider = new WindProviderConstant({ windSpeed: 10, windDirection: Math.PI / 2 });
 * ```
 */
export class WindProviderConstant implements WindProvider {
    private readonly wind: Wind;

    /**
     * Creates a constant wind provider with the specified wind conditions.
     *
     * @param wind The wind conditions to use throughout the route
     */
    constructor(wind: Wind) {
        this.wind = { ...wind };
    }

    /**
     * Returns the constant wind conditions.
     *
     * @param _course The course configuration (unused)
     * @param _path The path containing point data (unused)
     * @param _pointIndex The index of the current point (unused)
     * @returns The constant wind conditions
     */
    getWind(_course: Course, _path: Path, _pointIndex: number): Wind {
        return this.wind;
    }
}
