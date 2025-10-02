/**
 * GPX-specific type definitions for parsing and writing GPX files.
 *
 * These interfaces represent the structure of GPX data before conversion
 * to the internal Path format, allowing preservation of GPX-specific
 * metadata and extensions.
 */

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
