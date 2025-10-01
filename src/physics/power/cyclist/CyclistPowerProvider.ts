import { PowerProvider } from '@/physics/power/';

/**
 * Interface for cyclist power output providers in virtual cycling simulations.
 *
 * CyclistPowerProvider implementations determine how much power the virtual
 * cyclist generates at each point along the route. Different implementations
 * support various power models:
 *
 * - **Constant Power**: Fixed wattage output (e.g., 250W sustained)
 * - **Power with Tiring**: Degrading power over time simulating fatigue
 * - **Power from Data**: Use existing power measurements from GPX data
 * - **Variable Power**: Training plans, intervals, or terrain-responsive power
 *
 * The power value returned represents the cyclist's muscular power output
 * before drivetrain losses. The MuscularPowerProvider applies efficiency
 * to convert this to wheel power.
 *
 * @see MuscularPowerProvider
 * @see CyclistPowerProviderBase
 */
export interface CyclistPowerProvider extends PowerProvider {}
