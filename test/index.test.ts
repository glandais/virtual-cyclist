import * as VirtualCyclist from '../src/index';

describe('Package Exports', () => {
    test('should export main classes', () => {
        expect(VirtualCyclist.Path).toBeDefined();
        expect(VirtualCyclist.GPXParser).toBeDefined();
        expect(VirtualCyclist.GPXWriter).toBeDefined();
        expect(VirtualCyclist.MaxSpeedComputer).toBeDefined();
        expect(VirtualCyclist.Cyclist).toBeDefined();
        expect(VirtualCyclist.Bike).toBeDefined();
    });

    test('should export types', () => {
        // Types are TypeScript compile-time only, just verify module loads
        expect(VirtualCyclist).toBeDefined();
    });
});
