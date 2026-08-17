/**
 * Physics constants and default parameters for virtual cycling simulations.
 *
 * All default values are validated against academic cycling research and
 * real-world bicycle performance data.
 *
 * @fileoverview Physics constants based on gpx2web Java Constants class
 */

// ============================================================================
// FUNDAMENTAL PHYSICS CONSTANTS
// ============================================================================

/**
 * Standard gravitational acceleration (m/s²)
 * Source: International System of Units (SI), standard gravity g₀ = 9.80665 m/s²
 *
 * Historically 9.8 in this codebase; using the exact SI value removes a 0.07%
 * systematic bias on both the gravity and rolling-resistance terms.
 */
export const G = 9.80665;

/**
 * Minimal speed threshold = 2km/h (m/s)
 * Below this speed, physics calculations may become unstable
 */
export const MINIMAL_SPEED = 2.0 / 3.6;

// ============================================================================
// GEODETIC CONSTANTS (WGS-84)
// ============================================================================

/**
 * WGS-84 semi-major axis (meters)
 * Source: World Geodetic System 1984 specification
 */
export const SEMI_MAJOR_AXIS = 6378137.0;

/**
 * WGS-84 first eccentricity squared (dimensionless)
 * Source: World Geodetic System 1984 specification
 */
export const FIRST_ECCENTRICITY_SQUARED = 6.6943799901378e-3;

/**
 * Earth's circumference at equator (meters)
 * Calculated from WGS-84 semi-major axis
 */
export const CIRC = SEMI_MAJOR_AXIS * 2 * Math.PI;

// ============================================================================
// BICYCLE PARAMETERS (Validated against academic sources)
// ============================================================================

/**
 * Rolling resistance coefficient for road bike tires (dimensionless)
 * Source: bicyclerollingresistance.com research, typical range 0.003-0.005
 * Reference: Continental GP5000 and similar high-performance road tires
 */
export const DEFAULT_CRR = 0.004;

/**
 * Front wheel inertia moment (kg⋅m²)
 * Source: Physics education materials, racing wheels with rim mass concentration
 * Typical lightweight racing wheels: ~0.05 kg⋅m²
 */
export const DEFAULT_INERTIA_FRONT = 0.05;

/**
 * Rear wheel inertia moment (kg⋅m²)
 * Source: Physics education materials, rear wheel slightly heavier due to cassette
 * Typical lightweight racing wheels: ~0.07 kg⋅m²
 */
export const DEFAULT_INERTIA_REAR = 0.07;

/**
 * Standard road bike wheel radius (meters)
 * Source: 700c wheel with a 25mm tire — ~0.7m diameter, so a 0.35m radius.
 * Martin et al. (1998) use r = 0.311m for a 20mm tire.
 *
 * Was 0.7 until the research review: that is the *diameter*. The bug understated
 * the rotating mass in `getEquivalentMass()` (I/r²) by ~0.73kg and made
 * `getWheelCircumference()` wrong by a factor of 2.
 */
export const DEFAULT_WHEEL_RADIUS = 0.35;

/**
 * Drivetrain efficiency (dimensionless, 0-1)
 * Source: Modern road bike drivetrain efficiency measurements
 * Reference: Chain efficiency studies, well-maintained equipment
 */
export const DEFAULT_DRIVETRAIN_EFFICIENCY = 0.976;

// ============================================================================
// CYCLIST PARAMETERS
// ============================================================================

/**
 * Total system mass: cyclist + bike (kg)
 * Source: Typical recreational/competitive cyclist (70kg) + road bike (10kg)
 * Representative of intermediate to advanced cycling enthusiasts
 */
export const DEFAULT_CYCLIST_MASS_KG = 80;

/**
 * Sustained power output (watts)
 * Source: ~3.5 W/kg FTP for 80kg cyclist (intermediate/advanced recreational level)
 * Reference: Training and Racing with a Power Meter (Allen & Coggan)
 */
export const DEFAULT_CYCLIST_POWER_W = 280;

// ============================================================================
// BRAKING AND HANDLING PARAMETERS
// ============================================================================

/**
 * Maximum braking deceleration coefficient (g units)
 * Source: the pitch-over (stoppie) ceiling is 0.56-0.63g, but measured riders
 * actually use 0.41 ± 0.07g in combined braking — ~60-65% of the limit.
 * Reference: SAE Technical Paper 2020-01-0876 "Bicycle Braking Performance Testing"
 *
 * 0.4 models a *believable* rider. 0.6 (the old default) is the physical ceiling
 * and is better set explicitly as an "expert descender" configuration.
 */
export const DEFAULT_MAX_BRAKE_G = 0.4;

/**
 * Maximum lean angle for cornering (degrees)
 * Source: Practical limit on crowned roads from cycling physics research
 * Reference: Brandt's analysis of bicycle cornering dynamics
 *
 * Cornering uses `v_max = √(g · R · tan θ)`, which is `v_max = √(µ · g · R)` with
 * **µ ≡ tan θ** — so this parameter *is* a tyre friction coefficient. At 35°,
 * µ = 0.70. Zignoli (2020) measures µ = 0.90 dry (42.0°) and µ = 0.36 wet (19.8°)
 * for road tyres, so the default sits at 78% of dry grip: a confident rider
 * leaving margin, consistent with real descenders riding below the optimal line.
 */
export const DEFAULT_MAX_LEAN_ANGLE_DEG = 35;

/**
 * Maximum lean angle for cornering (radians)
 * Converted from degrees for internal physics calculations
 */
export const DEFAULT_MAX_LEAN_ANGLE_RAD = (DEFAULT_MAX_LEAN_ANGLE_DEG * Math.PI) / 180;

/**
 * Maximum speed capability (km/h)
 * Source: Reasonable maximum for recreational cycling on roads
 * Professional sprinting can exceed this, but represents safe operational limit
 */
export const DEFAULT_MAX_SPEED_KMH = 100;

// ============================================================================
// AERODYNAMIC PARAMETERS
// ============================================================================

/**
 * Aerodynamic drag coefficient (dimensionless)
 * Source: Academic cycling aerodynamics research, typical range 0.6-0.8
 * Reference: "Aerodynamic drag in cycling: Methods of assessment" (ResearchGate)
 * Represents typical road cyclist in moderate aero position
 */
export const DEFAULT_DRAG_COEFFICIENT = 0.7;

/**
 * Cyclist frontal area (m²)
 * Source: Cycling aerodynamics studies show range 0.394-0.531 m²
 * Reference: "Reference values and improvement of aerodynamic drag in professional cyclists"
 * Represents typical recreational cyclist position
 */
export const DEFAULT_FRONTAL_AREA = 0.5;

/**
 * Air density at sea level standard conditions (kg/m³)
 * Source: ISO International Standard Atmosphere (ISA), 15°C, 1 atm
 * Reference: Used in cycling aerodynamics research (Martin et al.)
 */
export const DEFAULT_AIR_DENSITY = 1.225;
