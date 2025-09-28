# @glandais/virtual-cyclist

TypeScript library for physics-based cycling simulation on GPS routes, providing scientifically accurate power calculations and realistic virtual cyclist modeling.

## Features

- **GPX Processing**: Parse and write GPX files with full track/route support
- **Elevation Correction**: High-precision elevation data using terrain tiles
- **Physics Engine**: Comprehensive power modeling based on academic research
    - Aerodynamic drag (including wind effects)
    - Rolling resistance with grade adjustment
    - Gravitational forces on inclines
    - Mechanical losses (bearings, drivetrain)
- **Performance Constraints**: Realistic speed limits based on cornering dynamics and braking physics
- **Exercise Physiology**: Heart rate modeling based on power output
- **Route Optimization**: Douglas-Peucker simplification for efficient processing

## Installation

```bash
npm install @glandais/virtual-cyclist
```

## Quick Start

```typescript
import { VirtualCyclist } from '@glandais/virtual-cyclist';

// Create a virtual cyclist
const cyclist = new VirtualCyclist({
    mass: 80, // kg (cyclist + bike)
    power: 250, // watts
    cda: 0.35, // aerodynamic coefficient
});

// Simulate a route
const result = await cyclist.simulate(gpxData, {
    fixElevation: true,
    smoothing: true,
    simplify: true,
});

// Access simulation results
console.log(result.distance); // Total distance in meters
console.log(result.duration); // Total time in seconds
console.log(result.averageSpeed); // Average speed in m/s
console.log(result.totalAscent); // Total elevation gain in meters
```

## Browser and Node.js Support

This library works in both browser and Node.js environments:

- **Browser**: Zero runtime dependencies, uses native APIs
- **Node.js**: Minimal optional dependencies for enhanced functionality

## Academic Foundation

Power calculations based on validated research:

- Martin et al. (1998) "Validation of a mathematical model for road cycling power"
- Standard physics equations for energy conservation and dynamics
- Real-world cycling data for model validation

## License

MIT

## Contributing

Contributions welcome! Please ensure all tests pass and maintain 100% coverage.

```bash
npm run check  # Run all quality checks
npm test       # Run test suite
```
