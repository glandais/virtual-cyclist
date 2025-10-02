import { DEFAULT_CYCLIST_POWER_W } from '@/constants/';
import { Elevation } from '@/elevation/';
import { MaxSpeedComputer, VirtualizeService } from '@/physics/';
import { aeroProviderConstant } from '@/physics/power/aero/aero/';
import { rhoProviderEstimate } from '@/physics/power/aero/rho/';
import { windProviderNone } from '@/physics/power/aero/wind/';
import { PowerProviderConstant } from '@/physics/power/cyclist/';
import { DouglasPeucker, PointPerSecond } from '@/processing/';
import { CoursePhysics, EnhanceOptions } from '@/types/course/';
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

        // Step 1: Fix elevation
        if (opts.fixElevation) {
            path = await Elevation.fixElevation(path);
        }

        // Step 2: Compute max speeds
        const courseWithPath = { ...course, path };
        if (opts.computeMaxSpeeds || opts.virtualizeTrack) {
            MaxSpeedComputer.computeMaxSpeeds(courseWithPath);
        }

        // Step 3: Virtualize track
        if (opts.virtualizeTrack) {
            path = VirtualizeService.virtualizeTrack(courseWithPath);
        }

        // Step 4: Compute one point per second
        if (opts.computeOnePointPerSecond) {
            path = PointPerSecond.computeOnePointPerSecond(path);
        }

        // Step 5: Simplify path
        if (opts.simplifyPath.enable) {
            path = DouglasPeucker.simplify(
                path,
                opts.simplifyPath.tolerance,
                opts.simplifyPath.zExaggeration
            );
        }

        logger.timeEndLevel(LogLevel.INFO, 'enhance');
        return path;
    }
}
