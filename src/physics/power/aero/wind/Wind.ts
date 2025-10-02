/**
 * Represents wind conditions for aerodynamic calculations.
 *
 * Wind parameters are used to calculate the effective air velocity relative
 * to the cyclist, which significantly affects aerodynamic drag power.
 *
 * @property windSpeed Wind speed in m/s (meters per second)
 * @property windDirection Wind direction in radians
 *                        - 0 = North
 *                        - π/2 = East
 *                        - π = South
 *                        - 3π/2 = West
 */
export interface Wind {
    /** Wind speed in m/s */
    readonly windSpeed: number;

    /** Wind direction in radians (0 = North, π/2 = East) */
    readonly windDirection: number;
}
