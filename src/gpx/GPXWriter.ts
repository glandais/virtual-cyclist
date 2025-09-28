import { GPXData, GPXWriteOptions, KNOWN_NAMESPACES, NAMESPACE_PREFIXES } from './types';
import { Path } from '../Path';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Writer for GPX files with namespace-aware extension generation.
 *
 * Converts Path objects to properly formatted GPX XML with support
 * for various extension formats and namespace declarations.
 */
export class GPXWriter {
    private options: Required<GPXWriteOptions>;

    constructor(options: GPXWriteOptions = {}) {
        this.options = {
            trackName: options.trackName || 'Virtual Cyclist Track',
            trackType: options.trackType || 'cycling',
            creator: options.creator || '@glandais/virtual-cyclist',
            includeExtensions: options.includeExtensions ?? true,
            includeHeartRate: options.includeHeartRate ?? true,
            includeCadence: options.includeCadence ?? true,
            includePower: options.includePower ?? true,
            includeTemperature: options.includeTemperature ?? true,
            prettyPrint: options.prettyPrint ?? false,
            useGarminExtensions: options.useGarminExtensions ?? true,
            usePowerExtensions: options.usePowerExtensions ?? true,
        };
    }

    /**
     * Convert Path object to GPX XML string
     */
    writeFromPath(path: Path): string {
        // Convert Path to GPXData
        const gpxData = this.pathToGPXData(path);
        return this.write(gpxData);
    }

    /**
     * Convert GPXData to GPX XML string
     */
    write(gpxData: GPXData): string {
        const doc = this.createDocument();
        const gpxElement = this.createGPXElement(doc, gpxData);

        // Add metadata if present
        if (gpxData.metadata) {
            const metadataElement = this.createMetadataElement(doc, gpxData.metadata);
            gpxElement.appendChild(metadataElement);
        }

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
        if (this.options.prettyPrint) {
            xmlString = this.formatXML(xmlString);
        }

        return xmlString;
    }

    /**
     * Convert Path object to GPXData structure
     */
    private pathToGPXData(path: Path): GPXData {
        const gpxData: GPXData = {
            version: '1.1',
            creator: this.options.creator,
            tracks: [
                {
                    name: this.options.trackName,
                    type: this.options.trackType,
                    segments: [
                        {
                            trackPoints: [],
                        },
                    ],
                },
            ],
        };

        const segment = gpxData.tracks[0].segments[0];
        const pointCount = path.getPointCount();

        for (let i = 0; i < pointCount; i++) {
            const point = path.getPointData(i);

            const trackPoint: any = {
                lat: point.lat,
                lon: point.lon,
            };

            // Add elevation if available
            if (point.ele !== undefined) {
                trackPoint.ele = point.ele;
            }

            // Add time if available
            if (point.time !== undefined) {
                trackPoint.time = new Date(point.time);
            }

            // Add extensions if enabled and data is available
            if (this.options.includeExtensions) {
                const extensions: any = {};
                let hasExtensions = false;

                if (this.options.includeHeartRate && point.heartRate !== undefined) {
                    extensions.heartRate = point.heartRate;
                    hasExtensions = true;
                }

                if (this.options.includeCadence && point.cadence !== undefined) {
                    extensions.cadence = point.cadence;
                    hasExtensions = true;
                }

                if (this.options.includeTemperature && point.temperature !== undefined) {
                    extensions.temperature = point.temperature;
                    hasExtensions = true;
                }

                if (this.options.includePower && point.power !== undefined) {
                    extensions.power = point.power;
                    hasExtensions = true;
                }

                if (point.speed !== undefined) {
                    extensions.speed = point.speed;
                    hasExtensions = true;
                }

                if (hasExtensions) {
                    trackPoint.extensions = extensions;
                }
            }

            segment.trackPoints.push(trackPoint);
        }

        return gpxData;
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
    private createGPXElement(doc: Document, gpxData: GPXData): Element {
        const gpxElement = doc.createElement('gpx');

        // Set GPX attributes
        gpxElement.setAttribute('version', gpxData.version || '1.1');
        gpxElement.setAttribute('creator', gpxData.creator || this.options.creator);

        // Add namespace declarations
        gpxElement.setAttribute('xmlns', KNOWN_NAMESPACES.GPX);
        gpxElement.setAttribute('xmlns:xsi', KNOWN_NAMESPACES.W3C_XSI);

        // Add extension namespaces if needed
        if (this.options.includeExtensions) {
            if (this.options.useGarminExtensions) {
                gpxElement.setAttribute(
                    `xmlns:${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}`,
                    KNOWN_NAMESPACES.GARMIN_TPX
                );
            }

            if (this.options.usePowerExtensions) {
                // Power extensions use non-namespaced elements
            }

            // Add schema location
            gpxElement.setAttribute(
                'xsi:schemaLocation',
                `${KNOWN_NAMESPACES.GPX} http://www.topografix.com/GPX/1/1/gpx.xsd`
            );
        }

        return gpxElement;
    }

    /**
     * Create metadata element
     */
    private createMetadataElement(doc: Document, metadata: any): Element {
        const metadataElement = doc.createElement('metadata');

        if (metadata.name) {
            const nameElement = doc.createElement('name');
            nameElement.textContent = metadata.name;
            metadataElement.appendChild(nameElement);
        }

        if (metadata.desc) {
            const descElement = doc.createElement('desc');
            descElement.textContent = metadata.desc;
            metadataElement.appendChild(descElement);
        }

        if (metadata.time) {
            const timeElement = doc.createElement('time');
            timeElement.textContent = metadata.time.toISOString();
            metadataElement.appendChild(timeElement);
        }

        if (metadata.author) {
            const authorElement = doc.createElement('author');

            if (metadata.author.name) {
                const nameElement = doc.createElement('name');
                nameElement.textContent = metadata.author.name;
                authorElement.appendChild(nameElement);
            }

            if (metadata.author.email) {
                const emailElement = doc.createElement('email');
                const [id, domain] = metadata.author.email.split('@');
                emailElement.setAttribute('id', id);
                emailElement.setAttribute('domain', domain);
                authorElement.appendChild(emailElement);
            }

            if (metadata.author.link) {
                const linkElement = doc.createElement('link');
                linkElement.setAttribute('href', metadata.author.link);
                authorElement.appendChild(linkElement);
            }

            metadataElement.appendChild(authorElement);
        }

        if (metadata.link) {
            const linkElement = doc.createElement('link');
            linkElement.setAttribute('href', metadata.link.href);

            if (metadata.link.text) {
                const textElement = doc.createElement('text');
                textElement.textContent = metadata.link.text;
                linkElement.appendChild(textElement);
            }

            metadataElement.appendChild(linkElement);
        }

        return metadataElement;
    }

    /**
     * Create track element
     */
    private createTrackElement(doc: Document, track: any): Element {
        const trackElement = doc.createElement('trk');

        if (track.name) {
            const nameElement = doc.createElement('name');
            nameElement.textContent = track.name;
            trackElement.appendChild(nameElement);
        }

        if (track.type) {
            const typeElement = doc.createElement('type');
            typeElement.textContent = track.type;
            trackElement.appendChild(typeElement);
        }

        if (track.number !== undefined) {
            const numberElement = doc.createElement('number');
            numberElement.textContent = track.number.toString();
            trackElement.appendChild(numberElement);
        }

        if (track.desc) {
            const descElement = doc.createElement('desc');
            descElement.textContent = track.desc;
            trackElement.appendChild(descElement);
        }

        // Add track segments
        for (const segment of track.segments) {
            const segmentElement = this.createTrackSegmentElement(doc, segment);
            trackElement.appendChild(segmentElement);
        }

        return trackElement;
    }

    /**
     * Create track segment element
     */
    private createTrackSegmentElement(doc: Document, segment: any): Element {
        const segmentElement = doc.createElement('trkseg');

        for (const trackPoint of segment.trackPoints) {
            const trackPointElement = this.createTrackPointElement(doc, trackPoint);
            segmentElement.appendChild(trackPointElement);
        }

        return segmentElement;
    }

    /**
     * Create track point element with extensions
     */
    private createTrackPointElement(doc: Document, trackPoint: any): Element {
        const trackPointElement = doc.createElement('trkpt');

        trackPointElement.setAttribute('lat', trackPoint.lat.toString());
        trackPointElement.setAttribute('lon', trackPoint.lon.toString());

        if (trackPoint.ele !== undefined) {
            const eleElement = doc.createElement('ele');
            eleElement.textContent = trackPoint.ele.toString();
            trackPointElement.appendChild(eleElement);
        }

        if (trackPoint.time) {
            const timeElement = doc.createElement('time');
            timeElement.textContent = trackPoint.time.toISOString();
            trackPointElement.appendChild(timeElement);
        }

        // Add extensions if present
        if (trackPoint.extensions && this.options.includeExtensions) {
            const extensionsElement = this.createExtensionsElement(doc, trackPoint.extensions);
            trackPointElement.appendChild(extensionsElement);
        }

        return trackPointElement;
    }

    /**
     * Create extensions element with proper namespace handling
     */
    private createExtensionsElement(doc: Document, extensions: any): Element {
        const extensionsElement = doc.createElement('extensions');

        if (this.options.useGarminExtensions) {
            // Create Garmin TrackPointExtension
            const tpxElement = doc.createElement(
                `${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}:TrackPointExtension`
            );

            if (extensions.heartRate !== undefined) {
                const hrElement = doc.createElement(
                    `${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}:hr`
                );
                hrElement.textContent = Math.round(extensions.heartRate).toString();
                tpxElement.appendChild(hrElement);
            }

            if (extensions.cadence !== undefined) {
                const cadElement = doc.createElement(
                    `${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}:cad`
                );
                cadElement.textContent = Math.round(extensions.cadence).toString();
                tpxElement.appendChild(cadElement);
            }

            if (extensions.temperature !== undefined) {
                const atempElement = doc.createElement(
                    `${NAMESPACE_PREFIXES[KNOWN_NAMESPACES.GARMIN_TPX]}:atemp`
                );
                atempElement.textContent = extensions.temperature.toString();
                tpxElement.appendChild(atempElement);
            }

            if (tpxElement.hasChildNodes()) {
                extensionsElement.appendChild(tpxElement);
            }
        }

        // Add custom power extensions if enabled
        if (this.options.usePowerExtensions && extensions.power !== undefined) {
            const powerElement = doc.createElement('power');
            powerElement.textContent = Math.round(extensions.power).toString();
            extensionsElement.appendChild(powerElement);
        }

        // Add speed if present (non-namespaced)
        if (extensions.speed !== undefined) {
            const speedElement = doc.createElement('speed');
            speedElement.textContent = extensions.speed.toString();
            extensionsElement.appendChild(speedElement);
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
    static writeFromPath(path: Path, options?: GPXWriteOptions): string {
        const writer = new GPXWriter(options);
        return writer.writeFromPath(path);
    }

    /**
     * Static method to quickly write GPX data
     */
    static write(gpxData: GPXData, options?: GPXWriteOptions): string {
        const writer = new GPXWriter(options);
        return writer.write(gpxData);
    }
}
