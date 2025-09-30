import { Bike } from './Bike';
import { DEFAULT_AIR_DENSITY } from './constants';
import { Cyclist } from './Cyclist';
import { Elevation } from './elevation';
import { Path } from './Path';
import { MaxSpeedComputer } from './physics';
import { powerProviderConstant } from './physics/power';
import { aeroProviderConstant, windProviderNone } from './physics/power/aero';
import { VirtualizeService } from './physics/VirtualizeService';
import { DouglasPeucker, PointPerSecond } from './processing';
import { CoursePhysicsInput } from './types';
import { createLogger, Logger, LogLevel } from './utils';

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
