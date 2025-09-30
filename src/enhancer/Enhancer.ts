import { DEFAULT_AIR_DENSITY } from '@/constants/';
import { Elevation } from '@/elevation/';
import { MaxSpeedComputer, VirtualizeService } from '@/physics/';
import { aeroProviderConstant } from '@/physics/power/aero/aero/';
import { windProviderNone } from '@/physics/power/aero/wind/';
import { powerProviderConstant } from '@/physics/power/cyclist/';
import { DouglasPeucker, PointPerSecond } from '@/processing/';
import { CoursePhysicsInput } from '@/types/course/';
import { Bike, Cyclist } from '@/types/models/';
import { Path } from '@/types/path/';
import { createLogger, Logger, LogLevel } from '@/utils/';

const logger: Logger = createLogger('Enhancer');

export class Enhancer {
    public static getCourse(path: Path): CoursePhysicsInput {
        return {
            path,
            bike: Bike.getDefault(),
            cyclist: Cyclist.getDefault(),
            rho: DEFAULT_AIR_DENSITY,
            aeroProvider: aeroProviderConstant,
            windProvider: windProviderNone,
            cyclistPowerProvider: powerProviderConstant,
        };
    }

    public static async enhancePath(path: Path): Promise<Path> {
        return this.enhance(this.getCourse(path));
    }

    public static async enhance(course: CoursePhysicsInput): Promise<Path> {
        logger.timeLevel(LogLevel.INFO, 'enhance');
        logger.info(course);
        const path = await Elevation.fixElevation(course.path);
        const courseFixedElevation = { ...course, path };
        MaxSpeedComputer.computeMaxSpeeds(courseFixedElevation);
        const virtualized = VirtualizeService.virtualizeTrack(courseFixedElevation);
        const pointPerSecondPath = PointPerSecond.computeOnePointPerSecond(virtualized);
        const simplified = DouglasPeucker.simplify(pointPerSecondPath, 10, 3);
        logger.timeEndLevel(LogLevel.INFO, 'enhance');
        return simplified;
    }
}
