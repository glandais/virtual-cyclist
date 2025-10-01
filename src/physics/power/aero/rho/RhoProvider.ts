import { Course } from '@/types/course/';
import { Path } from '@/types/path/';

export interface RhoProvider {
    /**
     * Gets the air density in kg/m³ at a specific location on the course.
     *
     * @param course The course configuration with cyclist and environmental parameters
     * @param path The path containing point data
     * @param pointIndex The index of the current point
     * @returns Air density in kg/m³
     */
    getRho(course: Course, path: Path, pointIndex: number): number;
}
