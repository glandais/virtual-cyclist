import { WindProvider } from './WindProvider';
import { WindProviderConstant } from './WindProviderConstant';

/**
 * Wind provider that represents no wind conditions (zero wind speed).
 *
 * This is the default wind provider for simulations where wind effects
 * should not be considered. It's equivalent to riding in perfectly calm
 * conditions or in a velodrome.
 *
 * This provider simplifies aerodynamic calculations by eliminating the
 * wind component, making the effective air velocity equal to the cyclist's
 * ground velocity.
 *
 * Example usage:
 * ```typescript
 * const provider = new WindProviderNone();
 * // Always returns { windSpeed: 0, windDirection: 0 }
 * ```
 */
class WindProviderNone extends WindProviderConstant {
    /**
     * Creates a wind provider with zero wind speed.
     */
    constructor() {
        super({ windSpeed: 0, windDirection: 0 });
    }
}

export const windProviderNone: WindProvider = new WindProviderNone();
