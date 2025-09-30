import {
    DEFAULT_CRR,
    DEFAULT_DRIVETRAIN_EFFICIENCY,
    DEFAULT_INERTIA_FRONT,
    DEFAULT_INERTIA_REAR,
    DEFAULT_WHEEL_RADIUS,
} from '@/constants/';
import { Bike } from '@/types/models/';

describe('Bike', () => {
    describe('constructor', () => {
        test('should create bike with custom parameters', () => {
            const bike = new Bike(0.005, 0.08, 0.12, 0.68, 0.95);

            expect(bike.crr).toBe(0.005);
            expect(bike.inertiaFront).toBe(0.08);
            expect(bike.inertiaRear).toBe(0.12);
            expect(bike.wheelRadius).toBe(0.68);
            expect(bike.efficiency).toBe(0.95);
        });

        test('should create bike with all zero parameters', () => {
            const bike = new Bike(0, 0, 0, 0, 0);

            expect(bike.crr).toBe(0);
            expect(bike.inertiaFront).toBe(0);
            expect(bike.inertiaRear).toBe(0);
            expect(bike.wheelRadius).toBe(0);
            expect(bike.efficiency).toBe(0);
        });

        test('should create bike with extreme parameters', () => {
            const bike = new Bike(0.1, 1.0, 2.0, 1.5, 1.0);

            expect(bike.crr).toBe(0.1);
            expect(bike.inertiaFront).toBe(1.0);
            expect(bike.inertiaRear).toBe(2.0);
            expect(bike.wheelRadius).toBe(1.5);
            expect(bike.efficiency).toBe(1.0);
        });
    });

    describe('getDefault', () => {
        test('should create bike with default parameters', () => {
            const bike = Bike.getDefault();

            expect(bike.crr).toBe(DEFAULT_CRR);
            expect(bike.inertiaFront).toBe(DEFAULT_INERTIA_FRONT);
            expect(bike.inertiaRear).toBe(DEFAULT_INERTIA_REAR);
            expect(bike.wheelRadius).toBe(DEFAULT_WHEEL_RADIUS);
            expect(bike.efficiency).toBe(DEFAULT_DRIVETRAIN_EFFICIENCY);
        });

        test('should create new instance each time', () => {
            const bike1 = Bike.getDefault();
            const bike2 = Bike.getDefault();

            expect(bike1).not.toBe(bike2);
            expect(bike1.crr).toBe(bike2.crr);
        });
    });

    describe('getTotalInertia', () => {
        test('should calculate total inertia correctly', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 0.976);

            expect(bike.getTotalInertia()).toBe(0.08 + 0.12);
        });

        test('should handle zero inertia', () => {
            const bike = new Bike(0.004, 0, 0, 0.7, 0.976);

            expect(bike.getTotalInertia()).toBe(0);
        });

        test('should handle large inertia values', () => {
            const bike = new Bike(0.004, 5.5, 8.3, 0.7, 0.976);

            expect(bike.getTotalInertia()).toBe(13.8);
        });
    });

    describe('getWheelDiameter', () => {
        test('should calculate diameter correctly', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.35, 0.976);

            expect(bike.getWheelDiameter()).toBe(0.7);
        });

        test('should handle zero radius', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0, 0.976);

            expect(bike.getWheelDiameter()).toBe(0);
        });

        test('should handle standard 700c wheel', () => {
            const bike = new Bike(0.004, 0.08, 0.12, DEFAULT_WHEEL_RADIUS, 0.976);

            expect(bike.getWheelDiameter()).toBe(1.4);
        });
    });

    describe('getWheelCircumference', () => {
        test('should calculate circumference correctly', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 0.976);

            expect(bike.getWheelCircumference()).toBeCloseTo(2 * Math.PI * 0.7, 6);
        });

        test('should handle zero radius', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0, 0.976);

            expect(bike.getWheelCircumference()).toBe(0);
        });

        test('should calculate for standard 700c wheel', () => {
            const bike = Bike.getDefault();

            expect(bike.getWheelCircumference()).toBeCloseTo(4.398229715, 6);
        });
    });

    describe('getEquivalentMass', () => {
        test('should calculate equivalent mass correctly', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 0.976);
            const totalInertia = 0.08 + 0.12;
            const expectedMass = totalInertia / (0.7 * 0.7);

            expect(bike.getEquivalentMass()).toBeCloseTo(expectedMass, 6);
        });

        test('should handle zero inertia', () => {
            const bike = new Bike(0.004, 0, 0, 0.7, 0.976);

            expect(bike.getEquivalentMass()).toBe(0);
        });

        test('should handle zero radius', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0, 0.976);

            expect(bike.getEquivalentMass()).toBe(Infinity);
        });

        test('should calculate for default bike', () => {
            const bike = Bike.getDefault();
            const totalInertia = DEFAULT_INERTIA_FRONT + DEFAULT_INERTIA_REAR;
            const expectedMass = totalInertia / (DEFAULT_WHEEL_RADIUS * DEFAULT_WHEEL_RADIUS);

            expect(bike.getEquivalentMass()).toBeCloseTo(expectedMass, 6);
        });
    });

    describe('getPowerLossFactor', () => {
        test('should calculate power loss factor correctly', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 0.95);

            expect(bike.getPowerLossFactor()).toBeCloseTo(0.05, 6);
        });

        test('should handle perfect efficiency', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 1.0);

            expect(bike.getPowerLossFactor()).toBe(0);
        });

        test('should handle zero efficiency', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 0);

            expect(bike.getPowerLossFactor()).toBe(1);
        });

        test('should calculate for default bike', () => {
            const bike = Bike.getDefault();

            expect(bike.getPowerLossFactor()).toBe(1 - DEFAULT_DRIVETRAIN_EFFICIENCY);
        });
    });

    describe('getWheelPower', () => {
        test('should calculate wheel power correctly', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 0.95);
            const inputPower = 250;

            expect(bike.getWheelPower(inputPower)).toBe(237.5);
        });

        test('should handle zero input power', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 0.95);

            expect(bike.getWheelPower(0)).toBe(0);
        });

        test('should handle perfect efficiency', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 1.0);
            const inputPower = 300;

            expect(bike.getWheelPower(inputPower)).toBe(300);
        });

        test('should handle zero efficiency', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 0);
            const inputPower = 250;

            expect(bike.getWheelPower(inputPower)).toBe(0);
        });

        test('should handle negative power', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 0.95);

            expect(bike.getWheelPower(-100)).toBe(-95);
        });
    });

    describe('getRollingResistanceForce', () => {
        test('should calculate rolling resistance force correctly', () => {
            const bike = new Bike(0.005, 0.08, 0.12, 0.7, 0.95);
            const normalForce = 800; // ~80kg cyclist + bike * 9.81 m/s²

            expect(bike.getRollingResistanceForce(normalForce)).toBe(4);
        });

        test('should handle zero normal force', () => {
            const bike = new Bike(0.005, 0.08, 0.12, 0.7, 0.95);

            expect(bike.getRollingResistanceForce(0)).toBe(0);
        });

        test('should handle zero crr', () => {
            const bike = new Bike(0, 0.08, 0.12, 0.7, 0.95);
            const normalForce = 800;

            expect(bike.getRollingResistanceForce(normalForce)).toBe(0);
        });

        test('should calculate for default bike with typical load', () => {
            const bike = Bike.getDefault();
            const normalForce = 784.8; // 80kg * 9.81 m/s²

            expect(bike.getRollingResistanceForce(normalForce)).toBeCloseTo(3.139, 3);
        });
    });

    describe('toString', () => {
        test('should generate readable string for default bike', () => {
            const bike = Bike.getDefault();
            const result = bike.toString();

            expect(result).toContain('Bike {');
            expect(result).toContain('wheelSize: 1400mm');
            expect(result).toContain('crr: 0.0040');
            expect(result).toContain('totalInertia:');
            expect(result).toContain('efficiency: 97.6%');
            expect(result).toContain('kg⋅m²');
            expect(result).toContain('kg equiv');
            expect(result).toContain('% loss');
        });

        test('should generate readable string for custom bike', () => {
            const bike = new Bike(0.005, 0.1, 0.15, 0.65, 0.95);
            const result = bike.toString();

            expect(result).toContain('wheelSize: 1300mm');
            expect(result).toContain('crr: 0.0050');
            expect(result).toContain('efficiency: 95.0%');
            expect(result).toContain('5.0% loss');
        });

        test('should handle zero values in string representation', () => {
            const bike = new Bike(0, 0, 0, 0, 0);
            const result = bike.toString();

            expect(result).toContain('wheelSize: 0mm');
            expect(result).toContain('crr: 0.0000');
            expect(result).toContain('efficiency: 0.0%');
            expect(result).toContain('100.0% loss');
        });

        test('should handle perfect efficiency in string representation', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.7, 1.0);
            const result = bike.toString();

            expect(result).toContain('efficiency: 100.0%');
            expect(result).toContain('0.0% loss');
        });
    });

    describe('edge cases and validation', () => {
        test('should handle very small wheel radius', () => {
            const bike = new Bike(0.004, 0.08, 0.12, 0.001, 0.976);

            expect(bike.getWheelDiameter()).toBe(0.002);
            expect(bike.getWheelCircumference()).toBeCloseTo(0.006283, 6);
            expect(bike.getEquivalentMass()).toBeCloseTo(200000, 0);
        });

        test('should handle very large inertia values', () => {
            const bike = new Bike(0.004, 10, 15, 0.7, 0.976);

            expect(bike.getTotalInertia()).toBe(25);
            expect(bike.getEquivalentMass()).toBeCloseTo(51.02, 2);
        });

        test('should calculate realistic values for mountain bike', () => {
            // Mountain bike: heavier wheels, lower efficiency, higher rolling resistance
            const mtbBike = new Bike(0.008, 0.15, 0.2, 0.66, 0.92);

            expect(mtbBike.getTotalInertia()).toBe(0.35);
            expect(mtbBike.getWheelPower(250)).toBe(230);
            expect(mtbBike.getPowerLossFactor()).toBeCloseTo(0.08, 6);
            expect(mtbBike.getRollingResistanceForce(800)).toBe(6.4);
        });

        test('should calculate realistic values for time trial bike', () => {
            // Time trial bike: aerodynamic wheels, high efficiency, low rolling resistance
            const ttBike = new Bike(0.003, 0.12, 0.18, 0.71, 0.985);

            expect(ttBike.getTotalInertia()).toBe(0.3);
            expect(ttBike.getWheelPower(300)).toBe(295.5);
            expect(ttBike.getPowerLossFactor()).toBeCloseTo(0.015, 6);
            expect(ttBike.getRollingResistanceForce(750)).toBe(2.25);
        });
    });
});
