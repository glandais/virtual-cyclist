import { Enhancer } from '@/enhancer/';
import { GPXParser } from '@/gpx/';

describe('Enhancer', () => {
    const simpleGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="45.0" lon="6.0"><ele>1000</ele><time>2024-01-01T00:00:00Z</time></trkpt>
      <trkpt lat="45.001" lon="6.0"><ele>1005</ele><time>2024-01-01T00:00:10Z</time></trkpt>
      <trkpt lat="45.002" lon="6.0"><ele>1010</ele><time>2024-01-01T00:00:20Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    test('should create course with defaults', () => {
        const path = GPXParser.parse(simpleGPX).tracks[0];
        const course = Enhancer.getCourse(path);

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
        const result = await Enhancer.enhancePath(path);

        expect(result).toBeDefined();
        expect(result.getPointCount()).toBeGreaterThan(0);
    });
});
