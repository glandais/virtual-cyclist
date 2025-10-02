import { readFileSync } from 'fs';
import { join } from 'path';

import { GPXParser } from '@/gpx/';
import { MaxSpeedComputer } from '@/physics/';
import { Bike, Cyclist } from '@/types/models/';
import { Path } from '@/types/path/';

interface TestCourse {
    path: Path;
    cyclist: Cyclist;
    bike: Bike;
}

describe('MaxSpeedComputer', () => {
    let path: Path;
    let cyclist: Cyclist;
    let bike: Bike;
    let course: TestCourse;

    beforeEach(() => {
        const filePath = join(__dirname, '../..', 'gpx', 'stelvio.gpx');
        let gpx;
        try {
            gpx = readFileSync(filePath, 'utf-8');
        } catch (error) {
            console.warn(`Could not load stelvio.gpx:`, error);
            throw error;
        }

        path = GPXParser.parse(gpx).tracks[0];
        path.computeDerivedData();
        cyclist = Cyclist.getDefault();
        bike = Bike.getDefault();
        course = { path, cyclist, bike };
    });

    test('should compute max speeds without errors', () => {
        expect(() => {
            MaxSpeedComputer.computeMaxSpeeds(course);
        }).not.toThrow();
    });
});
