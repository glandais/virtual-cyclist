import { ExtensionParser } from './ExtensionParser';
import { NamespaceResolver } from './NamespaceResolver';
import { EMPTY_POINT, Path, Paths, Point, PointWritable } from '@/types/path/';
import { toRadians } from '@/utils/';

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
    parse(gpxContent: string): Paths {
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
        const gpxData: Paths = {
            name: 'noname',
            tracks: [],
        };

        // Parse metadata if present
        const metadataElement = gpxElement.querySelector('metadata');
        if (metadataElement) {
            // Parse basic metadata fields
            const nameElement = metadataElement.querySelector('name');
            if (nameElement?.textContent) {
                gpxData.name = nameElement.textContent.trim();
            }
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
     * Parse a GPX track element
     */
    private parseTrack(trackElement: Element): Path {
        const track: Path = new Path('noname');

        // Parse track metadata
        const nameElement = trackElement.querySelector('name');
        if (nameElement?.textContent) {
            track.name = nameElement.textContent.trim();
        }

        // Parse track segments
        const segmentElements = trackElement.querySelectorAll('trkseg');
        for (let i = 0; i < segmentElements.length; i++) {
            this.parseTrackSegment(track, segmentElements[i]);
        }
        track.computeDerivedData();
        return track;
    }

    /**
     * Parse a GPX track segment element
     */
    private parseTrackSegment(track: Path, segmentElement: Element) {
        // Parse track points
        const trackPointElements = segmentElement.querySelectorAll('trkpt');
        for (let i = 0; i < trackPointElements.length; i++) {
            const trackPoint = this.parseTrackPoint(trackPointElements[i]);
            track.addPoint(trackPoint);
        }
    }

    /**
     * Parse a GPX track point element
     */
    private parseTrackPoint(trackPointElement: Element): Point {
        const trackPoint: PointWritable = { ...EMPTY_POINT };

        // Get required latitude and longitude
        const latStr = trackPointElement.getAttribute('lat');
        const lonStr = trackPointElement.getAttribute('lon');

        if (!latStr || !lonStr) {
            throw new Error('Invalid track point: missing latitude or longitude attribute');
        }

        const latDegrees = parseFloat(latStr);
        const lonDegrees = parseFloat(lonStr);

        if (isNaN(latDegrees) || isNaN(lonDegrees)) {
            throw new Error('Invalid track point: latitude or longitude is not a valid number');
        }

        // Convert degrees to radians for internal storage
        trackPoint.latitude = toRadians(latDegrees);
        trackPoint.longitude = toRadians(lonDegrees);

        // Parse elevation
        const eleElement = trackPointElement.querySelector('ele');
        if (eleElement?.textContent) {
            const elevation = parseFloat(eleElement.textContent.trim());
            if (!isNaN(elevation)) {
                trackPoint.elevation = elevation;
            }
        }

        // Parse time
        const timeElement = trackPointElement.querySelector('time');
        if (timeElement?.textContent) {
            try {
                trackPoint.time = new Date(timeElement.textContent.trim()).getTime();
            } catch {
                // Invalid time format, skip
            }
        }

        // Parse extensions
        const extensionsElement = trackPointElement.querySelector('extensions');
        if (extensionsElement) {
            this.extensionParser.parseExtensions(extensionsElement, trackPoint);
        }

        return { ...trackPoint };
    }

    /**
     * Static method to quickly parse GPX content
     */
    static parse(gpxContent: string): Paths {
        const parser = new GPXParser();
        return parser.parse(gpxContent);
    }
}
