import { NamespaceResolver } from './NamespaceResolver';
import { EXTENSION_FIELD_MAPPINGS, KNOWN_NAMESPACES } from './types';
import { PointWritable } from '@/types/path/';

/**
 * Extension parser for GPX files with namespace awareness.
 *
 * Parses extension data from various GPS manufacturers and formats,
 * handling different namespace prefixes and element structures.
 */
export class ExtensionParser {
    constructor(private namespaceResolver: NamespaceResolver) {}

    /**
     * Parse all extensions from an extensions element
     */
    parseExtensions(extensionsElement: Element, trackPoint: PointWritable) {
        // Parse known extension types
        this.parseHeartRate(extensionsElement, trackPoint);
        this.parseCadence(extensionsElement, trackPoint);
        this.parseTemperature(extensionsElement, trackPoint);
        this.parsePower(extensionsElement, trackPoint);
        this.parseGarminTrackPointExtension(extensionsElement, trackPoint);
    }

    /**
     * Parse heart rate from various formats:
     * - ns3:hr / gpxtpx:hr (Garmin)
     * - heartrate (Amazfit)
     * - hr (generic)
     */
    private parseHeartRate(parent: Element, trackPoint: PointWritable): void {
        const value = this.findExtensionValue('heartRate', parent);
        if (value !== null) {
            trackPoint.heartRate = Math.round(value);
        }
    }

    /**
     * Parse cadence from various formats:
     * - ns3:cad / gpxtpx:cad (Garmin)
     * - gpxdata:cadence (Cluetrust/Movescount)
     * - cadence (generic)
     */
    private parseCadence(parent: Element, trackPoint: PointWritable): void {
        const value = this.findExtensionValue('cadence', parent);
        if (value !== null) {
            trackPoint.cadence = Math.round(value);
        }
    }

    /**
     * Parse temperature from various formats:
     * - gpxtpx:atemp (Garmin ambient temperature)
     * - gpxdata:temp (Cluetrust)
     * - temperature (generic)
     */
    private parseTemperature(parent: Element, trackPoint: PointWritable): void {
        const value = this.findExtensionValue('temperature', parent);
        if (value !== null) {
            trackPoint.temperature = value;
        }
    }

    /**
     * Parse power from custom power extensions
     * - power (custom format used in sample.gpx)
     */
    private parsePower(parent: Element, trackPoint: PointWritable): void {
        const value = this.findExtensionValue('power', parent);
        if (value !== null) {
            trackPoint.pInputPower = Math.round(value);
        }
    }

    /**
     * Generic method to find extension values using the field mapping
     */
    private findExtensionValue(
        fieldName: keyof typeof EXTENSION_FIELD_MAPPINGS,
        parent: Element
    ): number | null {
        const mappings = EXTENSION_FIELD_MAPPINGS[fieldName];

        // Try each mapping in order of preference
        for (const mapping of mappings) {
            let element: Element | null;

            if (mapping.namespace) {
                // Look for namespaced element
                element = this.namespaceResolver.findElementByNamespace(
                    parent,
                    mapping.localName,
                    mapping.namespace
                );
            } else {
                // Look for non-namespaced element
                element = parent.querySelector(mapping.localName);
            }

            if (element && element.textContent) {
                const value = parseFloat(element.textContent.trim());
                if (!isNaN(value)) {
                    return value;
                }
            }
        }

        return null;
    }

    /**
     * Utility method to parse nested Garmin TrackPointExtension elements
     * (currently not used but kept for future enhancement)
     */

    private parseGarminTrackPointExtension(parent: Element, trackPoint: PointWritable): void {
        // Find TrackPointExtension element in Garmin namespace
        const tpxElement = this.namespaceResolver.findElementByNamespace(
            parent,
            'TrackPointExtension',
            KNOWN_NAMESPACES.GARMIN_TPX
        );

        if (!tpxElement) {
            return;
        }

        // Parse heart rate
        const hrElement = this.namespaceResolver.findElementByNamespace(
            tpxElement,
            'hr',
            KNOWN_NAMESPACES.GARMIN_TPX
        );
        if (hrElement && hrElement.textContent) {
            const hr = parseInt(hrElement.textContent.trim(), 10);
            if (!isNaN(hr)) {
                trackPoint.heartRate = hr;
            }
        }

        // Parse cadence
        const cadElement = this.namespaceResolver.findElementByNamespace(
            tpxElement,
            'cad',
            KNOWN_NAMESPACES.GARMIN_TPX
        );
        if (cadElement && cadElement.textContent) {
            const cad = parseInt(cadElement.textContent.trim(), 10);
            if (!isNaN(cad)) {
                trackPoint.cadence = cad;
            }
        }

        // Parse ambient temperature
        const atempElement = this.namespaceResolver.findElementByNamespace(
            tpxElement,
            'atemp',
            KNOWN_NAMESPACES.GARMIN_TPX
        );
        if (atempElement && atempElement.textContent) {
            const atemp = parseFloat(atempElement.textContent.trim());
            if (!isNaN(atemp)) {
                trackPoint.temperature = atemp;
            }
        }
    }
}
