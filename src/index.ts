// Type exports
export type { Point } from './types';
export { PointField, FIELDS_PER_POINT } from './types';

// Class exports
export { Path } from './Path';

// GPX exports
export { GPXParser } from './gpx/GPXParser';
export { GPXWriter } from './gpx/GPXWriter';
export type {
    GPXData,
    GPXTrack,
    GPXTrackSegment,
    GPXTrackPoint,
    GPXExtensions,
    GPXMetadata,
    GPXWriteOptions,
} from './gpx/types';
export { KNOWN_NAMESPACES, NAMESPACE_PREFIXES } from './gpx/types';
