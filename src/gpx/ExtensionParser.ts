import { GPXExtensions, KNOWN_NAMESPACES, EXTENSION_FIELD_MAPPINGS } from './types';
import { NamespaceResolver } from './NamespaceResolver';

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
    parseExtensions(extensionsElement: Element): GPXExtensions {
        const extensions: GPXExtensions = {};

        // Parse known extension types
        this.parseHeartRate(extensionsElement, extensions);
        this.parseCadence(extensionsElement, extensions);
        this.parseTemperature(extensionsElement, extensions);
        this.parsePower(extensionsElement, extensions);
        this.parseSpeed(extensionsElement, extensions);
        this.parseDistance(extensionsElement, extensions);
        this.parseSeaLevelPressure(extensionsElement, extensions);
        this.parseVerticalSpeed(extensionsElement, extensions);

        // Parse any unknown extensions for preservation
        this.parseRawExtensions(extensionsElement, extensions);

        return extensions;
    }

    /**
     * Parse heart rate from various formats:
     * - ns3:hr / gpxtpx:hr (Garmin)
     * - heartrate (Amazfit)
     * - hr (generic)
     */
    private parseHeartRate(parent: Element, extensions: GPXExtensions): void {
        const value = this.findExtensionValue('heartRate', parent);
        if (value !== null) {
            extensions.heartRate = Math.round(value);
        }
    }

    /**
     * Parse cadence from various formats:
     * - ns3:cad / gpxtpx:cad (Garmin)
     * - gpxdata:cadence (Cluetrust/Movescount)
     * - cadence (generic)
     */
    private parseCadence(parent: Element, extensions: GPXExtensions): void {
        const value = this.findExtensionValue('cadence', parent);
        if (value !== null) {
            extensions.cadence = Math.round(value);
        }
    }

    /**
     * Parse temperature from various formats:
     * - gpxtpx:atemp (Garmin ambient temperature)
     * - gpxdata:temp (Cluetrust)
     * - temperature (generic)
     */
    private parseTemperature(parent: Element, extensions: GPXExtensions): void {
        const value = this.findExtensionValue('temperature', parent);
        if (value !== null) {
            extensions.temperature = value;
        }
    }

    /**
     * Parse power from custom power extensions
     * - power (custom format used in sample.gpx)
     */
    private parsePower(parent: Element, extensions: GPXExtensions): void {
        const value = this.findExtensionValue('power', parent);
        if (value !== null) {
            extensions.power = Math.round(value);
        }
    }

    /**
     * Parse speed from Cluetrust extensions
     * - gpxdata:speed (Movescount)
     */
    private parseSpeed(parent: Element, extensions: GPXExtensions): void {
        const value = this.findExtensionValue('speed', parent);
        if (value !== null) {
            extensions.speed = value;
        }
    }

    /**
     * Parse cumulative distance from Cluetrust extensions
     * - gpxdata:distance (Movescount)
     */
    private parseDistance(parent: Element, extensions: GPXExtensions): void {
        const value = this.findExtensionValue('distance', parent);
        if (value !== null) {
            extensions.distance = value;
        }
    }

    /**
     * Parse sea level pressure from Cluetrust extensions
     * - gpxdata:seaLevelPressure (Movescount)
     */
    private parseSeaLevelPressure(parent: Element, extensions: GPXExtensions): void {
        const value = this.findExtensionValue('seaLevelPressure', parent);
        if (value !== null) {
            extensions.seaLevelPressure = value;
        }
    }

    /**
     * Parse vertical speed from Cluetrust extensions
     * - gpxdata:verticalSpeed (Movescount)
     */
    private parseVerticalSpeed(parent: Element, extensions: GPXExtensions): void {
        const value = this.findExtensionValue('verticalSpeed', parent);
        if (value !== null) {
            extensions.verticalSpeed = value;
        }
    }

    /**
     * Generic method to find extension values using the field mapping
     */
    private findExtensionValue(fieldName: string, parent: Element): number | null {
        const mappings = EXTENSION_FIELD_MAPPINGS[fieldName];
        if (!mappings) {
            return null;
        }

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
     * Parse any unrecognized extensions for preservation
     */
    private parseRawExtensions(parent: Element, extensions: GPXExtensions): void {
        const rawExtensions = new Map<string, string>();

        // Get all child elements
        const children = parent.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            // Skip known extension containers (like TrackPointExtension)
            if (this.isKnownExtensionContainer(child)) {
                continue;
            }

            // Skip already processed fields
            if (this.isKnownField(child)) {
                continue;
            }

            // Store unknown extensions
            const key = this.getElementKey(child);
            const value = child.textContent?.trim() || '';
            if (value) {
                rawExtensions.set(key, value);
            }
        }

        if (rawExtensions.size > 0) {
            extensions.rawExtensions = rawExtensions;
        }
    }

    /**
     * Check if an element is a known extension container (like TrackPointExtension)
     */
    private isKnownExtensionContainer(element: Element): boolean {
        const namespace = this.namespaceResolver.getElementNamespace(element);
        return (
            namespace === KNOWN_NAMESPACES.GARMIN_TPX ||
            namespace === KNOWN_NAMESPACES.GARMIN_GPX ||
            namespace === KNOWN_NAMESPACES.CLUETRUST
        );
    }

    /**
     * Check if an element represents a field we already processed
     */
    private isKnownField(element: Element): boolean {
        const tagName = element.tagName.toLowerCase();
        const localName = tagName.includes(':') ? tagName.split(':')[1] : tagName;

        // Check against all known field mappings
        for (const fieldMappings of Object.values(EXTENSION_FIELD_MAPPINGS)) {
            for (const mapping of fieldMappings) {
                if (mapping.localName.toLowerCase() === localName) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Generate a key for an unknown extension element
     */
    private getElementKey(element: Element): string {
        const namespace = this.namespaceResolver.getElementNamespace(element);
        const tagName = element.tagName;

        if (namespace && namespace !== KNOWN_NAMESPACES.GPX) {
            // Include namespace in key for namespaced elements
            const prefix = this.namespaceResolver.getPrefix(namespace);
            return prefix ? `${prefix}:${tagName}` : tagName;
        }

        return tagName;
    }

    /**
     * Utility method to parse nested Garmin TrackPointExtension elements
     * (currently not used but kept for future enhancement)
     */

    private parseGarminTrackPointExtension(parent: Element, extensions: GPXExtensions): void {
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
                extensions.heartRate = hr;
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
                extensions.cadence = cad;
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
                extensions.temperature = atemp;
            }
        }
    }
}
