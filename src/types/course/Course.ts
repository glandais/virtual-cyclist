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
