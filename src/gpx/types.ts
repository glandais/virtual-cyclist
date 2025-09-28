/**
 * GPX-specific type definitions for parsing and writing GPX files.
 *
 * These interfaces represent the structure of GPX data before conversion
 * to the internal Path format, allowing preservation of GPX-specific
 * metadata and extensions.
 */

/**
 * GPX metadata information
 */
export interface GPXMetadata {
    name?: string;
    author?: {
        name?: string;
        email?: string;
        link?: string;
    };
    time?: Date;
    link?: {
        href: string;
        text?: string;
    };
    desc?: string;
}

/**
 * GPX track point extensions parsed from various GPS devices
 */
export interface GPXExtensions {
    // Physiological data
    heartRate?: number; // Heart rate (bpm)
    cadence?: number; // Pedaling/running cadence (rpm/spm)

    // Environmental data
    temperature?: number; // Temperature (celsius)

    // Performance data
    power?: number; // Power output (watts)
    speed?: number; // Speed (m/s)

    // Navigation data
    distance?: number; // Cumulative distance (meters)
    bearing?: number; // Direction bearing (degrees)

    // Pressure and altitude
    seaLevelPressure?: number; // Sea level pressure (hPa)
    verticalSpeed?: number; // Vertical speed (m/s)

    // Raw extension data for unknown/custom fields
    rawExtensions?: Map<string, string>;
}

/**
 * A single GPX track point with coordinates, elevation, time, and extensions
 */
export interface GPXTrackPoint {
    lat: number; // Latitude (degrees)
    lon: number; // Longitude (degrees)
    ele?: number; // Elevation (meters)
    time?: Date; // Timestamp
    extensions?: GPXExtensions;
}

/**
 * A GPX track segment containing an array of track points
 */
export interface GPXTrackSegment {
    trackPoints: GPXTrackPoint[];
}

/**
 * A GPX track containing metadata and one or more track segments
 */
export interface GPXTrack {
    name?: string; // Track name
    type?: string; // Activity type (cycling, running, etc.)
    number?: number; // Track number
    desc?: string; // Track description
    segments: GPXTrackSegment[];
}

/**
 * Complete GPX document structure
 */
export interface GPXData {
    version?: string; // GPX version (typically "1.1")
    creator?: string; // Creating application
    metadata?: GPXMetadata;
    tracks: GPXTrack[];
}

/**
 * Options for writing GPX files
 */
export interface GPXWriteOptions {
    // Track metadata
    trackName?: string; // Name for the track
    trackType?: string; // Activity type (cycling, running, walking, etc.)
    creator?: string; // Creating application name

    // Extension handling
    includeExtensions?: boolean; // Whether to include extension data (default: true)
    includeHeartRate?: boolean; // Include heart rate data (default: true)
    includeCadence?: boolean; // Include cadence data (default: true)
    includePower?: boolean; // Include power data (default: true)
    includeTemperature?: boolean; // Include temperature data (default: true)

    // XML formatting
    prettyPrint?: boolean; // Format XML with indentation (default: false)

    // Namespace preferences
    useGarminExtensions?: boolean; // Use Garmin TrackPointExtension format (default: true)
    usePowerExtensions?: boolean; // Include custom power extensions (default: true)
}

/**
 * Known XML namespaces used in GPX files
 */
export const KNOWN_NAMESPACES = {
    GPX: 'http://www.topografix.com/GPX/1/1',
    GARMIN_TPX: 'http://www.garmin.com/xmlschemas/TrackPointExtension/v1',
    GARMIN_GPX: 'http://www.garmin.com/xmlschemas/GpxExtensions/v3',
    CLUETRUST: 'http://www.cluetrust.com/XML/GPXDATA/1/0',
    W3C_XSI: 'http://www.w3.org/2001/XMLSchema-instance',
} as const;

/**
 * Common namespace prefixes used by different GPS manufacturers
 */
export const NAMESPACE_PREFIXES = {
    [KNOWN_NAMESPACES.GPX]: '',
    [KNOWN_NAMESPACES.GARMIN_TPX]: 'gpxtpx',
    [KNOWN_NAMESPACES.GARMIN_GPX]: 'gpxx',
    [KNOWN_NAMESPACES.CLUETRUST]: 'gpxdata',
    [KNOWN_NAMESPACES.W3C_XSI]: 'xsi',
} as const;

/**
 * Mapping of extension field names to their namespace and local name
 */
export interface ExtensionFieldMapping {
    namespace: string;
    localName: string;
    dataType: 'number' | 'string' | 'boolean';
}

/**
 * Known extension field mappings for different GPS manufacturers
 */
export const EXTENSION_FIELD_MAPPINGS: Record<string, ExtensionFieldMapping[]> = {
    heartRate: [
        { namespace: KNOWN_NAMESPACES.GARMIN_TPX, localName: 'hr', dataType: 'number' },
        { namespace: '', localName: 'heartrate', dataType: 'number' },
        { namespace: '', localName: 'hr', dataType: 'number' },
    ],
    cadence: [
        { namespace: KNOWN_NAMESPACES.GARMIN_TPX, localName: 'cad', dataType: 'number' },
        { namespace: KNOWN_NAMESPACES.CLUETRUST, localName: 'cadence', dataType: 'number' },
        { namespace: '', localName: 'cadence', dataType: 'number' },
    ],
    temperature: [
        { namespace: KNOWN_NAMESPACES.GARMIN_TPX, localName: 'atemp', dataType: 'number' },
        { namespace: KNOWN_NAMESPACES.CLUETRUST, localName: 'temp', dataType: 'number' },
        { namespace: '', localName: 'temperature', dataType: 'number' },
    ],
    power: [{ namespace: '', localName: 'power', dataType: 'number' }],
    speed: [{ namespace: KNOWN_NAMESPACES.CLUETRUST, localName: 'speed', dataType: 'number' }],
    distance: [
        { namespace: KNOWN_NAMESPACES.CLUETRUST, localName: 'distance', dataType: 'number' },
    ],
    seaLevelPressure: [
        {
            namespace: KNOWN_NAMESPACES.CLUETRUST,
            localName: 'seaLevelPressure',
            dataType: 'number',
        },
    ],
    verticalSpeed: [
        { namespace: KNOWN_NAMESPACES.CLUETRUST, localName: 'verticalSpeed', dataType: 'number' },
    ],
};
