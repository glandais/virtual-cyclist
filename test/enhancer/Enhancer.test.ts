import { Enhancer } from '@/enhancer/';
import { GPXParser } from '@/gpx/';

describe('Enhancer', () => {
    const simpleGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt latitude="45.0" longitude="6.0"><elevation>1000</elevation><time>2024-01-01T00:00:00Z</time></trkpt>
      <trkpt latitude="45.001" longitude="6.0"><elevation>1005</elevation><time>2024-01-01T00:00:10Z</time></trkpt>
      <trkpt latitude="45.002" longitude="6.0"><elevation>1010</elevation><time>2024-01-01T00:00:20Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    test('should create course with defaults', () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getDefaultCourse(path);

        expect(course).toBeDefined();
        expect(course.path).toBe(path);
        expect(course.cyclist).toBeDefined();
        expect(course.bike).toBeDefined();
        expect(course.cyclistPowerProvider).toBeDefined();
        expect(course.aeroProvider).toBeDefined();
        expect(course.windProvider).toBeDefined();
    });

    test('should enhance path with full simulation', async () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const result = await Enhancer.enhanceCourseDefault(path);

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });

    test('should respect fixElevation option when disabled', async () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getDefaultCourse(path);
        const result = await Enhancer.enhanceCourse(course, { fixElevation: false });

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });

    test('should respect computeMaxSpeeds option when disabled', async () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getDefaultCourse(path);
        const result = await Enhancer.enhanceCourse(course, { computeMaxSpeeds: false });

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });

    test('should respect virtualizeTrack option when disabled', async () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getDefaultCourse(path);
        const result = await Enhancer.enhanceCourse(course, { virtualizeTrack: false });

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });

    test('should respect computeOnePointPerSecond option when disabled', async () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getDefaultCourse(path);
        const result = await Enhancer.enhanceCourse(course, {
            computeOnePointPerSecond: false,
        });

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });

    test('should respect simplifyPath.enable option when disabled', async () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getDefaultCourse(path);
        const result = await Enhancer.enhanceCourse(course, {
            simplifyPath: { enable: false },
        });

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });

    test('should use custom simplifyPath tolerance and zExaggeration', async () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getDefaultCourse(path);
        const result = await Enhancer.enhanceCourse(course, {
            simplifyPath: {
                enable: true,
                tolerance: 5,
                zExaggeration: 2,
            },
        });

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });

    test('should handle all options disabled', async () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getDefaultCourse(path);
        const result = await Enhancer.enhanceCourse(course, {
            fixElevation: false,
            computeMaxSpeeds: false,
            virtualizeTrack: false,
            computeOnePointPerSecond: false,
            simplifyPath: { enable: false },
        });

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });

    test('should handle partial options with defaults', async () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getDefaultCourse(path);
        const result = await Enhancer.enhanceCourse(course, {
            virtualizeTrack: false,
            simplifyPath: { tolerance: 15 },
        });

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });
});
