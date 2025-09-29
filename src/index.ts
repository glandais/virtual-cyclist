// Type exports
export type { Point, Cyclist as ICyclist, Bike as IBike, Course } from './types';
export { PointField, FIELDS_PER_POINT } from './types';

// Class exports
export { Path } from './Path';
export { Cyclist } from './Cyclist';
export { Bike } from './Bike';

// Utility exports
export { Vector3D } from './utils';

// Physics exports
export { MaxSpeedComputer } from './physics';
export type { MaxSpeedCourse } from './physics/MaxSpeedComputer';

export { Elevation } from './elevation';

// Constants exports
export * from './constants';

// GPX exports
export { GPXParser, GPXWriter } from './gpx';
