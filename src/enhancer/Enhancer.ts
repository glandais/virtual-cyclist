import { DEFAULT_CYCLIST_POWER_W } from '@/constants/';
import { Elevation } from '@/elevation/';
import { MaxSpeedComputer, VirtualizeService } from '@/physics/';
import { aeroProviderConstant } from '@/physics/power/aero/aero/';
import { rhoProviderEstimate } from '@/physics/power/aero/rho/';
import { windProviderNone } from '@/physics/power/aero/wind/';
import { PowerProviderConstant } from '@/physics/power/cyclist/';
import { DouglasPeucker, PointPerDistance, PointPerSecond } from '@/processing/';
import { CoursePhysics, EnhanceOptions } from '@/types/course/';
import { Bike, Cyclist } from '@/types/models/';
import { Path, PointField } from '@/types/path/';
import { createLogger, Logger, LogLevel } from '@/utils/';

const logger: Logger = createLogger('enhancer/Enhancer');

export class Enhancer {
    static INPUT_GPX_FIELDS: PointField[] = [
        PointField.LATITUDE,
        PointField.LONGITUDE,
        PointField.ELEVATION,
        PointField.TIME,
        PointField.P_INPUT_POWER,
        PointField.TEMPERATURE,
        PointField.HEART_RATE,
        PointField.CADENCE,
    ];

    public static getDefaultCourse(path: Path): CoursePhysics {
        return {
            path,
            bike: Bike.getDefault(),
            cyclist: Cyclist.getDefault(),
            rhoProvider: rhoProviderEstimate,
            aeroProvider: aeroProviderConstant,
            windProvider: windProviderNone,
            cyclistPowerProvider: new PowerProviderConstant(DEFAULT_CYCLIST_POWER_W, false),
        };
    }

    public static async enhanceCourseDefault(path: Path): Promise<Path> {
        return this.enhanceCourse(this.getDefaultCourse(path));
    }

    public static async enhanceCourse(
        course: CoursePhysics,
        options?: EnhanceOptions
    ): Promise<Path> {
        logger.timeLevel(LogLevel.INFO, 'enhance');
        logger.info(course);

        // Apply defaults
        const opts = {
            fixElevation: options?.fixElevation ?? true,
            computeMaxSpeeds: options?.computeMaxSpeeds ?? true,
            virtualizeTrack: options?.virtualizeTrack ?? true,
            computeOnePointPerSecond: options?.computeOnePointPerSecond ?? true,
            simplifyPath: {
                enable: options?.simplifyPath?.enable ?? true,
                tolerance: options?.simplifyPath?.tolerance ?? 10,
                zExaggeration: options?.simplifyPath?.zExaggeration ?? 3,
            },
        };

        let path = course.path;

        logger.info('Point count : %s', path.length);

        logger.timeLevel(LogLevel.INFO, 'PointPerDistance.compute');
        path = PointPerDistance.compute(path, -1.0, 30.0, this.INPUT_GPX_FIELDS);
        logger.timeEndLevel(LogLevel.INFO, 'PointPerDistance.compute');

        logger.info('Point count : %s', path.length);

        // Step 1: Fix elevation
        if (opts.fixElevation) {
            logger.timeLevel(LogLevel.INFO, 'Elevation.fixElevation');
            path = await Elevation.fixElevation(path);
            logger.timeEndLevel(LogLevel.INFO, 'Elevation.fixElevation');
            logger.info('Point count : %s', path.length);
        }

        logger.timeLevel(LogLevel.INFO, 'PointPerDistance.compute');
        path = PointPerDistance.compute(path, 1.0, 2.0, this.INPUT_GPX_FIELDS);
        logger.timeEndLevel(LogLevel.INFO, 'PointPerDistance.compute');

        logger.info('Point count : %s', path.length);

        logger.timeLevel(LogLevel.INFO, 'Elevation.smoothElevation');
        path = await Elevation.smoothElevation(path);
        logger.timeEndLevel(LogLevel.INFO, 'Elevation.smoothElevation');

        logger.info('Point count : %s', path.length);

        // Step 2: Compute max speeds
        const courseWithPath = { ...course, path };
        if (opts.computeMaxSpeeds || opts.virtualizeTrack) {
            logger.timeLevel(LogLevel.INFO, 'MaxSpeedComputer.computeMaxSpeeds');
            MaxSpeedComputer.computeMaxSpeeds(courseWithPath);
            logger.timeEndLevel(LogLevel.INFO, 'MaxSpeedComputer.computeMaxSpeeds');
            logger.info('Point count : %s', path.length);
        }

        // Step 3: Virtualize track
        if (opts.virtualizeTrack) {
            logger.timeLevel(LogLevel.INFO, 'VirtualizeService.virtualizeTrack');
            path = VirtualizeService.virtualizeTrack(courseWithPath);
            logger.timeEndLevel(LogLevel.INFO, 'VirtualizeService.virtualizeTrack');
            logger.info('Point count : %s', path.length);
        }

        // Step 4: Compute one point per second
        if (opts.computeOnePointPerSecond) {
            logger.timeLevel(LogLevel.INFO, 'PointPerSecond.computeOnePointPerSecond');
            path = PointPerSecond.computeOnePointPerSecond(path);
            logger.timeEndLevel(LogLevel.INFO, 'PointPerSecond.computeOnePointPerSecond');
            logger.info('Point count : %s', path.length);
        }

        // Step 5: Simplify path
        if (opts.simplifyPath.enable) {
            logger.timeLevel(LogLevel.INFO, 'DouglasPeucker.simplify');
            path = DouglasPeucker.simplify(
                path,
                opts.simplifyPath.tolerance,
                opts.simplifyPath.zExaggeration
            );
            logger.timeEndLevel(LogLevel.INFO, 'DouglasPeucker.simplify');
            logger.info('Point count : %s', path.length);
        }

        logger.timeEndLevel(LogLevel.INFO, 'enhance');
        return path;
    }
}
