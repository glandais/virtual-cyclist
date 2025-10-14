import type { Path } from '@lib/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { onUnmounted, type Ref, shallowRef, watch } from 'vue';
import type { HoverInfo } from './useHoverSync';

export function useMap(
    mapContainer: Ref<HTMLElement | null>,
    currentPath: Ref<Path | null>,
    hoveredInfo: Ref<HoverInfo | null>,
    onHoverChange: (index: number | null) => void
) {
    const mapInstance = shallowRef<L.Map | null>(null);
    const routeLayer = shallowRef<L.Polyline | null>(null);
    const hoverMarker = shallowRef<L.CircleMarker | null>(null);
    const hoverPopup = shallowRef<L.Popup | null>(null);
    let nearestPointCache: Array<{ lat: number; lon: number; index: number }> = [];

    const createMap = () => {
        if (!mapContainer.value || mapInstance.value) {
            return;
        }

        // Create map instance
        const map = L.map(mapContainer.value, {
            center: [0, 0],
            zoom: 13,
            zoomControl: true,
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
        }).addTo(map);

        // Create hover marker (initially hidden)
        const marker = L.circleMarker([0, 0], {
            radius: 8,
            fillColor: '#ff0000',
            color: '#ffffff',
            weight: 2,
            opacity: 0,
            fillOpacity: 0,
        }).addTo(map);

        // Create popup
        const popup = L.popup({
            closeButton: false,
            autoClose: false,
            closeOnClick: false,
        });

        mapInstance.value = map;
        hoverMarker.value = marker;
        hoverPopup.value = popup;

        // Handle map hover
        map.on('mousemove', handleMapHover);
        map.on('mouseout', () => onHoverChange(null));
    };

    const updateRoute = () => {
        if (!mapInstance.value || !currentPath.value) {
            return;
        }

        const path = currentPath.value;
        const pointCount = path.getPointCount();

        if (pointCount === 0) {
            return;
        }

        // Remove existing route
        if (routeLayer.value) {
            mapInstance.value.removeLayer(routeLayer.value);
        }

        // Build route coordinates
        const coordinates: L.LatLngExpression[] = [];
        nearestPointCache = [];

        for (let i = 0; i < pointCount; i++) {
            const lat = path.getLatitudeDeg(i);
            const lon = path.getLongitudeDeg(i);
            coordinates.push([lat, lon]);
            nearestPointCache.push({ lat, lon, index: i });
        }

        // Create route polyline
        const polyline = L.polyline(coordinates, {
            color: '#3388ff',
            weight: 3,
            opacity: 0.7,
        }).addTo(mapInstance.value);

        routeLayer.value = polyline;

        // Fit map to route bounds
        mapInstance.value.fitBounds(polyline.getBounds(), {
            padding: [50, 50],
        });
    };

    const updateHoverMarker = () => {
        if (!hoverMarker.value || !hoverPopup.value || !currentPath.value) {
            return;
        }

        if (!hoveredInfo.value) {
            // Hide marker and popup
            hoverMarker.value.setStyle({ opacity: 0, fillOpacity: 0 });
            hoverPopup.value.close();
            return;
        }

        const info = hoveredInfo.value;
        const path = currentPath.value;

        // Update marker position and show it
        hoverMarker.value.setLatLng([info.lat, info.lon]);
        hoverMarker.value.setStyle({ opacity: 1, fillOpacity: 0.8 });

        // Build popup content
        const elevation = path.getElevation?.(info.index) ?? null;
        const speed = path.getSpeed?.(info.index) ?? null;
        const distanceKm = (info.distance / 1000).toFixed(2);

        let content = `<strong>Distance:</strong> ${distanceKm} km<br/>`;
        if (elevation !== null) {
            content += `<strong>Elevation:</strong> ${elevation.toFixed(0)} m<br/>`;
        }
        if (speed !== null) {
            content += `<strong>Speed:</strong> ${(speed * 3.6).toFixed(1)} km/h`;
        }

        // Show popup
        hoverPopup.value
            .setLatLng([info.lat, info.lon])
            .setContent(content)
            .openOn(mapInstance.value!);
    };

    const handleMapHover = (e: L.LeafletMouseEvent) => {
        if (!currentPath.value || nearestPointCache.length === 0) {
            return;
        }

        // Find nearest point to cursor
        const mouseLatLng = e.latlng;
        let nearestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < nearestPointCache.length; i++) {
            const point = nearestPointCache[i];
            const distance =
                Math.pow(point.lat - mouseLatLng.lat, 2) + Math.pow(point.lon - mouseLatLng.lng, 2);

            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
            }
        }

        // Only trigger if within reasonable distance (about 50m at zoom 13)
        const threshold = 0.001; // roughly 100m
        if (minDistance < threshold) {
            onHoverChange(nearestIndex);
        } else {
            onHoverChange(null);
        }
    };

    const fitBounds = () => {
        if (!mapInstance.value || !routeLayer.value) {
            return;
        }

        // Fit map to route bounds
        mapInstance.value.fitBounds(routeLayer.value.getBounds(), {
            padding: [50, 50],
        });
    };

    const destroyMap = () => {
        if (mapInstance.value) {
            mapInstance.value.remove();
            mapInstance.value = null;
        }
        routeLayer.value = null;
        hoverMarker.value = null;
        hoverPopup.value = null;
        nearestPointCache = [];
    };

    // Watch for path changes and update route
    watch(currentPath, updateRoute);

    // Watch for hover changes and update marker
    watch(hoveredInfo, updateHoverMarker);

    // Cleanup on unmount
    onUnmounted(destroyMap);

    return {
        mapInstance,
        createMap,
        updateRoute,
        fitBounds,
        destroyMap,
    };
}
