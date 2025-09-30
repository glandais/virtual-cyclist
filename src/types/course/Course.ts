import { AeroProvider } from '@/physics/power/aero/aero/';
import { WindProvider } from '@/physics/power/aero/wind/';
import { CyclistPowerProvider, OptimalSpeeds } from '@/physics/power/cyclist/';
import { Bike, Cyclist } from '@/types/models/';
import { Path } from '@/types/path/';

export interface Course {
    readonly path: Path;
    readonly bike: Bike;
    readonly cyclist: Cyclist;
}

export interface CoursePhysicsInput extends Course {
    /** Air density in kg/m³ (default: 1.225 at sea level, 15°C) */
    readonly rho: number;
    /** Aerodynamic coefficient provider */
    readonly aeroProvider: AeroProvider;
    /** Wind conditions provider */
    readonly windProvider: WindProvider;
    /** Cyclist power output provider */
    readonly cyclistPowerProvider: CyclistPowerProvider;
}

export interface CoursePhysics extends CoursePhysicsInput {
    /** Pre-computed optimal speeds lookup table (set during virtualization) */
    readonly optimalSpeeds: OptimalSpeeds;
}
