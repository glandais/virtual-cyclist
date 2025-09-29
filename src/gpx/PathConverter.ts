import { Path } from '../Path';
import { Point } from '../types';
import { toDegrees } from '../constants';
import { GPXParser } from './GPXParser';
import { GPXWriter } from './GPXWriter';
import { GPXData, GPXWriteOptions } from './types';

/**
 * Utility class for converting between Path and GPX formats.
 * Moved from Path.ts to follow separation of concerns.
 */
export class PathConverter {
    /**
     * Create a Path from GPX file content.
     * @param gpxContent GPX XML content as string
     * @returns New Path instance with data from the first track
     */
    static fromGPX(gpxContent: string): Path {
        const parser = new GPXParser();
        const gpxData = parser.parse(gpxContent);

        const path = new Path();

        // Process first track if available
        if (gpxData.tracks.length === 0) {
            throw new Error('No tracks found in GPX file');
        }

        const track = gpxData.tracks[0];
        if (track.segments.length === 0) {
            throw new Error('No segments found in GPX track');
        }

        // Process all segments
        for (const segment of track.segments) {
            for (const trackPoint of segment.trackPoints) {
                const point: Point = {
                    // Required coordinates
                    lat: trackPoint.lat,
                    lon: trackPoint.lon,
                    ele: trackPoint.ele ?? 0,

                    // Navigation
                    bearing: trackPoint.extensions?.bearing ?? 0,
                    dist: trackPoint.extensions?.distance ?? 0,
                    radius: 0,

                    // Time
                    time: trackPoint.time?.getTime() ?? 0,
                    elapsed: 0,

                    // Physics & Power (zeros for GPX import)
                    power: trackPoint.extensions?.power ?? 0,
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

                    // Speed
                    speed: trackPoint.extensions?.speed ?? 0,
                    speedMax: 0,
                    speedMaxIncline: 0,
                    virtSpeedCurrent: 0,

                    // Environment
                    temperature: trackPoint.extensions?.temperature ?? 0,
                    windSpeed: 0,
                    windDirection: 0,
                    windBearing: 0,
                    windAlpha: 0,

                    // Physiology
                    heartRate: trackPoint.extensions?.heartRate ?? 0,
                    cadence: trackPoint.extensions?.cadence ?? 0,
                };

                path.addPoint(point);
            }
        }

        return path;
    }

    /**
     * Export a Path to GPX XML format.
     * @param path Path instance to export
     * @param options GPX write options
     * @returns GPX XML string
     */
    static toGPX(path: Path, options?: GPXWriteOptions): string {
        const writer = new GPXWriter(options);
        return writer.writeFromPath(path);
    }

    /**
     * Load GPX content into an existing Path instance (clears existing data).
     * @param path Path instance to load into
     * @param gpxContent GPX XML content as string
     */
    static loadIntoPath(path: Path, gpxContent: string): void {
        path.clear();
        const tempPath = PathConverter.fromGPX(gpxContent);

        // Copy all points from temp path
        for (let i = 0; i < tempPath.getPointCount(); i++) {
            path.addPoint(tempPath.getPointData(i));
        }
    }

    /**
     * Export a Path to GPXData structure for advanced customization.
     * @param path Path instance to export
     * @returns GPXData object
     */
    static toGPXData(path: Path): GPXData {
        const gpxData: GPXData = {
            version: '1.1',
            creator: '@glandais/virtual-cyclist',
            tracks: [
                {
                    name: 'Virtual Cyclist Track',
                    type: 'cycling',
                    segments: [
                        {
                            trackPoints: [],
                        },
                    ],
                },
            ],
        };

        const segment = gpxData.tracks[0].segments[0];

        for (let i = 0; i < path.getPointCount(); i++) {
            const point = path.getPointData(i);

            segment.trackPoints.push({
                lat: toDegrees(point.lat),
                lon: toDegrees(point.lon),
                ele: point.ele !== 0 ? point.ele : undefined,
                time: point.time !== 0 ? new Date(point.time) : undefined,
                extensions: {
                    heartRate: point.heartRate !== 0 ? point.heartRate : undefined,
                    cadence: point.cadence !== 0 ? point.cadence : undefined,
                    temperature: point.temperature !== 0 ? point.temperature : undefined,
                    power: point.power !== 0 ? point.power : undefined,
                    speed: point.speed !== 0 ? point.speed : undefined,
                },
            });
        }

        return gpxData;
    }
}
