import { Path, POINT_FIELDS, PointField } from '@/types/path/';

export class PointPerDistance {
    private constructor() {}

    static compute(
        path: Path,
        minDist: number,
        maxDist: number,
        fields: PointField[] = POINT_FIELDS
    ): Path {
        const originalCount = path.getPointCount();
        if (originalCount === 0) {
            return new Path(path.name);
        }

        const newPath = new Path(path.name);

        // Always add the first point
        newPath.addFrom(path, 0, fields);
        let lastAddedDistance = path.getDistance(0);
        let lastAddedIndex = 0; // Track the original index of the last added point

        // Process remaining points
        for (let i = 1; i < originalCount; i++) {
            const currentDistance = path.getDistance(i);
            const gap = currentDistance - lastAddedDistance;

            if (gap < minDist) {
                // Skip this point - too close to last added point
                continue;
            } else if (gap <= maxDist) {
                // Perfect spacing - add this original point
                newPath.addFrom(path, i, fields);
                lastAddedDistance = currentDistance;
                lastAddedIndex = i;
            } else {
                // Gap too large - fill with evenly-spaced interpolated points
                const numSegments = Math.ceil(gap / maxDist);
                const spacing = gap / numSegments;

                // Add interpolated points at regular intervals
                for (let j = 1; j < numSegments; j++) {
                    const targetDistance = lastAddedDistance + j * spacing;

                    // Find which original segment contains this target distance
                    // Start from lastAddedIndex and search forward
                    let index1 = lastAddedIndex;
                    while (index1 < i - 1 && path.getDistance(index1 + 1) < targetDistance) {
                        index1++;
                    }
                    const index2 = index1 + 1;

                    // Calculate interpolation coefficient based on distance
                    const dist1 = path.getDistance(index1);
                    const dist2 = path.getDistance(index2);
                    const coef = (targetDistance - dist1) / (dist2 - dist1);

                    // Interpolate and add the point
                    newPath.addInterpolatedFrom(path, index1, index2, coef, fields);
                }

                // Add the current original point
                newPath.addFrom(path, i, fields);
                lastAddedDistance = currentDistance;
                lastAddedIndex = i;
            }
        }

        newPath.computeDerivedData();
        return newPath;
    }
}
