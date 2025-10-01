import { readFileSync } from 'fs';
import { join } from 'path';

import { GPXParser } from '@/gpx/';
import { VirtualizeService } from '@/physics/';
import { aeroProviderConstant } from '@/physics/power/aero/aero/';
import { rhoProviderDefault } from '@/physics/power/aero/rho/';
import { windProviderNone } from '@/physics/power/aero/wind/';
import { powerProviderConstant } from '@/physics/power/cyclist/';
import { CoursePhysics, EMPTY_POINT, Path } from '@/types/';
import { Bike, Cyclist } from '@/types/models/';

describe('VirtualizeService', () => {
    test('should virtualize a simple track', () => {
        // Load a small GPX file
        const filePath = join(__dirname, '../..', 'gpx', 'sample.gpx');
        const gpx = readFileSync(filePath, 'utf-8');
        const path = GPXParser.parse(gpx).tracks[0];

        // Simple constant power configuration
        const courseInput = {
            path,
            cyclist: Cyclist.getDefault(),
            bike: Bike.getDefault(),
            rhoProvider: rhoProviderDefault,
            cyclistPowerProvider: powerProviderConstant,
            aeroProvider: aeroProviderConstant,
            windProvider: windProviderNone,
        };

        const virtualizedPath = VirtualizeService.virtualizeTrack(courseInput);

        // Should produce a path with points
        expect(virtualizedPath.getPointCount()).toBeGreaterThan(0);

        // Should have calculated speeds
        expect(virtualizedPath.getSpeed(0)).toBeGreaterThan(0);

        // Should have times
        expect(virtualizedPath.getTime(0)).toBeGreaterThan(0);
    });

    test('should handle minimal single-point path', () => {
        const path = new Path('test');
        path.addPoint({
            ...EMPTY_POINT,
            lat: 45.0,
            lon: 6.0,
            ele: 1000,
            time: Date.now(),
            dist: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        });

        const courseInput: CoursePhysics = {
            path,
            cyclist: Cyclist.getDefault(),
            bike: Bike.getDefault(),
            rhoProvider: rhoProviderDefault,
            cyclistPowerProvider: powerProviderConstant,
            aeroProvider: aeroProviderConstant,
            windProvider: windProviderNone,
        };

        // Should handle single point - creates at least one point
        const result = VirtualizeService.virtualizeTrack(courseInput);
        expect(result.getPointCount()).toBeGreaterThanOrEqual(1);
    });
});
