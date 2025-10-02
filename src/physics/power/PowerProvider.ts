import { CoursePhysics } from '@/types/course/';
import { Path } from '@/types/path/';

export interface PowerProvider {
    getPowerW(course: CoursePhysics, path: Path, pointIndex: number): number;
}
