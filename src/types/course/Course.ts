import { AeroProvider } from '@/physics/power/aero/aero/';
import { RhoProvider } from '@/physics/power/aero/rho/';
import { WindProvider } from '@/physics/power/aero/wind/';
import { CyclistPowerProvider } from '@/physics/power/cyclist/';
import { Bike, Cyclist } from '@/types/models/';
import { Path } from '@/types/path/';

export interface Course {
    readonly path: Path;
    readonly bike: Bike;
    readonly cyclist: Cyclist;
}

export interface CoursePhysics extends Course {
    /** Air density in kg/m³ (default: 1.225 at sea level, 15°C) */
    readonly rhoProvider: RhoProvider;
    /** Aerodynamic coefficient provider */
    readonly aeroProvider: AeroProvider;
    /** Wind conditions provider */
    readonly windProvider: WindProvider;
    /** Cyclist power output provider */
    readonly cyclistPowerProvider: CyclistPowerProvider;
}

export interface SimplifyPathOptions {
    /** Enable path simplification (default: true) */
    readonly enable?: boolean;
    /** Maximum allowed distance from simplified line in meters (default: 10) */
    readonly tolerance?: number;
    /** Elevation exaggeration factor for 3D distance calculations (default: 3) */
    readonly zExaggeration?: number;
}

export interface EnhanceOptions {
    /** Fix elevation data using elevation service (default: true) */
    readonly fixElevation?: boolean;
    /** Compute maximum safe speeds based on cornering and braking (default: true). Activated anyway if virtualizeTrack is true */
    readonly computeMaxSpeeds?: boolean;
    /** Simulate realistic cycling speeds using power-based calculations (default: true) */
    readonly virtualizeTrack?: boolean;
    /** Resample path to one point per second (default: true) */
    readonly computeOnePointPerSecond?: boolean;
    /** Simplify path using Douglas-Peucker algorithm (default: enabled with tolerance=10, zExaggeration=3) */
    readonly simplifyPath?: SimplifyPathOptions;
}
