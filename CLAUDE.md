# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Virtual Cyclist is a TypeScript library for simulating cycling physics and processing GPS/GPX data. It calculates realistic cycling speeds based on terrain, aerodynamics, rolling resistance, and cyclist/bike parameters.

## Build Commands

```bash
# Development
npm run dev              # Build and serve locally on port 3000
npm run dev:watch        # Watch mode for development
npm run dev:demo         # Run Vue demo app

# Build
npm run build            # Production build (no logging)
npm run build:dev        # Development build (with logging)
npm run build:demo       # Build demo application

# Quality checks
npm run check            # Full check (format + lint + typecheck + test + build for lib and demo)
npm run check:lib        # Check library only
npm run check:demo       # Check demo only

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report (80% threshold)

# Linting and formatting
npm run lint             # Lint library code
npm run lint:fix         # Auto-fix library linting issues
npm run lint:demo        # Lint demo code
npm run format           # Format all files with Prettier
npm run typecheck        # TypeScript type checking
npm run typecheck:demo   # Type check demo

# Code generation
npm run generate         # Regenerate Point.ts and Path.ts from field definitions
```

## Testing

- Run single test: `npm test -- <test-file-path>`
- Run tests matching pattern: `npm test -- -t "<test-name-pattern>"`
- Update snapshots: `npm test -- -u`
- Test framework: Jest with ts-jest
- Coverage thresholds: 80% for branches, functions, lines, and statements

## Architecture

### Code Generation System

**Critical**: `Point.ts` and `GeneratedPath.ts` are auto-generated files. Never edit them directly.

- Field definitions are in `src/codegen/field-definitions.ts`
- Generator script: `src/codegen/generate-point-path.ts`
- To modify point/path fields: edit `field-definitions.ts` → run `npm run generate`
- Generated files use chunked array storage for memory efficiency (31 numeric fields per point)

### Core Components

**Path Data Structure** (`src/types/path/`)

- `Point.ts` and `GeneratedPath.ts`: Auto-generated from field definitions
- `Path.ts`: Extends GeneratedPath with computed statistics and GPS bounds
- `AbstractPath.ts`: Base implementation for chunked array storage
- Uses ECEF (Earth-Centered Earth-Fixed) coordinates for 3D calculations

**Physics Engine** (`src/physics/`)

- `MaxSpeedComputer.ts`: Two-pass algorithm for safe cycling speeds
    - Forward pass: cornering limits using lean angle physics
    - Reverse pass: braking constraints
- `VirtualizeService.ts`: Simulates realistic cycling with power-based speed calculations
- Power providers (`src/physics/power/`):
    - Aerodynamics (drag, drafting, CdA)
    - Rolling resistance (tire, surface type)
    - Gravity (climbing/descending)
    - Wheel bearings friction

**GPX Processing** (`src/gpx/`)

- `GPXParser.ts`: Parse GPX XML files
- `GPXWriter.ts`: Write GPX files with extensions
- `ExtensionParser.ts`: Handle GPX extensions
- Supports Garmin extensions for power, cadence, temperature

**Path Processing** (`src/processing/`)

- `DouglasPeucker.ts`: 3D simplification using ECEF coordinates
- `EcefConverter.ts`: GPS ↔ ECEF transformations with elevation exaggeration
- `PointPerSecond.ts`: Resample paths to 1Hz for simulation

**Elevation** (`src/elevation/`)

- Uses `@glandais/elevation` package (mocked in tests)
- Elevation data fetching and interpolation

**Models** (`src/types/models/`)

- `Cyclist.ts`: Rider parameters (weight, max speed, power, lean angle)
- `Bike.ts`: Equipment parameters (weight, CdA, rolling resistance)
- `Course.ts`: Combines Path + Cyclist + Bike

### Module Path Aliases

```typescript
import { something } from '@/types/path'; // src/types/path
import { test } from '#/mocks/mock'; // test/mocks/mock
```

### Build System

- **Vite** for bundling with multiple output formats:
    - ES modules (`.esm.js`)
    - UMD (`.umd.js`)
    - IIFE minified (`.min.js`)
    - Node.js CJS/ESM (`.node.js`, `.node.mjs`)
- TypeScript declaration files generated with `vite-plugin-dts`
- Development vs Production builds controlled by `__DEV__` flag (see `vite.config.ts`)

### Demo Application

- Vue 3 application in `demo/` directory
- Chart.js for elevation/speed visualization
- Independent build system (separate package.json)
- Uses local library build via file reference

## Code Style

- TypeScript strict mode enabled
- ESLint with TypeScript plugin + Prettier integration
- Import organization via `prettier-plugin-organize-imports`
- Path aliases: `@/` → `src/`, `#/` → `test/`

## Git Workflow

- Conventional commits enforced via commitlint
- Husky pre-commit hooks run lint-staged
- Semantic versioning with semantic-release
- Auto-generates CHANGELOG.md

## Special Considerations

1. **Coordinate Systems**: The codebase uses both GPS (lat/lon/elevation) and ECEF for accurate 3D calculations. When working with geometry, prefer ECEF via `EcefConverter`.

2. **Memory Efficiency**: Point data uses chunked array storage (Float64Array) rather than objects. Access via generated getter/setter methods only.

3. **Physics Accuracy**: Speed calculations are based on real bicycle dynamics. Don't simplify formulas without validating against physics research.

4. **Logging**: Use `Logger.ts` which respects `__DEV__` flag. Production builds strip all logging code.

5. **Test Mocking**: `@glandais/elevation` is mocked in tests (see `test/__mocks__/`). Real elevation data requires external service.
