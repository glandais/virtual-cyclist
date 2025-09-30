import {
    DEFAULT_CYCLIST_MASS_KG,
    DEFAULT_CYCLIST_POWER_W,
    DEFAULT_DRAG_COEFFICIENT,
    DEFAULT_FRONTAL_AREA,
    DEFAULT_MAX_BRAKE_G,
    DEFAULT_MAX_LEAN_ANGLE_DEG,
    DEFAULT_MAX_SPEED_KMH,
    G,
} from '@/constants/';
import { Cyclist } from '@/types/models/';

describe('Cyclist', () => {
    describe('constructor', () => {
        test('should create cyclist with custom parameters', () => {
            const cyclist = new Cyclist(75, 300, true, 0.7, 0.8, 0.45, 40, 65);

            expect(cyclist.mKg).toBe(75);
            expect(cyclist.power).toBe(300);
            expect(cyclist.harmonics).toBe(true);
            expect(cyclist.maxBrakeG).toBe(0.7);
            expect(cyclist.cd).toBe(0.8);
            expect(cyclist.a).toBe(0.45);
            expect(cyclist.maxAngleDeg).toBe(40);
            expect(cyclist.maxSpeedKmH).toBe(65);
        });

        test('should create cyclist with zero/minimum parameters', () => {
            const cyclist = new Cyclist(1, 0, false, 0, 0, 0, 0, 0);

            expect(cyclist.mKg).toBe(1);
            expect(cyclist.power).toBe(0);
            expect(cyclist.harmonics).toBe(false);
            expect(cyclist.maxBrakeG).toBe(0);
            expect(cyclist.cd).toBe(0);
            expect(cyclist.a).toBe(0);
            expect(cyclist.maxAngleDeg).toBe(0);
            expect(cyclist.maxSpeedKmH).toBe(0);
        });

        test('should create cyclist with extreme parameters', () => {
            const cyclist = new Cyclist(150, 500, true, 1.5, 2.0, 1.0, 90, 100);

            expect(cyclist.mKg).toBe(150);
            expect(cyclist.power).toBe(500);
            expect(cyclist.harmonics).toBe(true);
            expect(cyclist.maxBrakeG).toBe(1.5);
            expect(cyclist.cd).toBe(2.0);
            expect(cyclist.a).toBe(1.0);
            expect(cyclist.maxAngleDeg).toBe(90);
            expect(cyclist.maxSpeedKmH).toBe(100);
        });
    });

    describe('getDefault', () => {
        test('should create cyclist with default parameters', () => {
            const cyclist = Cyclist.getDefault();

            expect(cyclist.mKg).toBe(DEFAULT_CYCLIST_MASS_KG);
            expect(cyclist.power).toBe(DEFAULT_CYCLIST_POWER_W);
            expect(cyclist.harmonics).toBe(false);
            expect(cyclist.maxBrakeG).toBe(DEFAULT_MAX_BRAKE_G);
            expect(cyclist.cd).toBe(DEFAULT_DRAG_COEFFICIENT);
            expect(cyclist.a).toBe(DEFAULT_FRONTAL_AREA);
            expect(cyclist.maxAngleDeg).toBe(DEFAULT_MAX_LEAN_ANGLE_DEG);
            expect(cyclist.maxSpeedKmH).toBe(DEFAULT_MAX_SPEED_KMH);
        });

        test('should create new instance each time', () => {
            const cyclist1 = Cyclist.getDefault();
            const cyclist2 = Cyclist.getDefault();

            expect(cyclist1).not.toBe(cyclist2);
            expect(cyclist1.mKg).toBe(cyclist2.mKg);
        });
    });

    describe('getTanMaxAngle', () => {
        test('should calculate tangent of 45 degrees', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 45, 60);

            expect(cyclist.getTanMaxAngle()).toBeCloseTo(1, 6);
        });

        test('should calculate tangent of 30 degrees', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 30, 60);

            expect(cyclist.getTanMaxAngle()).toBeCloseTo(Math.tan(Math.PI / 6), 6);
        });

        test('should calculate tangent of 0 degrees', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 0, 60);

            expect(cyclist.getTanMaxAngle()).toBe(0);
        });

        test('should calculate tangent of 60 degrees', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 60, 60);

            expect(cyclist.getTanMaxAngle()).toBeCloseTo(Math.sqrt(3), 6);
        });

        test('should calculate for default cyclist', () => {
            const cyclist = Cyclist.getDefault();
            const expectedTan = Math.tan((DEFAULT_MAX_LEAN_ANGLE_DEG * Math.PI) / 180);

            expect(cyclist.getTanMaxAngle()).toBeCloseTo(expectedTan, 6);
        });
    });

    describe('getMaxAngleRad', () => {
        test('should convert 45 degrees to radians', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 45, 60);

            expect(cyclist.getMaxAngleRad()).toBeCloseTo(Math.PI / 4, 6);
        });

        test('should convert 0 degrees to radians', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 0, 60);

            expect(cyclist.getMaxAngleRad()).toBe(0);
        });

        test('should convert 90 degrees to radians', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 90, 60);

            expect(cyclist.getMaxAngleRad()).toBeCloseTo(Math.PI / 2, 6);
        });

        test('should convert 30 degrees to radians', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 30, 60);

            expect(cyclist.getMaxAngleRad()).toBeCloseTo(Math.PI / 6, 6);
        });

        test('should convert for default cyclist', () => {
            const cyclist = Cyclist.getDefault();
            const expectedRad = (DEFAULT_MAX_LEAN_ANGLE_DEG * Math.PI) / 180;

            expect(cyclist.getMaxAngleRad()).toBeCloseTo(expectedRad, 6);
        });
    });

    describe('getMaxBrakeMS2', () => {
        test('should convert 1g to m/s²', () => {
            const cyclist = new Cyclist(80, 250, false, 1.0, 0.7, 0.5, 35, 60);

            expect(cyclist.getMaxBrakeMS2()).toBeCloseTo(G, 6);
        });

        test('should convert 0.5g to m/s²', () => {
            const cyclist = new Cyclist(80, 250, false, 0.5, 0.7, 0.5, 35, 60);

            expect(cyclist.getMaxBrakeMS2()).toBeCloseTo(0.5 * G, 6);
        });

        test('should convert 0g to m/s²', () => {
            const cyclist = new Cyclist(80, 250, false, 0, 0.7, 0.5, 35, 60);

            expect(cyclist.getMaxBrakeMS2()).toBe(0);
        });

        test('should convert 1.5g to m/s²', () => {
            const cyclist = new Cyclist(80, 250, false, 1.5, 0.7, 0.5, 35, 60);

            expect(cyclist.getMaxBrakeMS2()).toBeCloseTo(1.5 * G, 6);
        });

        test('should convert for default cyclist', () => {
            const cyclist = Cyclist.getDefault();

            expect(cyclist.getMaxBrakeMS2()).toBeCloseTo(DEFAULT_MAX_BRAKE_G * G, 6);
        });
    });

    describe('getMaxSpeedMs', () => {
        test('should convert 36 km/h to 10 m/s', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 35, 36);

            expect(cyclist.getMaxSpeedMs()).toBeCloseTo(10, 6);
        });

        test('should convert 72 km/h to 20 m/s', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 35, 72);

            expect(cyclist.getMaxSpeedMs()).toBeCloseTo(20, 6);
        });

        test('should convert 0 km/h to 0 m/s', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 35, 0);

            expect(cyclist.getMaxSpeedMs()).toBe(0);
        });

        test('should convert 18 km/h to 5 m/s', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 35, 18);

            expect(cyclist.getMaxSpeedMs()).toBeCloseTo(5, 6);
        });

        test('should convert for default cyclist', () => {
            const cyclist = Cyclist.getDefault();

            expect(cyclist.getMaxSpeedMs()).toBeCloseTo(DEFAULT_MAX_SPEED_KMH / 3.6, 6);
        });
    });

    describe('getPowerToWeightRatio', () => {
        test('should calculate power-to-weight ratio correctly', () => {
            const cyclist = new Cyclist(80, 280, false, 0.6, 0.7, 0.5, 35, 60);

            expect(cyclist.getPowerToWeightRatio()).toBe(3.5);
        });

        test('should handle zero power', () => {
            const cyclist = new Cyclist(80, 0, false, 0.6, 0.7, 0.5, 35, 60);

            expect(cyclist.getPowerToWeightRatio()).toBe(0);
        });

        test('should handle small mass', () => {
            const cyclist = new Cyclist(1, 100, false, 0.6, 0.7, 0.5, 35, 60);

            expect(cyclist.getPowerToWeightRatio()).toBe(100);
        });

        test('should calculate for professional cyclist', () => {
            const cyclist = new Cyclist(65, 400, false, 0.6, 0.7, 0.5, 35, 60);

            expect(cyclist.getPowerToWeightRatio()).toBeCloseTo(6.15, 2);
        });

        test('should calculate for default cyclist', () => {
            const cyclist = Cyclist.getDefault();

            expect(cyclist.getPowerToWeightRatio()).toBeCloseTo(
                DEFAULT_CYCLIST_POWER_W / DEFAULT_CYCLIST_MASS_KG,
                6
            );
        });
    });

    describe('getAerodynamicDragArea', () => {
        test('should calculate CdA correctly', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.8, 0.4, 35, 60);

            expect(cyclist.getAerodynamicDragArea()).toBeCloseTo(0.32, 6);
        });

        test('should handle zero drag coefficient', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0, 0.5, 35, 60);

            expect(cyclist.getAerodynamicDragArea()).toBe(0);
        });

        test('should handle zero frontal area', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.7, 0, 35, 60);

            expect(cyclist.getAerodynamicDragArea()).toBe(0);
        });

        test('should calculate for aerodynamic position', () => {
            const cyclist = new Cyclist(80, 250, false, 0.6, 0.6, 0.35, 35, 60);

            expect(cyclist.getAerodynamicDragArea()).toBe(0.21);
        });

        test('should calculate for default cyclist', () => {
            const cyclist = Cyclist.getDefault();

            expect(cyclist.getAerodynamicDragArea()).toBeCloseTo(
                DEFAULT_DRAG_COEFFICIENT * DEFAULT_FRONTAL_AREA,
                6
            );
        });
    });

    describe('toString', () => {
        test('should generate readable string for default cyclist', () => {
            const cyclist = Cyclist.getDefault();
            const result = cyclist.toString();

            expect(result).toContain('Cyclist {');
            expect(result).toContain('mass: 80kg');
            expect(result).toContain('power: 280W');
            expect(result).toContain('W/kg');
            expect(result).toContain('CdA:');
            expect(result).toContain('maxBrake:');
            expect(result).toContain('maxLean:');
            expect(result).toContain('maxSpeed:');
            expect(result).toContain('m/s²');
            expect(result).toContain('m/s)');
        });

        test('should generate readable string for custom cyclist', () => {
            const cyclist = new Cyclist(70, 350, true, 0.8, 0.6, 0.4, 40, 75);
            const result = cyclist.toString();

            expect(result).toContain('mass: 70kg');
            expect(result).toContain('power: 350W');
            expect(result).toContain('5.0 W/kg');
            expect(result).toContain('CdA: 0.240m²');
            expect(result).toContain('maxBrake: 0.8g');
            expect(result).toContain('maxLean: 40°');
            expect(result).toContain('maxSpeed: 75km/h');
        });

        test('should handle zero values in string representation', () => {
            const cyclist = new Cyclist(1, 0, false, 0, 0, 0, 0, 0);
            const result = cyclist.toString();

            expect(result).toContain('mass: 1kg');
            expect(result).toContain('power: 0W');
            expect(result).toContain('0.0 W/kg');
            expect(result).toContain('CdA: 0.000m²');
            expect(result).toContain('maxBrake: 0g');
            expect(result).toContain('maxLean: 0°');
            expect(result).toContain('maxSpeed: 0km/h');
        });

        test('should handle professional cyclist values', () => {
            const cyclist = new Cyclist(65, 450, false, 1.0, 0.55, 0.3, 45, 80);
            const result = cyclist.toString();

            expect(result).toContain('mass: 65kg');
            expect(result).toContain('power: 450W');
            expect(result).toContain('6.9 W/kg');
            expect(result).toContain('CdA: 0.165m²');
            expect(result).toContain('maxBrake: 1g');
            expect(result).toContain('maxLean: 45°');
            expect(result).toContain('maxSpeed: 80km/h');
        });
    });

    describe('edge cases and realistic scenarios', () => {
        test('should handle very lightweight cyclist', () => {
            const cyclist = new Cyclist(50, 200, false, 0.6, 0.7, 0.4, 35, 60);

            expect(cyclist.getPowerToWeightRatio()).toBe(4.0);
            expect(cyclist.getAerodynamicDragArea()).toBeCloseTo(0.28, 6);
            expect(cyclist.getMaxBrakeMS2()).toBeCloseTo(0.6 * G, 6);
        });

        test('should handle very heavy cyclist', () => {
            const cyclist = new Cyclist(120, 250, false, 0.5, 0.8, 0.6, 30, 50);

            expect(cyclist.getPowerToWeightRatio()).toBeCloseTo(2.08, 2);
            expect(cyclist.getAerodynamicDragArea()).toBe(0.48);
            expect(cyclist.getTanMaxAngle()).toBeCloseTo(Math.tan(Math.PI / 6), 6);
        });

        test('should calculate realistic values for recreational cyclist', () => {
            const recCyclist = new Cyclist(85, 200, false, 0.5, 0.8, 0.55, 30, 55);

            expect(recCyclist.getPowerToWeightRatio()).toBeCloseTo(2.35, 2);
            expect(recCyclist.getAerodynamicDragArea()).toBeCloseTo(0.44, 6);
            expect(recCyclist.getMaxSpeedMs()).toBeCloseTo(15.28, 2);
            expect(recCyclist.getMaxBrakeMS2()).toBeCloseTo(4.9, 1);
        });

        test('should calculate realistic values for competitive cyclist', () => {
            const compCyclist = new Cyclist(72, 380, false, 0.8, 0.65, 0.35, 42, 75);

            expect(compCyclist.getPowerToWeightRatio()).toBeCloseTo(5.28, 2);
            expect(compCyclist.getAerodynamicDragArea()).toBeCloseTo(0.228, 2);
            expect(compCyclist.getMaxSpeedMs()).toBeCloseTo(20.83, 2);
            expect(compCyclist.getTanMaxAngle()).toBeCloseTo(Math.tan((42 * Math.PI) / 180), 6);
        });

        test('should calculate realistic values for time trial specialist', () => {
            const ttCyclist = new Cyclist(75, 400, false, 0.7, 0.5, 0.25, 35, 70);

            expect(ttCyclist.getPowerToWeightRatio()).toBeCloseTo(5.33, 2);
            expect(ttCyclist.getAerodynamicDragArea()).toBe(0.125); // Very aerodynamic
            expect(ttCyclist.getMaxSpeedMs()).toBeCloseTo(19.44, 2);
        });

        test('should handle extreme lean angles', () => {
            const motorcycleLike = new Cyclist(80, 250, false, 0.6, 0.7, 0.5, 60, 60);

            expect(motorcycleLike.getTanMaxAngle()).toBeCloseTo(Math.sqrt(3), 6);
            expect(motorcycleLike.getMaxAngleRad()).toBeCloseTo(Math.PI / 3, 6);
        });

        test('should handle extreme braking scenarios', () => {
            const extremeBraker = new Cyclist(80, 250, false, 1.2, 0.7, 0.5, 35, 60);

            expect(extremeBraker.getMaxBrakeMS2()).toBeCloseTo(1.2 * G, 6);
        });
    });
});
