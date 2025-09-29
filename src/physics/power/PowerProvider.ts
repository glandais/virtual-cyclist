import { Path } from '../../Path';

export type PowerProviderId = 'cyclist' | 'rolling_resistance' | 'bearings' | 'aero' | 'gravity';

export interface PowerProvider<C> {
    getPowerW(course: C, path: Path, pointIndex: number): number;

    getId(): PowerProviderId;
}
