// Load GPX file from the server
async function loadGPXDemo() {
    try {
        console.log('Loading GPX file...');

        // Fetch the GPX file
        const response = await fetch('./gpx/sample.gpx');
        if (!response.ok) {
            throw new Error(`Failed to load GPX: ${response.status} ${response.statusText}`);
        }

        const gpxContent = await response.text();
        console.log('GPX file loaded, size:', gpxContent.length, 'characters');

        // Parse GPX into Path
        const path = window.VirtualCyclist.Path.fromGPX(gpxContent);
        console.log('Path created successfully!');
        console.log('Number of points:', path.getPointCount());
        console.log('Memory info:', path.getMemoryInfo());

        // Show some sample points
        if (path.getPointCount() > 0) {
            console.log('First point:', path.getPointData(0));

            if (path.getPointCount() > 1) {
                const lastIndex = path.getPointCount() - 1;
                console.log('Last point:', path.getPointData(lastIndex));
            }
        }

        // Test elevation fixing
        console.log('Testing elevation correction...');
        const { Elevation } = window.VirtualCyclist;
        const correctedPath = await Elevation.fixElevation(path);
        console.log('Elevation corrected!');
        console.log('Corrected path points:', correctedPath.getPointCount());

        if (correctedPath.getPointCount() > 0) {
            console.log('First corrected point:', correctedPath.getPointData(0));
        }

        // Test computeArrays functionality
        console.log('Testing computeArrays...');
        path.computeArrays();
        console.log('Arrays computed:', path.arePointsEnhanced());
        console.log('Total distance:', path.getTotalDistance(), 'meters');
        console.log('Min elevation:', path.getMinElevation(), 'meters');
        console.log('Max elevation:', path.getMaxElevation(), 'meters');
        console.log('Total elevation gain:', path.getTotalElevationGain(), 'meters');
        console.log('Total elevation loss:', path.getTotalElevationLoss(), 'meters');
        console.log('Geographic bounds:', path.getBounds());

        // Show computed properties for first few points
        if (path.getPointCount() > 0) {
            console.log('Sample computed data for first 3 points:');
            for (let i = 0; i < Math.min(3, path.getPointCount()); i++) {
                const point = path.getPointData(i);
                console.log(`Point ${i}:`, {
                    lat: point.lat,
                    lon: point.lon,
                    elevation: point.ele,
                    distance: point.dist,
                    grade: point.grade,
                    elapsed: point.elapsed,
                    speed: point.speed,
                    bearing: point.bearing,
                });
            }
        }

        // Test Cyclist and Bike functionality
        console.log('\nTesting Cyclist and Bike...');
        const { Cyclist, Bike } = window.VirtualCyclist;

        const defaultCyclist = Cyclist.getDefault();
        console.log('Default cyclist:', defaultCyclist.toString());
        console.log(
            'Power-to-weight ratio:',
            defaultCyclist.getPowerToWeightRatio().toFixed(1),
            'W/kg'
        );
        console.log('Max brake deceleration:', defaultCyclist.getMaxBrakeMS2().toFixed(1), 'm/s²');
        console.log('Max speed:', defaultCyclist.getMaxSpeedMs().toFixed(1), 'm/s');
        console.log('Tan max angle:', defaultCyclist.getTanMaxAngle().toFixed(3));
        console.log(
            'Aerodynamic drag area (CdA):',
            defaultCyclist.getAerodynamicDragArea().toFixed(3),
            'm²'
        );

        const defaultBike = Bike.getDefault();
        console.log('\nDefault bike:', defaultBike.toString());
        console.log('Total wheel inertia:', defaultBike.getTotalInertia().toFixed(3), 'kg⋅m²');
        console.log('Wheel circumference:', defaultBike.getWheelCircumference().toFixed(3), 'm');
        console.log('Equivalent mass:', defaultBike.getEquivalentMass().toFixed(1), 'kg');
        console.log('Power at wheel (300W input):', defaultBike.getWheelPower(300).toFixed(1), 'W');

        // Test custom configurations
        const customCyclist = defaultCyclist.withModifications({
            power: 350,
            mKg: 75,
        });
        console.log(
            '\nCustom cyclist (350W, 75kg):',
            customCyclist.getPowerToWeightRatio().toFixed(1),
            'W/kg'
        );

        const customBike = defaultBike.withModifications({
            crr: 0.003,
            efficiency: 0.98,
        });
        console.log('Custom bike efficiency:', (customBike.efficiency * 100).toFixed(1), '%');

        // console.log(correctedPath.toGPX());
    } catch (error) {
        console.error('Demo failed:', error);
    }
}

// Run the demo
loadGPXDemo();
