import { GPXData, GPXTrack, GPXTrackSegment, GPXTrackPoint, GPXMetadata } from './types';
import { NamespaceResolver } from './NamespaceResolver';
import { ExtensionParser } from './ExtensionParser';
import { toRadians } from '../constants';

/**
 * Parser for GPX files with comprehensive namespace and extension support.
 *
 * Handles GPX files from various GPS manufacturers and applications,
 * parsing track data, metadata, and device-specific extensions into
 * a standardized format.
 */
export class GPXParser {
    private namespaceResolver!: NamespaceResolver;
    private extensionParser!: ExtensionParser;

    /**
     * Parse GPX XML content into structured data
     */
    parse(gpxContent: string): GPXData {
        // Parse XML content
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');

        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error(`XML parsing error: ${parserError.textContent}`);
        }

        // Initialize namespace handling
        this.namespaceResolver = new NamespaceResolver(xmlDoc);
        this.extensionParser = new ExtensionParser(this.namespaceResolver);

        // Get GPX root element
        const gpxElement = xmlDoc.documentElement;
        if (!gpxElement || gpxElement.tagName !== 'gpx') {
            throw new Error('Invalid GPX file: missing gpx root element');
        }

        // Parse GPX data
        const gpxData: GPXData = {
            version: gpxElement.getAttribute('version') || undefined,
            creator: gpxElement.getAttribute('creator') || undefined,
            tracks: [],
        };

        // Parse metadata if present
        const metadataElement = gpxElement.querySelector('metadata');
        if (metadataElement) {
            gpxData.metadata = this.parseMetadata(metadataElement);
        }

        // Parse all track elements
        const trackElements = gpxElement.querySelectorAll('trk');
        for (let i = 0; i < trackElements.length; i++) {
            const track = this.parseTrack(trackElements[i]);
            gpxData.tracks.push(track);
        }

        return gpxData;
    }

    /**
     * Parse GPX metadata element
     */
    private parseMetadata(metadataElement: Element): GPXMetadata {
        const metadata: GPXMetadata = {};

        // Parse basic metadata fields
        const nameElement = metadataElement.querySelector('name');
        if (nameElement?.textContent) {
            metadata.name = nameElement.textContent.trim();
        }

        const descElement = metadataElement.querySelector('desc');
        if (descElement?.textContent) {
            metadata.desc = descElement.textContent.trim();
        }

        const timeElement = metadataElement.querySelector('time');
        if (timeElement?.textContent) {
            metadata.time = new Date(timeElement.textContent.trim());
        }

        // Parse author information
        const authorElement = metadataElement.querySelector('author');
        if (authorElement) {
            metadata.author = {};

            const authorNameElement = authorElement.querySelector('name');
            if (authorNameElement?.textContent) {
                metadata.author.name = authorNameElement.textContent.trim();
            }

            const emailElement = authorElement.querySelector('email');
            if (emailElement) {
                const id = emailElement.getAttribute('id');
                const domain = emailElement.getAttribute('domain');
                if (id && domain) {
                    metadata.author.email = `${id}@${domain}`;
                }
            }

            const linkElement = authorElement.querySelector('link');
            if (linkElement) {
                const href = linkElement.getAttribute('href');
                if (href) {
                    metadata.author.link = href;
                }
            }
        }

        // Parse link information
        const linkElement = metadataElement.querySelector('link');
        if (linkElement) {
            const href = linkElement.getAttribute('href');
            if (href) {
                metadata.link = { href };

                const textElement = linkElement.querySelector('text');
                if (textElement?.textContent) {
                    metadata.link.text = textElement.textContent.trim();
                }
            }
        }

        return metadata;
    }

    /**
     * Parse a GPX track element
     */
    private parseTrack(trackElement: Element): GPXTrack {
        const track: GPXTrack = {
            segments: [],
        };

        // Parse track metadata
        const nameElement = trackElement.querySelector('name');
        if (nameElement?.textContent) {
            track.name = nameElement.textContent.trim();
        }

        const typeElement = trackElement.querySelector('type');
        if (typeElement?.textContent) {
            track.type = typeElement.textContent.trim();
        }

        const numberElement = trackElement.querySelector('number');
        if (numberElement?.textContent) {
            const number = parseInt(numberElement.textContent.trim(), 10);
            if (!isNaN(number)) {
                track.number = number;
            }
        }

        const descElement = trackElement.querySelector('desc');
        if (descElement?.textContent) {
            track.desc = descElement.textContent.trim();
        }

        // Parse track segments
        const segmentElements = trackElement.querySelectorAll('trkseg');
        for (let i = 0; i < segmentElements.length; i++) {
            const segment = this.parseTrackSegment(segmentElements[i]);
            track.segments.push(segment);
        }

        return track;
    }

    /**
     * Parse a GPX track segment element
     */
    private parseTrackSegment(segmentElement: Element): GPXTrackSegment {
        const segment: GPXTrackSegment = {
            trackPoints: [],
        };

        // Parse track points
        const trackPointElements = segmentElement.querySelectorAll('trkpt');
        for (let i = 0; i < trackPointElements.length; i++) {
            const trackPoint = this.parseTrackPoint(trackPointElements[i]);
            segment.trackPoints.push(trackPoint);
        }

        return segment;
    }

    /**
     * Parse a GPX track point element
     */
    private parseTrackPoint(trackPointElement: Element): GPXTrackPoint {
        // Get required latitude and longitude
        const latStr = trackPointElement.getAttribute('lat');
        const lonStr = trackPointElement.getAttribute('lon');

        if (!latStr || !lonStr) {
            throw new Error('Invalid track point: missing lat or lon attribute');
        }

        const latDegrees = parseFloat(latStr);
        const lonDegrees = parseFloat(lonStr);

        if (isNaN(latDegrees) || isNaN(lonDegrees)) {
            throw new Error('Invalid track point: lat or lon is not a valid number');
        }

        // Convert degrees to radians for internal storage
        const lat = toRadians(latDegrees);
        const lon = toRadians(lonDegrees);

        const trackPoint: GPXTrackPoint = { lat, lon };

        // Parse elevation
        const eleElement = trackPointElement.querySelector('ele');
        if (eleElement?.textContent) {
            const ele = parseFloat(eleElement.textContent.trim());
            if (!isNaN(ele)) {
                trackPoint.ele = ele;
            }
        }

        // Parse time
        const timeElement = trackPointElement.querySelector('time');
        if (timeElement?.textContent) {
            try {
                trackPoint.time = new Date(timeElement.textContent.trim());
            } catch {
                // Invalid time format, skip
            }
        }

        // Parse extensions
        const extensionsElement = trackPointElement.querySelector('extensions');
        if (extensionsElement) {
            trackPoint.extensions = this.extensionParser.parseExtensions(extensionsElement);
        }

        return trackPoint;
    }

    /**
     * Static method to quickly parse GPX content
     */
    static parse(gpxContent: string): GPXData {
        const parser = new GPXParser();
        return parser.parse(gpxContent);
    }
}
