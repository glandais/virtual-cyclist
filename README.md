# 🚴‍♂️ Virtual Cyclist

A TypeScript library for realistic cycling simulations based on GPS data and physics. Analyzes GPX files, corrects elevation data, computes safe speeds, and simulates virtual cycling with accurate power models.

[![npm version](https://img.shields.io/npm/v/@glandais/virtual-cyclist.svg)](https://www.npmjs.com/package/@glandais/virtual-cyclist)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 📍 **GPX Parsing** - Read GPS tracks from Garmin, Strava, Amazfit, and other devices
- 🏔️ **Elevation Correction** - Fix GPS elevation data using external elevation services
- ⚡ **Physics-Based Speed Computation** - Calculate maximum safe speeds based on:
  - Cornering physics (lean angle limits)
  - Braking constraints (deceleration limits)
  - Terrain and gradient
- 🎮 **Virtual Cyclist Simulation** - Realistic cycling simulation with:
  - Aerodynamic drag (air density, CdA, drafting)
  - Rolling resistance (tire, surface type)
  - Gravity effects (climbing/descending)
  - Power-based speed calculations
- 🛠️ **Path Processing** - Douglas-Peucker simplification, resampling, ECEF coordinate transformations
- 📊 **Multi-Format Support** - ES modules, UMD, IIFE, Node.js (CJS/ESM)

## Installation

```bash
npm install @glandais/virtual-cyclist
```

## Quick Start

```typescript
import { GPXParser, Enhancer, Path } from '@glandais/virtual-cyclist';

// Parse a GPX file
const gpxContent = '<?xml version="1.0"?>...'; // Your GPX XML
const result = GPXParser.parse(gpxContent);
const path: Path = result.tracks[0];

console.log(`Loaded ${path.getPointCount()} points`);
console.log(`Distance: ${(path.getTotalDistance() / 1000).toFixed(1)} km`);

// Enhance with physics-based simulation
const enhancedPath = await Enhancer.enhancePath(path);

// Access computed data
for (let i = 0; i < enhancedPath.getPointCount(); i++) {
    console.log({
        lat: enhancedPath.getLatitudeDeg(i),
        lon: enhancedPath.getLongitudeDeg(i),
        elevation: enhancedPath.getElevation(i),
        speed: enhancedPath.getSpeed(i) * 3.6, // m/s to km/h
        distance: enhancedPath.getDistance(i),
    });
}
```

## Core API

### GPX Parsing

```typescript
import { GPXParser } from '@glandais/virtual-cyclist';

const result = GPXParser.parse(gpxXmlString);
const path = result.tracks[0];

// Access path data
path.getPointCount();              // Number of points
path.getTotalDistance();           // Total distance in meters
path.getTotalElevationGain();      // Total climbing in meters
path.getLatitudeDeg(index);        // Latitude in degrees
path.getLongitudeDeg(index);       // Longitude in degrees
path.getElevation(index);          // Elevation in meters
```

### Cyclist & Bike Models

```typescript
import { Cyclist, Bike } from '@glandais/virtual-cyclist';

// Use defaults (recreational cyclist, road bike)
const cyclist = Cyclist.getDefault();
// 80kg total mass, 280W power, 3.5 W/kg

const bike = Bike.getDefault();
// Road bike with 0.004 Crr, 700c wheels

// Or customize
const customCyclist = new Cyclist(
    75,      // mass (kg) - cyclist + bike
    300,     // power (watts)
    false,   // harmonics
    0.6,     // max brake (g)
    0.7,     // drag coefficient
    0.5,     // frontal area (m²)
    35,      // max lean angle (degrees)
    100      // max speed (km/h)
);
```

### Maximum Speed Computation

```typescript
import { MaxSpeedComputer, Cyclist, Bike } from '@glandais/virtual-cyclist';

const cyclist = Cyclist.getDefault();
const bike = Bike.getDefault();

MaxSpeedComputer.computeMaxSpeeds({
    path,
    cyclist,
    bike,
});

// Access computed maximum speeds
for (let i = 0; i < path.getPointCount(); i++) {
    const maxSpeed = path.getSpeedMax(i);
    const radius = path.getRadius(i);
    console.log(`Point ${i}: max ${(maxSpeed * 3.6).toFixed(1)} km/h, radius ${radius.toFixed(1)}m`);
}
```

### Virtual Cyclist Simulation

```typescript
import { VirtualizeService, Cyclist, Bike } from '@glandais/virtual-cyclist';
import {
    aeroProviderConstant,
    rhoProviderEstimate,
    windProviderNone,
    powerProviderConstant
} from '@glandais/virtual-cyclist';

const simulatedPath = VirtualizeService.virtualizeTrack({
    path,
    cyclist: Cyclist.getDefault(),
    bike: Bike.getDefault(),
    rhoProvider: rhoProviderEstimate,        // Air density
    aeroProvider: aeroProviderConstant,      // Aerodynamics
    windProvider: windProviderNone,          // Wind conditions
    cyclistPowerProvider: powerProviderConstant, // Power output
});

// Get realistic speed and power at each point
for (let i = 0; i < simulatedPath.getPointCount(); i++) {
    console.log({
        speed: simulatedPath.getSpeed(i) * 3.6,      // km/h
        power: simulatedPath.getPCyclistRaw(i),      // watts
        time: simulatedPath.getElapsed(i),           // seconds
    });
}
```

### Complete Enhancement Pipeline

```typescript
import { Enhancer } from '@glandais/virtual-cyclist';

// All-in-one: elevation correction + max speeds + simulation + simplification
const enhancedPath = await Enhancer.enhancePath(path);

// The enhanced path includes:
// - Corrected elevation data
// - Maximum safe speeds computed
// - Physics-based virtual cyclist simulation
// - Resampled to 1 point per second
// - Douglas-Peucker simplified (10m tolerance)
```

### Elevation Correction

```typescript
import { Elevation } from '@glandais/virtual-cyclist';

const correctedPath = await Elevation.fixElevation(path);

console.log(`Min elevation: ${correctedPath.getMinElevation()}m`);
console.log(`Max elevation: ${correctedPath.getMaxElevation()}m`);
console.log(`Elevation gain: ${correctedPath.getTotalElevationGain()}m`);
```

### Path Processing

```typescript
import { DouglasPeucker, PointPerSecond } from '@glandais/virtual-cyclist';

// Simplify path using Douglas-Peucker algorithm (3D with ECEF)
const simplified = DouglasPeucker.simplify(
    path,
    10,  // tolerance in meters
    3    // elevation exaggeration factor
);

// Resample to 1 point per second
const resampled = PointPerSecond.computeOnePointPerSecond(path);
```

## Physics Model

Virtual Cyclist uses scientifically validated physics models:

### Aerodynamic Drag
```
F_aero = 0.5 × ρ × CdA × v²
```
- Air density (ρ) varies with temperature and altitude
- CdA = drag coefficient × frontal area
- Supports drafting effects

### Rolling Resistance
```
F_rolling = Crr × N × cos(grade)
```
- Tire coefficient (Crr) ~0.004 for road bikes
- Normal force depends on mass and gradient

### Gravity
```
F_gravity = m × g × sin(grade)
```
- Positive when climbing, negative when descending

### Cornering Physics
```
v_max = √(g × radius × tan(max_lean_angle))
```
- Maximum lean angle: 35° (default)
- Turning radius computed from GPS geometry

### Braking Constraints
```
v_initial² = v_final² + 2 × a × distance
```
- Maximum deceleration: 0.6g (default)
- Ensures cyclist can brake safely

## Demo Application

An interactive Vue 3 demo is included at `demo/`:

### Features
- 📁 Load sample GPX files or upload your own
- 📈 Visualize elevation and speed profiles with Chart.js
- 🔧 Apply elevation correction
- ⚡ Compute maximum safe speeds based on physics
- 🎮 Full virtual cyclist enhancement
- ⚙️ Configure chart fields (elevation, speed, power, heart rate, cadence, etc.)
- 🔍 Interactive chart with zoom/pan

### Running the Demo

```bash
# Install dependencies
npm install
cd demo && npm install

# Run development server
npm run dev:demo

# Or build and serve
npm run build:demo
cd demo && npm run preview
```

The demo will be available at `http://localhost:5173` (or the port Vite assigns).

### Demo Screenshots

The demo provides:
1. **File Selection** - Choose from sample GPX files or upload your own
2. **Control Panel** - Apply enhancement operations:
   - Fix Elevation
   - Compute Max Speeds
   - Enhance Path (complete pipeline)
3. **Interactive Charts** - Visualize:
   - Elevation profile
   - Speed (actual, max, optimal)
   - Power output
   - Heart rate
   - Cadence
   - Temperature
   - And 30+ other data fields

### Sample GPX Files

The demo includes sample tracks from various devices:
- `sample.gpx` - General route
- `stelvio.gpx` - Famous alpine descent
- `amazfit.gpx` - Amazfit watch tracking
- `garmin.gpx` - Garmin device with power/cadence
- `movescount.gpx` - Suunto Movescount
- `sports-tracker.gpx` - Sports Tracker app
- `strava.gpx` - Strava export

## Architecture

### Data Structure

Virtual Cyclist uses **chunked array storage** for memory efficiency:
- Each point stores 31 numeric fields in Float64Array
- Fields include: lat, lon, elevation, speed, power, heart rate, cadence, etc.
- Access via generated getter/setter methods

### Coordinate Systems

- **GPS Coordinates** (lat/lon/elevation) for input/output
- **ECEF Coordinates** (Earth-Centered Earth-Fixed) for 3D geometry
- Accurate distance calculations using WGS-84 ellipsoid

### Code Generation

`Point.ts` and `GeneratedPath.ts` are auto-generated from field definitions:
```bash
# Modify field definitions
vim src/codegen/field-definitions.ts

# Regenerate files
npm run generate
```

## Build Formats

The library is distributed in multiple formats:

- **ES Module** (`index.esm.js`) - For modern bundlers
- **UMD** (`index.umd.js`) - Universal module definition
- **IIFE** (`index.min.js`) - Minified browser build
- **Node.js CJS** (`index.node.js`) - CommonJS for Node
- **Node.js ESM** (`index.node.mjs`) - ES modules for Node

TypeScript declarations included (`index.d.ts`).

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test
npm run test:coverage  # With coverage report

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run typecheck

# Build
npm run build          # Production (no logging)
npm run build:dev      # Development (with logging)

# Complete quality check
npm run check          # Format + lint + typecheck + test + build
```

## Browser Support

- Modern browsers with ES2020 support
- Node.js ≥18

## Credits

Based on the [gpx2web](https://github.com/glandais/gpx2web) Java project.

Physics models validated against academic cycling research and real-world data.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Please open an issue or pull request on [GitHub](https://github.com/glandais/virtual-cyclist).

## Links

- **GitHub**: https://github.com/glandais/virtual-cyclist
- **npm**: https://www.npmjs.com/package/@glandais/virtual-cyclist
- **Issues**: https://github.com/glandais/virtual-cyclist/issues
