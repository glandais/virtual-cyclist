import { muscularPowerProvider } from '@/physics/power/cyclist/';
import { CoursePhysics } from '@/types/course/';
import { Bike } from '@/types/models/';
import { Path, Point } from '@/types/path/';

describe('MuscularPowerProvider', () => {
    let path: Path;
    let bike: Bike;

    beforeEach(() => {
        bike = Bike.getDefault();
        path = new Path('test-path');
    });

    test('should apply drivetrain efficiency', () => {
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: Date.now(),
            distance: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        const course = {
            bike,
            cyclistPowerProvider: {
                getPowerW: () => 250, // 250W muscular power
            },
        } as unknown as CoursePhysics;

        const wheelPower = muscularPowerProvider.getPowerW(course, path, 0);

        // Wheel power = muscular power × efficiency
        // 250W × 0.976 = 244W
        expect(wheelPower).toBeCloseTo(244, 0);
    });

    test('should delegate to cyclist power provider', () => {
        path.addPoint({
            latitude: 45.0,
            longitude: 6.0,
            elevation: 1000,
            time: Date.now(),
            distance: 0,
            speed: 10,
            grade: 0,
            bearing: 0,
        } as Point);

        const mockProvider = {
            getPowerW: vi.fn(() => 300),
        };

        const course = {
            bike,
            cyclistPowerProvider: mockProvider,
        } as unknown as CoursePhysics;

        const wheelPower = muscularPowerProvider.getPowerW(course, path, 0);

        expect(mockProvider.getPowerW).toHaveBeenCalledWith(course, path, 0);
        expect(wheelPower).toBeCloseTo(292.8, 0); // 300 × 0.976
    });
});
