import { MaxSpeedComputer } from '../../src/physics/MaxSpeedComputer';
import { Path } from '../../src/Path';
import { Cyclist } from '../../src/Cyclist';
import { Bike } from '../../src/Bike';
import { EMPTY_POINT } from '../../src/types';
import { toRadians } from '../../src/constants';
import { GPXParser } from '../../src';
import { join } from 'path';
import { readFileSync } from 'fs';

interface TestCourse {
    path: Path;
    cyclist: Cyclist;
    bike: Bike;
}

// Extended class to test protected methods
class MaxSpeedComputerExtended extends MaxSpeedComputer {
    public firstPass(course: TestCourse): void {
        return super.firstPass(course);
    }

    public secondPass(course: TestCourse): void {
        return super.secondPass(course);
    }
}

describe('MaxSpeedComputer', () => {
    let maxSpeedComputer: MaxSpeedComputerExtended;
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

        maxSpeedComputer = new MaxSpeedComputerExtended();
        path = GPXParser.parse(gpx).tracks[0];
        path.computeArrays();
        cyclist = Cyclist.getDefault();
        bike = Bike.getDefault();
        course = { path, cyclist, bike };
    });

    test('should compute max speeds without errors', () => {
        expect(() => {
            maxSpeedComputer.computeMaxSpeeds(course);
        }).not.toThrow();
    });
});