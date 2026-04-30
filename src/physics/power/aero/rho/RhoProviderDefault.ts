import { RhoProvider } from './RhoProvider';
import { DEFAULT_AIR_DENSITY } from '@/constants/';
import { CoursePhysics } from '@/types/course/';
import { Path } from '@/types/path/';

class RhoProviderDefault implements RhoProvider {
    getRho(_course: CoursePhysics, _path: Path, _pointIndex: number): number {
        return DEFAULT_AIR_DENSITY;
    }
}

export const rhoProviderDefault: RhoProvider = new RhoProviderDefault();
