import { Elevation } from '@/elevation/';
import { MaxSpeedComputer, VirtualizeService } from '@/physics/';
import { aeroProviderConstant } from '@/physics/power/aero/aero/';
import { rhoProviderEstimate } from '@/physics/power/aero/rho/';
import { windProviderNone } from '@/physics/power/aero/wind/';
import { powerProviderConstant } from '@/physics/power/cyclist/';
import { DouglasPeucker, PointPerSecond } from '@/processing/';
import { CoursePhysics } from '@/types/course/';
import { Bike, Cyclist } from '@/types/models/';
import { Path } from '@/types/path/';
import { createLogger, Logger, LogLevel } from '@/utils/';

const logger: Logger = createLogger('enhancer/Enhancer');

export class Enhancer {
    public static getDefaultCourse(path: Path): CoursePhysics {
        return {
            path,
            bike: Bike.getDefault(),
            cyclist: Cyclist.getDefault(),
            rhoProvider: rhoProviderEstimate,
            aeroProvider: aeroProviderConstant,
            windProvider: windProviderNone,
            cyclistPowerProvider: powerProviderConstant,
        };
    }

    public static async enhancePath(path: Path): Promise<Path> {
        return this.enhance(this.getDefaultCourse(path));
    }

    public static async enhance(course: CoursePhysics): Promise<Path> {
        logger.timeLevel(LogLevel.INFO, 'enhance');
        logger.info(course);
        let path = await Elevation.fixElevation(course.path);
        const courseFixedElevation = { ...course, path };
        MaxSpeedComputer.computeMaxSpeeds(courseFixedElevation);
        path = VirtualizeService.virtualizeTrack(courseFixedElevation);
        path = PointPerSecond.computeOnePointPerSecond(path);
        path = DouglasPeucker.simplify(path, 10, 3);
        logger.timeEndLevel(LogLevel.INFO, 'enhance');
        return path;
    }
}
