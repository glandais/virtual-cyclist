import { GPXParser, GPXWriter } from '../../src';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('GPX Integration Tests', () => {
    const sampleGpxFiles = [
        'sample.gpx',
        'amazfit.gpx',
        'garmin.gpx',
        'movescount.gpx',
        'sports-tracker.gpx',
        'strava.gpx',
    ];

    const sampleGpxContent: Record<string, string> = {};

    beforeAll(() => {
        // Load all sample GPX files
        for (const filename of sampleGpxFiles) {
            const filePath = join(__dirname, '../..', 'gpx', filename);
            try {
                sampleGpxContent[filename] = readFileSync(filePath, 'utf-8');
            } catch (error) {
                console.warn(`Could not load ${filename}:`, error);
            }
        }
    });

    describe('GPXParser.parse', () => {
        test('sample.gpx', () => {
            const path = GPXParser.parse(sampleGpxContent['sample.gpx']).tracks[0];
            expect(path.getLatitudeDeg(0)).toBeCloseTo(45.680697, 3);
            expect(path.getLongitudeDeg(0)).toBeCloseTo(6.396115, 3);
            expect(path.getTime(0)).toBeCloseTo(1730643922000, 3);
            expect(path.getPower(0)).toBeCloseTo(45.0, 3);
            expect(path.getTotalDistance()).toBeCloseTo(130392.6632939374, 3);

            GPXWriter.writeFromPath(path);
        });

        test('amazfit.gpx', () => {
            const path = GPXParser.parse(sampleGpxContent['amazfit.gpx']).tracks[0];
            expect(path.getLatitudeDeg(0)).toBeCloseTo(60.272281646728516, 3);
            expect(path.getLongitudeDeg(0)).toBeCloseTo(24.973012924194336, 3);
            expect(path.getTime(0)).toBeCloseTo(1526291652000, 3);
            expect(path.getHeartRate(0)).toBeCloseTo(89.0, 3);
        });

        test('garmin.gpx', () => {
            const path = GPXParser.parse(sampleGpxContent['garmin.gpx']).tracks[0];
            expect(path.getLatitudeDeg(0)).toBeCloseTo(60.29198664240539073944091796875, 3);
            expect(path.getLongitudeDeg(0)).toBeCloseTo(25.02485521137714385986328125, 3);
            expect(path.getElevation(0)).toBeCloseTo(16.2, 3);
            expect(path.getTime(0)).toBeCloseTo(1524498874000, 3);
            expect(path.getHeartRate(0)).toBeCloseTo(61.0, 3);
            expect(path.getCadence(1)).toBeCloseTo(81.0, 3);
        });

        test('movescount.gpx', () => {
            const path = GPXParser.parse(sampleGpxContent['movescount.gpx']).tracks[0];
            expect(path.getLatitudeDeg(2)).toBeCloseTo(42.94147, 3);
            expect(path.getLongitudeDeg(2)).toBeCloseTo(0.962951, 3);
            expect(path.getElevation(2)).toBeCloseTo(707, 3);
            expect(path.getTime(2)).toBeCloseTo(1526220670000, 3);
            expect(path.getHeartRate(2)).toBeCloseTo(98.0, 3);
            expect(path.getCadence(2)).toBeCloseTo(87.0, 3);
        });

        test('sports-tracker.gpx', () => {
            const path = GPXParser.parse(sampleGpxContent['sports-tracker.gpx']).tracks[0];
            expect(path.getLatitudeDeg(2)).toBeCloseTo(42.94131, 3);
            expect(path.getLongitudeDeg(2)).toBeCloseTo(0.96299, 3);
            expect(path.getElevation(12)).toBeCloseTo(707, 3);
            expect(path.getTime(2)).toBeCloseTo(1526220663000, 3);
            expect(path.getHeartRate(2)).toBeCloseTo(85.0, 3);
        });

        test('strava.gpx', () => {
            const path = GPXParser.parse(sampleGpxContent['strava.gpx']).tracks[0];
            expect(path.getLatitudeDeg(0)).toBeCloseTo(42.941059, 3);
            expect(path.getLongitudeDeg(0)).toBeCloseTo(0.963041, 3);
            expect(path.getElevation(0)).toBeCloseTo(721.2, 3);
            expect(path.getTime(0)).toBeCloseTo(1526309661000, 3);
            expect(path.getHeartRate(0)).toBeCloseTo(117.0, 3);
            expect(path.getCadence(0)).toBeCloseTo(85.0, 3);

            GPXWriter.writeFromPath(path);
        });
    });
});
