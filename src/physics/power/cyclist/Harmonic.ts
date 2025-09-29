/**
 * Represents a harmonic oscillation component for power variation modeling.
 *
 * Harmonics simulate natural power output variations in cyclists due to:
 * - Pedal stroke asymmetries
 * - Breathing patterns
 * - Micro-adjustments in posture
 * - Natural physiological rhythms
 *
 * The harmonic is applied as: P' = P + amp × P × cos(freq × t - d)
 *
 * Where:
 * - P: base power output
 * - freq: oscillation frequency (rad/s)
 * - t: time (seconds)
 * - d: phase offset (radians)
 * - amp: amplitude factor (dimensionless, typically 0-0.01)
 *
 * Multiple harmonics with random parameters create realistic power variability.
 *
 * @property freq Oscillation frequency in radians per second
 * @property d Phase offset in radians
 * @property amp Amplitude factor (dimensionless, relative to base power)
 */
export interface Harmonic {
    /** Oscillation frequency in radians per second (typically 1.0-10.0) */
    readonly freq: number;

    /** Phase offset in radians (0 to 2π) */
    readonly d: number;

    /** Amplitude factor (dimensionless, typically 0-0.01) */
    readonly amp: number;
}
