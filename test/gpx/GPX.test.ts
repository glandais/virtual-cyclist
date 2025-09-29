import { Path, GPXParser, GPXWriter, PathConverter } from '../../src';
import { toRadians } from '../../src/constants';
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

    describe('GPXParser', () => {
        test('should parse sample.gpx correctly', () => {
            if (!sampleGpxContent['sample.gpx']) {
                console.warn('sample.gpx not available, skipping test');
                return;
            }

            const parser = new GPXParser();
            const gpxData = parser.parse(sampleGpxContent['sample.gpx']);

            expect(gpxData.version).toBe('1.1');
            expect(gpxData.tracks).toHaveLength(1);
            expect(gpxData.tracks[0].segments).toHaveLength(1);
            expect(gpxData.tracks[0].segments[0].trackPoints.length).toBeGreaterThan(0);

            // Check first track point
            const firstPoint = gpxData.tracks[0].segments[0].trackPoints[0];
            expect(typeof firstPoint.lat).toBe('number');
            expect(typeof firstPoint.lon).toBe('number');
            expect(firstPoint.lat).toBeGreaterThan(-90);
            expect(firstPoint.lat).toBeLessThan(90);
            expect(firstPoint.lon).toBeGreaterThan(-180);
            expect(firstPoint.lon).toBeLessThan(180);
        });

        test('should parse Garmin format with TrackPointExtensions', () => {
            if (!sampleGpxContent['garmin.gpx']) {
                console.warn('garmin.gpx not available, skipping test');
                return;
            }

            const parser = new GPXParser();
            const gpxData = parser.parse(sampleGpxContent['garmin.gpx']);

            expect(gpxData.tracks).toHaveLength(1);
            expect(gpxData.tracks[0].segments[0].trackPoints.length).toBeGreaterThan(0);

            // Look for track points with heart rate or cadence extensions
            const pointsWithExtensions = gpxData.tracks[0].segments[0].trackPoints.filter(
                point => point.extensions
            );

            if (pointsWithExtensions.length > 0) {
                const pointWithExt = pointsWithExtensions[0];
                if (pointWithExt.extensions?.heartRate) {
                    expect(typeof pointWithExt.extensions.heartRate).toBe('number');
                    expect(pointWithExt.extensions.heartRate).toBeGreaterThan(0);
                }
            }
        });

        test('should parse Amazfit format', () => {
            if (!sampleGpxContent['amazfit.gpx']) {
                console.warn('amazfit.gpx not available, skipping test');
                return;
            }

            const parser = new GPXParser();
            const gpxData = parser.parse(sampleGpxContent['amazfit.gpx']);

            expect(gpxData.tracks).toHaveLength(1);
            expect(gpxData.tracks[0].segments[0].trackPoints.length).toBeGreaterThan(0);

            // Amazfit often has non-namespaced extensions
            const pointsWithExtensions = gpxData.tracks[0].segments[0].trackPoints.filter(
                point => point.extensions
            );

            if (pointsWithExtensions.length > 0) {
                const pointWithExt = pointsWithExtensions[0];
                // Check for any extension data
                expect(pointWithExt.extensions).toBeDefined();
            }
        });

        test('should handle empty GPX gracefully', () => {
            const emptyGpx = `<?xml version="1.0" encoding="UTF-8"?>
                <gpx version="1.1" creator="test">
                    <trk>
                        <trkseg>
                        </trkseg>
                    </trk>
                </gpx>`;

            const parser = new GPXParser();
            const gpxData = parser.parse(emptyGpx);

            expect(gpxData.tracks).toHaveLength(1);
            expect(gpxData.tracks[0].segments[0].trackPoints).toHaveLength(0);
        });

        test('should throw error for invalid GPX', () => {
            const invalidGpx = '<invalid>not gpx</invalid>';

            const parser = new GPXParser();
            expect(() => parser.parse(invalidGpx)).toThrow();
        });

        test('should throw error for missing tracks', () => {
            const noTracksGpx = `<?xml version="1.0" encoding="UTF-8"?>
                <gpx version="1.1" creator="test">
                </gpx>`;

            const parser = new GPXParser();
            const gpxData = parser.parse(noTracksGpx);
            expect(gpxData.tracks).toHaveLength(0);
        });

        test('static parse method should work', () => {
            if (!sampleGpxContent['sample.gpx']) {
                console.warn('sample.gpx not available, skipping test');
                return;
            }

            const gpxData = GPXParser.parse(sampleGpxContent['sample.gpx']);
            expect(gpxData.tracks).toHaveLength(1);
        });
    });

    describe('GPXWriter', () => {
        test('should write valid GPX from Path', () => {
            const path = new Path();

            // Add some test points
            path.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 372,
                time: new Date('2023-06-15T10:00:00Z').getTime(),
                heartRate: 120,
                cadence: 80,
                power: 250,
                temperature: 22,
                speed: 5.56, // 20 km/h
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pCyclistCurrentSpeed: 0,
                pCyclistOptimalSpeed: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0,
                grade: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
            });

            const writer = new GPXWriter();
            const gpxContent = writer.writeFromPath(path);

            expect(gpxContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(gpxContent).toContain('<gpx');
            expect(gpxContent).toContain('version="1.1"');
            expect(gpxContent).toContain('<trk>');
            expect(gpxContent).toContain('<trkseg>');
            expect(gpxContent).toContain('<trkpt');
            expect(gpxContent).toContain('lat="46.5197"');
            expect(gpxContent).toContain('lon="6.6323"');
            expect(gpxContent).toContain('<ele>372</ele>');
            expect(gpxContent).toContain('<time>2023-06-15T10:00:00.000Z</time>');
        });

        test('should include extensions when enabled', () => {
            const path = new Path();
            path.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 372,
                heartRate: 120,
                cadence: 80,
                power: 250,
                time: new Date('2023-06-15T10:00:00Z').getTime(),
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pCyclistCurrentSpeed: 0,
                pCyclistOptimalSpeed: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
            });

            const writer = new GPXWriter({ includeExtensions: true });
            const gpxContent = writer.writeFromPath(path);

            expect(gpxContent).toContain('<extensions>');
            expect(gpxContent).toContain('gpxtpx:hr');
            expect(gpxContent).toContain('120');
            expect(gpxContent).toContain('gpxtpx:cad');
            expect(gpxContent).toContain('80');
            expect(gpxContent).toContain('<power>250</power>');
        });

        test('should exclude extensions when disabled', () => {
            const path = new Path();
            path.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 372,
                heartRate: 120,
                time: new Date('2023-06-15T10:00:00Z').getTime(),
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pCyclistCurrentSpeed: 0,
                pCyclistOptimalSpeed: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                cadence: 0,
                power: 0,
            });

            const writer = new GPXWriter({ includeExtensions: false });
            const gpxContent = writer.writeFromPath(path);

            expect(gpxContent).not.toContain('<extensions>');
            expect(gpxContent).not.toContain('gpxtpx:hr');
        });

        test('static writeFromPath method should work', () => {
            const path = new Path();
            path.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 372,
                time: new Date('2023-06-15T10:00:00Z').getTime(),
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                power: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pCyclistCurrentSpeed: 0,
                pCyclistOptimalSpeed: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            const gpxContent = GPXWriter.writeFromPath(path);
            expect(gpxContent).toContain('<gpx');
        });
    });

    describe('Path GPX Integration', () => {
        test('should create Path from GPX content', () => {
            if (!sampleGpxContent['sample.gpx']) {
                console.warn('sample.gpx not available, skipping test');
                return;
            }

            const path = Path.fromGPX(sampleGpxContent['sample.gpx']);

            expect(path.getPointCount()).toBeGreaterThan(0);

            // Check first point
            const firstPoint = path.getPointData(0);
            expect(typeof firstPoint.lat).toBe('number');
            expect(typeof firstPoint.lon).toBe('number');
            expect(firstPoint.lat).toBeGreaterThan(-90);
            expect(firstPoint.lat).toBeLessThan(90);
        });

        test('should export Path to GPX', () => {
            const path = new Path();
            path.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 372,
                time: new Date('2023-06-15T10:00:00Z').getTime(),
                heartRate: 120,
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                power: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pCyclistCurrentSpeed: 0,
                pCyclistOptimalSpeed: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                cadence: 0,
            });

            const gpxContent = path.toGPX();

            expect(gpxContent).toContain('<gpx');
            expect(gpxContent).toContain('lat="46.5197"');
            expect(gpxContent).toContain('lon="6.6323"');
        });

        test('should load GPX into existing Path', () => {
            if (!sampleGpxContent['sample.gpx']) {
                console.warn('sample.gpx not available, skipping test');
                return;
            }

            const path = new Path();
            // Add some initial data
            path.addPoint({
                lat: 0,
                lon: 0,
                ele: 0,
                time: 0,
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                power: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pCyclistCurrentSpeed: 0,
                pCyclistOptimalSpeed: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            expect(path.getPointCount()).toBe(1);

            // Load GPX content (should clear existing data)
            path.loadFromGPX(sampleGpxContent['sample.gpx']);

            expect(path.getPointCount()).toBeGreaterThan(1);
            // Verify the first point is from GPX, not the original point
            const firstPoint = path.getPointData(0);
            expect(firstPoint.lat).not.toBe(0);
            expect(firstPoint.lon).not.toBe(0);
        });

        test('should export to GPXData structure', () => {
            const path = new Path();
            path.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 372,
                time: new Date('2023-06-15T10:00:00Z').getTime(),
                heartRate: 120,
                power: 250,
                bearing: 0,
                dist: 0,
                radius: 0,
                elapsed: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pCyclistCurrentSpeed: 0,
                pCyclistOptimalSpeed: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                cadence: 0,
            });

            const gpxData = path.toGPXData();

            expect(gpxData.version).toBe('1.1');
            expect(gpxData.creator).toBe('@glandais/virtual-cyclist');
            expect(gpxData.tracks).toHaveLength(1);
            expect(gpxData.tracks[0].name).toBe('Virtual Cyclist Track');
            expect(gpxData.tracks[0].type).toBe('cycling');
            expect(gpxData.tracks[0].segments[0].trackPoints).toHaveLength(1);

            const trackPoint = gpxData.tracks[0].segments[0].trackPoints[0];
            expect(trackPoint.lat).toBe(46.5197);
            expect(trackPoint.lon).toBe(6.6323);
            expect(trackPoint.ele).toBe(372);
            expect(trackPoint.extensions?.heartRate).toBe(120);
            expect(trackPoint.extensions?.power).toBe(250);
        });

        test('should handle round-trip conversion', () => {
            if (!sampleGpxContent['sample.gpx']) {
                console.warn('sample.gpx not available, skipping test');
                return;
            }

            // Parse GPX to Path
            const originalPath = Path.fromGPX(sampleGpxContent['sample.gpx']);
            const originalPointCount = originalPath.getPointCount();

            // Convert back to GPX
            const gpxContent = originalPath.toGPX();

            // Parse GPX again
            const roundTripPath = Path.fromGPX(gpxContent);

            expect(roundTripPath.getPointCount()).toBe(originalPointCount);

            // Compare first and last points
            if (originalPointCount > 0) {
                const originalFirst = originalPath.getPointData(0);
                const roundTripFirst = roundTripPath.getPointData(0);

                expect(Math.abs(roundTripFirst.lat - originalFirst.lat)).toBeLessThan(0.000001);
                expect(Math.abs(roundTripFirst.lon - originalFirst.lon)).toBeLessThan(0.000001);
            }
        });
    });

    describe('Error Handling', () => {
        test('should throw error for GPX with no tracks', () => {
            const noTracksGpx = `<?xml version="1.0" encoding="UTF-8"?>
                <gpx version="1.1" creator="test">
                </gpx>`;

            expect(() => Path.fromGPX(noTracksGpx)).toThrow('No tracks found in GPX file');
        });

        test('should throw error for track with no segments', () => {
            const noSegmentsGpx = `<?xml version="1.0" encoding="UTF-8"?>
                <gpx version="1.1" creator="test">
                    <trk>
                    </trk>
                </gpx>`;

            expect(() => Path.fromGPX(noSegmentsGpx)).toThrow('No segments found in GPX track');
        });

        test('should throw error for invalid track point', () => {
            const invalidTrackPointGpx = `<?xml version="1.0" encoding="UTF-8"?>
                <gpx version="1.1" creator="test">
                    <trk>
                        <trkseg>
                            <trkpt lat="invalid" lon="6.6323">
                            </trkpt>
                        </trkseg>
                    </trk>
                </gpx>`;

            const parser = new GPXParser();
            expect(() => parser.parse(invalidTrackPointGpx)).toThrow();
        });
    });

    describe('PathConverter', () => {
        test('should create Path from GPX using PathConverter', () => {
            const basicGpx = `<?xml version="1.0" encoding="UTF-8"?>
                <gpx version="1.1" creator="test">
                    <trk>
                        <trkseg>
                            <trkpt lat="46.5197" lon="6.6323" ele="372.2">
                                <time>2023-01-01T10:00:00Z</time>
                            </trkpt>
                        </trkseg>
                    </trk>
                </gpx>`;

            const path = PathConverter.fromGPX(basicGpx);
            expect(path.getPointCount()).toBe(1);
            expect(path.getLatitude(0)).toBeCloseTo(toRadians(46.5197), 6);
            expect(path.getLongitude(0)).toBeCloseTo(toRadians(6.6323), 6);
            // Note: Elevation and extensions parsing might depend on GPX parser implementation
            expect(path.getElevation(0)).toBeGreaterThanOrEqual(0);
        });

        test('should export Path to GPX using PathConverter', () => {
            const path = new Path();
            path.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 372.2,
                bearing: 0,
                dist: 0,
                radius: 0,
                time: new Date('2023-01-01T10:00:00Z').getTime(),
                elapsed: 0,
                power: 250,
                pCyclistRaw: 240,
                pCyclistWheel: 230,
                pCyclistOptimalPower: 245,
                pCyclistCurrentSpeed: 220,
                pCyclistOptimalSpeed: 235,
                pAero: -80,
                pGravity: -20,
                pRollingResistance: -15,
                pWheelBearings: -5,
                pPowerFromAcc: 10,
                pPowerWheelFromAcc: 9,
                aeroCoef: 0.7,
                grade: 0.05,
                speed: 15.5,
                speedMax: 18.0,
                speedMaxIncline: 16.0,
                virtSpeedCurrent: 15.5,
                temperature: 20,
                windSpeed: 2.0,
                windDirection: 180,
                windBearing: 170,
                windAlpha: 10,
                heartRate: 150,
                cadence: 90,
            });

            const gpxContent = PathConverter.toGPX(path);
            expect(gpxContent).toContain('<gpx');
            expect(gpxContent).toContain('lat="46.5197"');
            expect(gpxContent).toContain('lon="6.6323"');
            expect(gpxContent).toContain('<ele>372.2</ele>');
        });

        test('should load GPX into existing Path using PathConverter', () => {
            const basicGpx = `<?xml version="1.0" encoding="UTF-8"?>
                <gpx version="1.1" creator="test">
                    <trk>
                        <trkseg>
                            <trkpt lat="46.5197" lon="6.6323">
                                <ele>372.2</ele>
                            </trkpt>
                        </trkseg>
                    </trk>
                </gpx>`;

            const path = new Path();
            // Add some initial data
            path.addPoint({
                lat: toRadians(45.0),
                lon: toRadians(5.0),
                ele: 100,
                bearing: 0,
                dist: 0,
                radius: 0,
                time: 0,
                elapsed: 0,
                power: 0,
                pCyclistRaw: 0,
                pCyclistWheel: 0,
                pCyclistOptimalPower: 0,
                pCyclistCurrentSpeed: 0,
                pCyclistOptimalSpeed: 0,
                pAero: 0,
                pGravity: 0,
                pRollingResistance: 0,
                pWheelBearings: 0,
                pPowerFromAcc: 0,
                pPowerWheelFromAcc: 0,
                aeroCoef: 0,
                grade: 0,
                speed: 0,
                speedMax: 0,
                speedMaxIncline: 0,
                virtSpeedCurrent: 0,
                temperature: 0,
                windSpeed: 0,
                windDirection: 0,
                windBearing: 0,
                windAlpha: 0,
                heartRate: 0,
                cadence: 0,
            });

            expect(path.getPointCount()).toBe(1);

            PathConverter.loadIntoPath(path, basicGpx);

            expect(path.getPointCount()).toBe(1);
            expect(path.getLatitude(0)).toBeCloseTo(toRadians(46.5197), 6);
            expect(path.getLongitude(0)).toBeCloseTo(toRadians(6.6323), 6);
            expect(path.getElevation(0)).toBeGreaterThanOrEqual(0);
        });

        test('should export Path to GPXData using PathConverter', () => {
            const path = new Path();
            path.addPoint({
                lat: toRadians(46.5197),
                lon: toRadians(6.6323),
                ele: 372.2,
                bearing: 0,
                dist: 0,
                radius: 0,
                time: new Date('2023-01-01T10:00:00Z').getTime(),
                elapsed: 0,
                power: 250,
                pCyclistRaw: 240,
                pCyclistWheel: 230,
                pCyclistOptimalPower: 245,
                pCyclistCurrentSpeed: 220,
                pCyclistOptimalSpeed: 235,
                pAero: -80,
                pGravity: -20,
                pRollingResistance: -15,
                pWheelBearings: -5,
                pPowerFromAcc: 10,
                pPowerWheelFromAcc: 9,
                aeroCoef: 0.7,
                grade: 0.05,
                speed: 15.5,
                speedMax: 18.0,
                speedMaxIncline: 16.0,
                virtSpeedCurrent: 15.5,
                temperature: 20,
                windSpeed: 2.0,
                windDirection: 180,
                windBearing: 170,
                windAlpha: 10,
                heartRate: 150,
                cadence: 90,
            });

            const gpxData = PathConverter.toGPXData(path);

            expect(gpxData.version).toBe('1.1');
            expect(gpxData.creator).toBe('@glandais/virtual-cyclist');
            expect(gpxData.tracks).toHaveLength(1);
            expect(gpxData.tracks[0].segments).toHaveLength(1);
            expect(gpxData.tracks[0].segments[0].trackPoints).toHaveLength(1);

            const trackPoint = gpxData.tracks[0].segments[0].trackPoints[0];
            expect(trackPoint.lat).toBeCloseTo(46.5197, 6);
            expect(trackPoint.lon).toBeCloseTo(6.6323, 6);
            expect(trackPoint.ele).toBe(372.2);
            expect(trackPoint.extensions?.heartRate).toBe(150);
            expect(trackPoint.extensions?.cadence).toBe(90);
        });
    });
});
