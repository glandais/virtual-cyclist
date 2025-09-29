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

        // Test MaxSpeedComputer functionality
        console.log('\nTesting MaxSpeedComputer...');
        const { MaxSpeedComputer } = window.VirtualCyclist;

        const maxSpeedComputer = new MaxSpeedComputer();
        const course = {
            path: correctedPath,
            cyclist: defaultCyclist,
            bike: defaultBike,
        };

        console.log('Computing maximum speeds...');
        maxSpeedComputer.computeMaxSpeeds(course);
        console.log('Max speeds computed successfully! ✅');

        // Collect all speed values for analysis
        const allSpeeds = [];
        for (let i = 0; i < correctedPath.getPointCount(); i++) {
            allSpeeds.push(correctedPath.getSpeedMax(i));
        }

        // Statistical analysis
        const minSpeed = Math.min(...allSpeeds);
        const maxSpeed = Math.max(...allSpeeds);
        const avgSpeed = allSpeeds.reduce((a, b) => a + b) / allSpeeds.length;
        const uniqueSpeeds = [...new Set(allSpeeds.map(s => Math.round(s * 100) / 100))];

        console.log('\n🚀 MaxSpeedComputer Results Analysis:');
        console.log(`   Total points: ${allSpeeds.length}`);
        console.log(
            `   Speed range: ${minSpeed.toFixed(2)} - ${maxSpeed.toFixed(2)} m/s (${(minSpeed * 3.6).toFixed(1)} - ${(maxSpeed * 3.6).toFixed(1)} km/h)`
        );
        console.log(
            `   Average speed: ${avgSpeed.toFixed(2)} m/s (${(avgSpeed * 3.6).toFixed(1)} km/h)`
        );
        console.log(
            `   Unique speed values: ${uniqueSpeeds.length} (${uniqueSpeeds.length > 1 ? '✅ Varied speeds' : '❌ All same speed'})`
        );

        // Check for the old bug (all speeds = 2.00 m/s)
        const allSameSpeed = allSpeeds.every(speed => Math.abs(speed - 2.0) < 0.01);
        if (allSameSpeed) {
            console.log('   🚨 BUG DETECTED: All speeds are 2.00 m/s!');
        } else {
            console.log('   ✅ BUG FIXED: Speeds are properly varied!');
        }

        // Show sample speed calculations for first few points
        console.log('\nSample max speeds for first 5 points:');
        for (let i = 0; i < Math.min(5, correctedPath.getPointCount()); i++) {
            const point = correctedPath.getPointData(i);
            const speedMs = correctedPath.getSpeedMax(i);
            const speedKmh = speedMs * 3.6;
            const radius = point.radius;
            console.log(
                `Point ${i}: ${speedMs.toFixed(2)} m/s (${speedKmh.toFixed(1)} km/h), radius = ${radius.toFixed(1)}m`
            );
        }

        // console.log(correctedPath.toGPX());
    } catch (error) {
        console.error('Demo failed:', error);
    }
}

// Run the demo
loadGPXDemo();
