import { KNOWN_NAMESPACES, NAMESPACE_PREFIXES } from './types';
import { Path } from '../Path';
import { Paths, Point } from '../types';
import { toDegrees } from '../constants';

/**
 * Writer for GPX files with namespace-aware extension generation.
 *
 * Converts Path objects to properly formatted GPX XML with support
 * for various extension formats and namespace declarations.
 */
export class GPXWriter {
    /**
     * Convert Path object to GPX XML string
     */
    writeFromPath(path: Path): string {
        return this.write({ name: path.name, tracks: [path] });
    }

    /**
     * Convert GPXData to GPX XML string
     */
    write(gpxData: Paths): string {
        const doc = this.createDocument();
        const gpxElement = this.createGPXElement(doc);

        const metadataElement = this.createMetadataElement(doc, gpxData);
        gpxElement.appendChild(metadataElement);

        // Add tracks
        for (const track of gpxData.tracks) {
            const trackElement = this.createTrackElement(doc, track);
            gpxElement.appendChild(trackElement);
        }

        doc.appendChild(gpxElement);

        // Serialize to string
        const serializer = new XMLSerializer();
        let xmlString = serializer.serializeToString(doc);

        // Add XML declaration if not present
        if (!xmlString.startsWith('<?xml')) {
            xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
        }

        // Pretty print if requested
        xmlString = this.formatXML(xmlString);

        return xmlString;
    }

    /**
     * Create XML document
     */
    private createDocument(): Document {
        const implementation = document.implementation;
        return implementation.createDocument('', '', null);
    }

    /**
     * Create GPX root element with proper namespaces
     */
    private createGPXElement(doc: Document): Element {
        const gpxElement = doc.createElement('gpx');

        // Set GPX attributes
        gpxElement.setAttribute('version', '1.1');
        gpxElement.setAttribute('creator', '@glandais/virtual-cyclist');

        // Add namespace declarations
        gpxElement.setAttribute('xmlns', KNOWN_NAMESPACES.GPX);
        gpxElement.setAttribute('xmlns:xsi', KNOWN_NAMESPACES.W3C_XSI);

        // Add extension namespaces if needed
        gpxElement.setAttribute(
            `xmlns:${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}`,
            KNOWN_NAMESPACES.GARMIN_TPX
        );

        // Add schema location
        gpxElement.setAttribute(
            'xsi:schemaLocation',
            `${KNOWN_NAMESPACES.GPX} http://www.topografix.com/GPX/1/1/gpx.xsd`
        );

        return gpxElement;
    }

    /**
     * Create metadata element
     */
    private createMetadataElement(doc: Document, gpxData: Paths): Element {
        const metadataElement = doc.createElement('metadata');

        if (gpxData.name) {
            const nameElement = doc.createElement('name');
            nameElement.textContent = gpxData.name;
            metadataElement.appendChild(nameElement);
        }

        return metadataElement;
    }

    /**
     * Create track element
     */
    private createTrackElement(doc: Document, track: Path): Element {
        const trackElement = doc.createElement('trk');

        if (track.name) {
            const nameElement = doc.createElement('name');
            nameElement.textContent = track.name;
            trackElement.appendChild(nameElement);
        }

        const segmentElement = doc.createElement('trkseg');
        for (const trackPoint of track) {
            const trackPointElement = this.createTrackPointElement(doc, trackPoint);
            segmentElement.appendChild(trackPointElement);
        }
        trackElement.appendChild(segmentElement);

        return trackElement;
    }

    /**
     * Create track point element with extensions
     */
    private createTrackPointElement(doc: Document, trackPoint: Point): Element {
        const trackPointElement = doc.createElement('trkpt');

        trackPointElement.setAttribute('lat', toDegrees(trackPoint.lat).toString());
        trackPointElement.setAttribute('lon', toDegrees(trackPoint.lon).toString());

        if (!isNaN(trackPoint.ele)) {
            const eleElement = doc.createElement('ele');
            eleElement.textContent = trackPoint.ele.toString();
            trackPointElement.appendChild(eleElement);
        }

        if (!isNaN(trackPoint.time)) {
            const timeElement = doc.createElement('time');
            timeElement.textContent = new Date(trackPoint.time).toISOString();
            trackPointElement.appendChild(timeElement);
        }

        // Add extensions if present
        const extensionsElement = this.createExtensionsElement(doc, trackPoint);

        if (extensionsElement.hasChildNodes()) {
            trackPointElement.appendChild(extensionsElement);
        }

        return trackPointElement;
    }

    /**
     * Create extensions element with proper namespace handling
     */
    private createExtensionsElement(doc: Document, trackPoint: Point): Element {
        const extensionsElement = doc.createElement('extensions');

        // Create Garmin TrackPointExtension
        const tpxElement = doc.createElement(
            `${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}:TrackPointExtension`
        );

        if (!isNaN(trackPoint.heartRate)) {
            const hrElement = doc.createElement(
                `${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}:hr`
            );
            hrElement.textContent = Math.round(trackPoint.heartRate).toString();
            tpxElement.appendChild(hrElement);
        }

        if (!isNaN(trackPoint.cadence)) {
            const cadElement = doc.createElement(
                `${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}:cad`
            );
            cadElement.textContent = Math.round(trackPoint.cadence).toString();
            tpxElement.appendChild(cadElement);
        }

        if (!isNaN(trackPoint.temperature)) {
            const atempElement = doc.createElement(
                `${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}:atemp`
            );
            atempElement.textContent = trackPoint.temperature.toString();
            tpxElement.appendChild(atempElement);
        }

        if (tpxElement.hasChildNodes()) {
            extensionsElement.appendChild(tpxElement);
        }

        // Add custom power extensions if enabled
        if (!isNaN(trackPoint.power)) {
            const powerElement = doc.createElement('power');
            powerElement.textContent = Math.round(trackPoint.power).toString();
            extensionsElement.appendChild(powerElement);
        }

        return extensionsElement;
    }

    /**
     * Format XML with indentation (basic implementation)
     */
    private formatXML(xml: string): string {
        const formatted: string[] = [];
        const regex = /(>)(<)(\/*)(?=\w)/g;
        xml = xml.replace(regex, '$1\n$2$3');

        let pad = 0;
        const lines = xml.split('\n');

        for (const line of lines) {
            let indent = 0;
            if (line.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (line.match(/^<\/\w/)) {
                if (pad !== 0) {
                    pad -= 1;
                }
            } else if (line.match(/^<\w[^>]*[^/]>.*$/)) {
                indent = 1;
            } else {
                indent = 0;
            }

            formatted.push('  '.repeat(pad) + line);
            pad += indent;
        }

        return formatted.join('\n');
    }

    /**
     * Static method to quickly write GPX from Path
     */
    static writeFromPath(path: Path): string {
        const writer = new GPXWriter();
        return writer.writeFromPath(path);
    }

    /**
     * Static method to quickly write GPX data
     */
    static write(gpxData: Paths): string {
        const writer = new GPXWriter();
        return writer.write(gpxData);
    }
}
