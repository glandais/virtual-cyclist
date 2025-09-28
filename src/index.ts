// Type exports
export type { Point, Cyclist as ICyclist, Bike as IBike } from './types';
export { PointField, FIELDS_PER_POINT } from './types';

// Class exports
export { Path } from './Path';
export { Cyclist } from './Cyclist';
export { Bike } from './Bike';

export { Elevation } from './elevation';

// Constants exports
export * from './constants';

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
