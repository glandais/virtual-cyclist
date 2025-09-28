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
        console.log(correctedPath.toGPX());
    } catch (error) {
        console.error('Demo failed:', error);
    }
}

// Run the demo
loadGPXDemo();
