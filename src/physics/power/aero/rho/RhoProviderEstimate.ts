import { CoursePhysics } from '@/types/course/';
import { Path } from '@/types/path/';
import { RhoProvider } from './RhoProvider';

class RhoProviderEstimate implements RhoProvider {
    getRho(_course: CoursePhysics, path: Path, pointIndex: number): number {
        const providedTemp = path.getTemperature(pointIndex);
        const temperatureC = isNaN(providedTemp) ? 15 : providedTemp;

        const providedElevation = path.getElevation(pointIndex);
        const altitude = isNaN(providedElevation) ? 0 : providedElevation;

        // Constants
        const P0 = 101325; // Sea-level standard atmospheric pressure, Pa
        const T0 = 288.15; // Sea-level standard temperature, K (15 °C)
        const g = 9.80665; // Gravity, m/s²
        const L = 0.0065; // Temperature lapse rate, K/m
        const R = 287.05; // Specific gas constant for dry air, J/(kg·K)

        // Convert input temperature to Kelvin
        const T = temperatureC + 273.15;

        // Pressure at altitude using barometric formula (troposphere approximation)
        const pressure = P0 * Math.pow(1 - (L * altitude) / T0, g / (R * L));

        // Density from ideal gas law: ρ = p / (R * T)
        const rho = pressure / (R * T);

        return rho;
    }
}

export const rhoProviderEstimate: RhoProvider = new RhoProviderEstimate();
