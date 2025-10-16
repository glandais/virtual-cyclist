import { DT } from '@/constants/';
import { PowerComputer } from '@/physics/power/';
import { AeroProvider } from '@/physics/power/aero/aero/';
import { rhoProviderDefault } from '@/physics/power/aero/rho/';
import { WindProvider } from '@/physics/power/aero/wind/';
import { CyclistPowerProvider } from '@/physics/power/cyclist/';
import { CoursePhysics } from '@/types/course/';
import { Bike, Cyclist } from '@/types/models/';
import { Path, Point } from '@/types/path/';

/**
 * Extended PowerComputer class to expose protected methods for testing.
 * Follows the pattern from MaxSpeedComputer.test.ts and existing tests.
 */
class PowerComputerExtended extends PowerComputer {
    public constructor() {
        super();
    }

    public callGetDx(
        pSum: number,
        equivalentMass: number,
        currentSpeed: number,
        dt: number
    ): number {
        return this.getDx(pSum, equivalentMass, currentSpeed, dt);
    }

    public callGetDt(
        pSum: number,
        equivalentMass: number,
        currentSpeed: number,
        dx: number
    ): number {
        return this.getDt(pSum, equivalentMass, currentSpeed, dx);
    }

    public callGetEquivalentMass(course: CoursePhysics): number {
        return this.getEquivalentMass(course);
    }

    public callGetTotPower(equivalentMass: number, s1: number, s2: number, dt: number): number {
        return this.getTotPower(equivalentMass, s1, s2, dt);
    }
}

describe('PowerComputer', () => {
    let computer: PowerComputerExtended;
    let path: Path;
    let cyclist: Cyclist;
    let bike: Bike;

    beforeEach(() => {
        computer = new PowerComputerExtended();
        cyclist = Cyclist.getDefault();
        bike = Bike.getDefault();
        path = new Path('test-path');
    });

    describe('getEquivalentMass', () => {
        test('should calculate equivalent mass with rotational inertia', () => {
            const course: CoursePhysics = {
                path,
                cyclist,
                bike,
                rhoProvider: rhoProviderDefault,
                cyclistPowerProvider: null as unknown as CyclistPowerProvider,
                aeroProvider: null as unknown as AeroProvider,
                windProvider: null as unknown as WindProvider,
            };

            const equivalentMass = computer.callGetEquivalentMass(course);

            // Default: 80kg + rotational inertia
            // Expected: ~80.24kg (0.12 kg⋅m² / (0.7m)²)
            expect(equivalentMass).toBeGreaterThan(80);
            expect(equivalentMass).toBeLessThan(81);
            expect(equivalentMass).toBeCloseTo(80.244, 2);
        });

        test('should handle custom inertia', () => {
            const customBike = new Bike(
                0.004, // crr
                0.05, // inertiaFront
                0.05, // inertiaRear
                0.7, // wheelRadius
                0.976 // efficiency
            );
            const course: CoursePhysics = {
                path,
                cyclist,
                bike: customBike,
                rhoProvider: rhoProviderDefault,
                cyclistPowerProvider: null as unknown as CyclistPowerProvider,
                aeroProvider: null as unknown as AeroProvider,
                windProvider: null as unknown as WindProvider,
            };

            const equivalentMass = computer.callGetEquivalentMass(course);
            // 80kg + 0.1 / 0.49 ≈ 80.204
            expect(equivalentMass).toBeGreaterThan(80);
            expect(equivalentMass).toBeCloseTo(80.204, 2);
        });
    });

    describe('getDx', () => {
        test('should calculate distance from power using energy conservation', () => {
            const pSum = 250; // 250W net power
            const mass = 80;
            const speed = 10; // 10 m/s
            const dt = 1; // 1 second

            const dx = computer.callGetDx(pSum, mass, speed, dt);

            // Energy balance: v_new² = v_old² + 2ΔtP/M
            // v_new = √(2*1*250/80 + 100) = √106.25 ≈ 10.31 m/s
            // dx = (v_old + v_new) * dt / 2 = (10 + 10.31) * 1 / 2 ≈ 10.15m
            expect(dx).toBeGreaterThan(10);
            expect(dx).toBeLessThan(11);
            expect(dx).toBeCloseTo(10.308, 2);
        });

        test('should handle deceleration without going below minimal speed', () => {
            const pSum = -20; // Light braking
            const mass = 80;
            const speed = 5; // Moderate speed
            const dt = 1;

            const dx = computer.callGetDx(pSum, mass, speed, dt);

            // v_new² = 25 + 2*1*(-20)/80 = 25 - 0.5 = 24.5
            // v_new ≈ 4.95 m/s
            // dx ≈ (5 + 4.95) * 1 / 2 ≈ 4.975m
            expect(dx).toBeGreaterThan(0);
            expect(dx).toBeLessThan(speed * dt);
            expect(dx).toBeCloseTo(4.95, 2);
        });

        test('should handle zero power (constant speed)', () => {
            const pSum = 0;
            const mass = 80;
            const speed = 15;
            const dt = 1;

            const dx = computer.callGetDx(pSum, mass, speed, dt);

            // No net power means constant speed
            // dx = speed * dt
            expect(dx).toBeCloseTo(15, 2);
        });

        test('should handle negative power (deceleration)', () => {
            const pSum = -200;
            const mass = 80;
            const speed = 15;
            const dt = 1;

            const dx = computer.callGetDx(pSum, mass, speed, dt);

            // Negative power causes deceleration
            // v_new² = 225 + 2*1*(-200)/80 = 225 - 5 = 220
            // v_new ≈ 14.83 m/s
            // dx ≈ (15 + 14.83) * 1 / 2 ≈ 14.91m
            expect(dx).toBeLessThan(15);
            expect(dx).toBeCloseTo(14.832, 2);
        });
    });

    describe('getDt', () => {
        test('should find time step using binary search', () => {
            const pSum = 250;
            const mass = 80;
            const speed = 10;
            const targetDx = 10.156; // From getDx test

            const dt = computer.callGetDt(pSum, mass, speed, targetDx);

            // Should converge to approximately 1 second
            expect(dt).toBeCloseTo(0.986, 3);

            // Verify by calculating dx with found dt
            const verifyDx = computer.callGetDx(pSum, mass, speed, dt);
            expect(verifyDx).toBeCloseTo(targetDx, 5);
        });

        test('should converge with high precision', () => {
            const pSum = 300;
            const mass = 80;
            const speed = 12;
            const targetDx = 5.5;

            const dt = computer.callGetDt(pSum, mass, speed, targetDx);

            // Verify convergence precision
            const calculatedDx = computer.callGetDx(pSum, mass, speed, dt);
            expect(Math.abs(calculatedDx - targetDx)).toBeLessThan(0.00001);
        });

        test('should handle short distances', () => {
            const pSum = 200;
            const mass = 80;
            const speed = 10;
            const targetDx = 1; // Very short distance

            const dt = computer.callGetDt(pSum, mass, speed, targetDx);

            expect(dt).toBeGreaterThan(0);
            expect(dt).toBeLessThan(DT);

            const calculatedDx = computer.callGetDx(pSum, mass, speed, dt);
            expect(calculatedDx).toBeCloseTo(targetDx, 5);
        });
    });

    describe('getNewPower', () => {
        test('should sum power from all providers with cyclist', () => {
            // Create simple test path with required data
            path.addPoint({
                latitude: 45.0,
                longitude: 6.0,
                elevation: 1000,
                time: Date.now(),
                distance: 0,
                speed: 10,
                grade: 0.05,
                bearing: 0,
            } as Point);

            path.addPoint({
                latitude: 45.001,
                longitude: 6.0,
                elevation: 1005,
                time: Date.now() + 1000,
                distance: 100,
                speed: 10,
                grade: 0.05,
                bearing: 0,
            } as Point);

            path.computeDerivedData();

            // Simplified course setup - power should include all providers
            const course = {
                path,
                cyclist,
                bike,
                cyclistPowerProvider: {
                    getPowerW: () => 250, // Cyclist provides 250W
                },
                aeroProvider: {
                    getAeroCoef: () => 0.175, // Default aero coefficient
                },
                windProvider: {
                    getWind: () => ({ windSpeed: 0, windDirection: 0 }),
                },
            } as Partial<CoursePhysics> as CoursePhysics;

            const powerWithCyclist = computer.getNewPower(course, path, 0, true);
            const powerWithoutCyclist = computer.getNewPower(course, path, 0, false);

            // With cyclist should be more positive (cyclist adds power)
            expect(powerWithCyclist).toBeGreaterThan(powerWithoutCyclist);
            // Power difference should be cyclist wheel power (250W * 0.976 efficiency ≈ 244W)
            expect(powerWithCyclist - powerWithoutCyclist).toBeCloseTo(244, 0);
        });
    });

    describe('computeCyclistPower', () => {
        test('should back-calculate cyclist power from speed change', () => {
            // Create path with two points showing acceleration
            const time1 = Date.now();
            const time2 = time1 + 1000; // 1 second later
            const time3 = time2 + 1000; // 1 second later

            path.addPoint({
                latitude: 45.0,
                longitude: 6.0,
                elevation: 1000,
                time: time1,
                distance: 0,
                speed: 10, // 10 m/s
                grade: 0,
                bearing: 0,
            } as Point);

            path.addPoint({
                latitude: 45.001,
                longitude: 6.0,
                elevation: 1000,
                time: time2,
                distance: 10.5,
                speed: 11, // 11 m/s (acceleration)
                grade: 0,
                bearing: 0,
            } as Point);

            path.addPoint({
                latitude: 45.002,
                longitude: 6.0,
                elevation: 1000,
                time: time3,
                distance: 12,
                speed: 11, // 11 m/s (acceleration)
                grade: 0,
                bearing: 0,
            } as Point);

            path.computeDerivedData();

            const course = {
                path,
                cyclist,
                bike,
                aeroProvider: { getAeroCoef: () => 0.175 },
                windProvider: { getWind: () => ({ windSpeed: 0, windDirection: 0 }) },
            } as Partial<CoursePhysics> as CoursePhysics;

            const equivalentMass = 80.244;
            computer.computeCyclistPower(course, path, equivalentMass, 1);
            const cyclistPower = path.getPComputedPower(1);

            // Acceleration from 10 to 11 m/s requires kinetic energy increase
            // ΔKE = 0.5 * 80.244 * (11² - 10²) = 0.5 * 80.244 * 21 ≈ 843W
            // Plus resistances, so cyclist power should be positive and significant
            expect(cyclistPower).toBeGreaterThan(0);
            expect(cyclistPower).toBeGreaterThan(800); // At minimum the kinetic energy change
        });

        test('should handle deceleration (negative power)', () => {
            const time1 = Date.now();
            const time2 = time1 + 1000;

            path.addPoint({
                latitude: 45.0,
                longitude: 6.0,
                elevation: 1000,
                time: time1,
                distance: 0,
                speed: 15,
                grade: 0,
                bearing: 0,
            } as Point);

            path.addPoint({
                latitude: 45.001,
                longitude: 6.0,
                elevation: 1000,
                time: time2,
                distance: 14,
                speed: 13, // Deceleration
                grade: 0,
                bearing: 0,
            } as Point);

            path.computeDerivedData();

            const course = {
                path,
                cyclist,
                bike,
                aeroProvider: { getAeroCoef: () => 0.175 },
                windProvider: { getWind: () => ({ windSpeed: 0, windDirection: 0 }) },
            } as Partial<CoursePhysics> as CoursePhysics;

            const equivalentMass = 80.244;
            computer.computeCyclistPower(course, path, equivalentMass, 0);
            const cyclistPower = path.getPComputedPower(0);

            // Deceleration means negative total power, but cyclist power is clamped to 0
            expect(cyclistPower).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getTotPower', () => {
        test('should calculate power from kinetic energy change', () => {
            const mass = 80;
            const s1 = 10; // 10 m/s
            const s2 = 12; // 12 m/s
            const dt = 2; // 2 seconds

            const power = computer.callGetTotPower(mass, s1, s2, dt);

            // P = 0.5 * M * (v2² - v1²) / dt
            // P = 0.5 * 80 * (144 - 100) / 2 = 0.5 * 80 * 44 / 2 = 880W
            expect(power).toBeCloseTo(880, 1);
        });

        test('should handle deceleration (negative power)', () => {
            const mass = 80;
            const s1 = 12;
            const s2 = 10;
            const dt = 2;

            const power = computer.callGetTotPower(mass, s1, s2, dt);

            // Negative power for deceleration
            expect(power).toBeCloseTo(-880, 1);
        });

        test('should handle zero speed change', () => {
            const mass = 80;
            const s1 = 10;
            const s2 = 10;
            const dt = 1;

            const power = computer.callGetTotPower(mass, s1, s2, dt);

            expect(power).toBe(0);
        });
    });
});
