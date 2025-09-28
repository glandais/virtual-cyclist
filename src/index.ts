// Type exports
export type { Point } from './types';
export { PointField, FIELDS_PER_POINT } from './types';

// Class exports
export { Path } from './Path';

export { Elevation } from './elevation';

// GPX exports
export { GPXParser, GPXWriter } from './gpx';
export type {
    GPXData,
    GPXTrack,
    GPXTrackSegment,
    GPXTrackPoint,
    GPXExtensions,
    GPXMetadata,
    GPXWriteOptions,
} from './gpx/types';
