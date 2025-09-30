// ============================================================================
// ANGLE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert degrees to radians.
 *
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Convert radians to degrees.
 *
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
export const toDegrees = (radians: number): number => (radians * 180) / Math.PI;
