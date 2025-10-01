# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript library (`@glandais/virtual-cyclist`) for simulating virtual cyclists on GPS routes using physics-based models. The library provides scientifically accurate power calculations, realistic speed constraints, and exercise physiology modeling. Supports both browser and Node.js environments through environment-specific implementations.

## Key Commands

### Development

```bash
npm run dev            # Development build and serve
npm run build          # Build library for both browser and Node.js
npm run typecheck      # Type checking with TypeScript
npm run lint           # Lint with ESLint
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format with Prettier
npm run check          # Run all quality checks
```

### Testing

```bash
npm test               # Run Jest tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

### Code Generation

```bash
npm run generate:point # Generate Point.ts and Path.ts accessor methods
```

## Code Generation System

This project uses **automatic code generation** for Point and Path classes to maintain consistency across 33 data fields. The generator ensures that adding or removing fields is safe and synchronized across all related code.

### Architecture

**Single Source of Truth:**

- `src/codegen/field-definitions.ts` - Defines all 33 fields with metadata
- `scripts/generate-point-path.ts` - Generator script using direct TypeScript output
- `src/types/path/Point.ts` - **AUTO-GENERATED** (⚠️ DO NOT EDIT MANUALLY)
- `src/types/path/Path.ts` - Partially generated accessor methods

**Generated Code:**

1. **Point.ts** (fully generated):
    - `PointField` enum with auto-incrementing indices
    - `Point` interface with readonly properties
    - `EMPTY_POINT` constant with NaN values
    - `FIELDS_PER_POINT` constant

2. **Path.ts** accessor methods (output for manual integration):
    - Getter/setter methods for all fields
    - `addPoint()` implementation
    - `getPointData()` implementation
    - `interpolatePoint()` implementation

### How to Add/Remove Fields

**Step 1: Update field definitions**

Edit `src/codegen/field-definitions.ts`:

```typescript
{
    name: 'MY_FIELD',           // Enum name (UPPER_SNAKE_CASE)
    prop: 'myField',            // Property name (camelCase)
    comment: 'My field description',
    unit: 'meters',             // Optional unit for documentation
    methodName: 'MyField',      // Optional: custom method name (e.g., getMyField)
    getDegrees: true,           // Optional: generate getDegrees variant
    setSpecial: 'date',         // Optional: special setter (Date | number)
    getSpecial: 'date',         // Optional: special getter (getAsDate)
}
```

**Update the category count:**

```typescript
{
    name: 'Speed & Motion',
    count: 4,  // ← Update this when adding/removing fields
    fields: [...]
}
```

**Step 2: Run the generator**

```bash
npm run generate:point
```

This will:

- Regenerate `Point.ts` completely
- Output Path.ts methods to console for review
- Run prettier formatting

**Step 3: Update Path.ts manually**

The generator outputs the Path.ts accessor methods to the console. You need to manually update Path.ts with:

- New getter/setter methods
- Updated `addPoint()` method
- Updated `getPointData()` method
- Updated `interpolatePoint()` method

**Step 4: Run tests**

```bash
npm run typecheck  # Verify TypeScript compilation
npm test           # Run all tests
```

### Field Definition Options

**Basic field:**

```typescript
{
    name: 'SPEED',
    prop: 'speed',
    comment: 'Current speed (m/s)',
    unit: 'm/s',
}
```

**Field with custom method name:**

```typescript
{
    name: 'LAT',
    prop: 'lat',
    comment: 'Latitude (radians)',
    methodName: 'Latitude',  // Generates getLatitude/setLatitude
}
```

**Field with degree conversion:**

```typescript
{
    name: 'LON',
    prop: 'lon',
    comment: 'Longitude (radians)',
    getDegrees: true,  // Generates getLongitudeDeg()
}
```

**Field with special handling:**

```typescript
{
    name: 'TIME',
    prop: 'time',
    comment: 'Timestamp (ms since epoch)',
    setSpecial: 'date',  // setTime(Date | number)
    getSpecial: 'date',  // getTimeAsDate(): Date
}
```

### Benefits of Code Generation

✅ **Single source of truth** - All field metadata in one place
✅ **Guaranteed synchronization** - Enum, interface, and constants always match
✅ **Easy field management** - Add/remove fields by editing one definition
✅ **Type safety** - TypeScript validates generated code
✅ **Zero runtime overhead** - Pure compile-time generation
✅ **Maintainability** - Reduces manual repetitive code by ~68%

### Important Notes

⚠️ **NEVER edit Point.ts manually** - It will be overwritten by the generator
⚠️ **Always update field counts** - Mismatched counts will cause validation errors
⚠️ **Run typecheck after generation** - Verify no TypeScript errors
⚠️ **Update tests** - Add test cases for new fields in Path.test.ts

## Architecture

### Core Module Structure

The library follows a modular architecture with clear separation of concerns:

- **VirtualCyclist** (`src/VirtualCyclist.ts`): Main API class coordinating simulation
- **GPXParser** (`src/gpx/GPXParser.ts`): Parse GPX files to internal format
- **GPXWriter** (`src/gpx/GPXWriter.ts`): Write simulation results to GPX
- **PowerComputer** (`src/physics/PowerComputer.ts`): Core physics engine for power calculations
- **MaxSpeedComputer** (`src/physics/MaxSpeedComputer.ts`): Cornering and braking constraints
- **ElevationProcessor** (`src/elevation/ElevationProcessor.ts`): Elevation correction using @glandais/elevation
- **HRSimulator** (`src/physiology/HRSimulator.ts`): Heart rate modeling
- **RouteOptimizer** (`src/optimizer/RouteOptimizer.ts`): Douglas-Peucker simplification

### Physics Models

#### Power Balance Equation

```
P_total = P_cyclist - P_resistances
```

Where resistances include:

- **Aerodynamic drag**: `P_aero = -0.5 * ρ * Cd * A * v³` (with wind adjustments)
- **Rolling resistance**: `P_roll = -cos(atan(grade)) * mass * g * speed * crr`
- **Gravity**: `P_grav = -sin(atan(grade)) * mass * g * speed`
- **Mechanical losses**: `P_bearings = -speed * (91 + 8.7 * speed) / 1000`

#### Equivalent Mass (includes rotational inertia)

```
M_eq = m + I_total / r²
```

#### Speed Integration

```
v_new = √(2ΔtP/M_eq + v_old²)
```

### Data Flow

1. User provides GPX data and cyclist parameters
2. GPXParser extracts track points with coordinates
3. ElevationProcessor corrects elevation using terrain tiles
4. MaxSpeedComputer calculates cornering/braking limits
5. PowerComputer performs time-stepping integration
6. HRSimulator generates heart rate data
7. RouteOptimizer simplifies track if requested
8. GPXWriter outputs enhanced GPX with simulation data

### Key Technical Details

**Numerical Integration:**

- Modified trapezoidal rule for energy conservation
- Adaptive time stepping for GPS waypoint alignment
- Default 1-second time steps for temporal consistency

**Coordinate Systems:**

- WGS84 for GPS coordinates
- Web Mercator for tile calculations
- Local Cartesian for physics calculations

**Default Parameters:**

- Cyclist mass: 80 kg (cyclist + bike)
- Power output: 250 W (recreational cyclist)
- Drag coefficient (Cd): 0.7
- Frontal area (A): 0.5 m²
- Rolling resistance (Crr): 0.004
- Max lean angle: 35°
- Max braking: 0.6g

### Testing Strategy

The project employs comprehensive testing following patterns from the elevation library.

#### Jest Unit Testing

- **Framework**: Jest with TypeScript support (`ts-jest`)
- **Environment**: jsdom for browser API simulation
- **Coverage**: 100% minimum threshold required
- **Structure**: Test files mirror `src/` directory structure

#### Testing Patterns

**Extended Test Class Pattern** for testing protected/private methods:

```typescript
class PowerComputerExtended extends PowerComputer {
    // Expose protected methods as public for testing
    public getEquivalentMass(course: Course): number {
        return super.getEquivalentMass(course);
    }

    // Expose private methods with different names
    public callGetDx(power: number, mass: number, speed: number, dt: number): number {
        const parent = Object.getPrototypeOf(Object.getPrototypeOf(this));
        return parent.getDx.call(this, power, mass, speed, dt);
    }
}
```

**Comprehensive Mocking Pattern**:

```typescript
jest.mock('@/elevation/ElevationProcessor');
const MockedElevationProcessor = ElevationProcessor as jest.MockedClass<typeof ElevationProcessor>;
```

### Important Constraints

1. **Zero Dependencies**: Browser builds must have zero runtime dependencies
2. **Node.js Optional**: Node.js dependencies must be optional and dynamically imported
3. **100% Coverage**: All features must have complete test coverage
4. **Type Safety**: No TypeScript errors allowed
5. **Performance**: Simulation must handle routes with 10,000+ points efficiently

## Feature Completion Requirements

**IMPORTANT: A feature is NOT considered complete until ALL of the following criteria are met:**

### Mandatory Completion Checklist

1. ✅ **Tests Written**: All new functionality has corresponding test cases
2. ✅ **Coverage 100%**: Must achieve 100% test coverage
3. ✅ **TypeScript**: No TypeScript errors (`npm run typecheck`)
4. ✅ **Linting**: No ESLint errors or warnings (`npm run lint`)
5. ✅ **Formatting**: Code properly formatted (`npm run format`)
6. ✅ **Build Success**: Distribution files build successfully (`npm run build`)
7. ✅ **Quality Check**: `npm run check` passes without errors

### Verification Command

Always run before considering any feature complete:

```bash
npm run check  # Must pass with 100% coverage and no errors/warnings
```

## Git Commit Guidelines

This project uses conventional commits with commitlint enforcement.

### Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

### Rules

1. Type must be one of the allowed types
2. Subject line under 100 characters
3. Use present tense and imperative mood
4. Body lines under 100 characters each

## Development Workflow

1. **Start**: Check existing tests and coverage
2. **Plan**: Design module with clear interfaces
3. **Test First**: Write tests before implementation
4. **Implement**: Write minimal code to pass tests
5. **Refactor**: Improve code while maintaining tests
6. **Document**: Update JSDoc and inline comments
7. **Verify**: Run `npm run check` for validation
8. **Commit**: Use conventional commit format

## Academic References

Key papers validating the physics models:

1. Martin, J.C., et al. (1998). "Validation of a mathematical model for road cycling power." Journal of Applied Biomechanics 14.3: 276-291.
2. Isvan, O. (2011). "Power Optimization for the Propulsion of Lightweight Vehicles." https://www.sheldonbrown.com/isvan/Power%20Management%20for%20Lightweight%20Vehicles.pdf
3. Standard physics references for energy conservation and dynamics

## Import Style and Module Organization

### Import Path Conventions

**Always use relative paths** - Never use absolute paths with `src/` prefix:

```typescript
// ✅ Correct
import { Path } from '../Path';
import { Course } from '../../types';

// ❌ Wrong
import { Path } from 'src/Path';
import { Course } from 'src/types';
```

**Prefer importing from index.ts** - Use parent folder's index.ts instead of deep relative paths:

```typescript
// ✅ Preferred
import { AeroPowerProvider } from '../aero';
import { PowerProvider } from '..';

// ⚠️ Acceptable but less maintainable
import { AeroPowerProvider } from '../aero/AeroPowerProvider';
import { PowerProvider } from '../PowerProvider';
```

### Index.ts Structure

**Every folder with multiple related files should have an index.ts** that serves as the public API for that module:

```
src/
  index.ts              # Main public API for package consumers
  physics/
    index.ts            # Re-exports MaxSpeedComputer + power module
    MaxSpeedComputer.ts
    power/
      index.ts          # Re-exports PowerComputer + submodules
      PowerComputer.ts
      aero/
        index.ts        # Re-exports AeroPowerProvider + submodules
        AeroPowerProvider.ts
        aero/
          index.ts      # Exports AeroProvider, AeroProviderConstant
          AeroProvider.ts
          AeroProviderConstant.ts
```

**Hierarchy Rules:**

- **Leaf folders**: Export their own public classes/types/interfaces
- **Parent folders**: Re-export from subfolders + own public items
- **src/index.ts**: The final public API exposed to package consumers

### Export Guidelines

**Selective exports only** - Export exactly what's needed, nothing more:

```typescript
// ✅ Correct - Selective exports
export { ClassName } from './ClassName';
export type { InterfaceName } from './types';
export { helperFunction } from './utils';

// ❌ Wrong - Over-exposes internals
export * from './types';
export * from './internals';
```

**Use `export type` for type-only exports** - Enables better tree-shaking:

```typescript
// ✅ Correct
export type { Point, Course, Cyclist } from './types';
export { PointField } from './types'; // Enum - runtime value

// ❌ Wrong
export { Point, Course, Cyclist } from './types'; // Types as values
```

**Example index.ts patterns:**

```typescript
// Leaf module (src/utils/index.ts)
export { Vector3D } from './Vector3D';

// Parent module (src/physics/index.ts)
export { MaxSpeedComputer } from './MaxSpeedComputer';
export type { MaxSpeedCourse } from './MaxSpeedComputer';
// Re-export from submodules
export { PowerComputer } from './power';

// Root module (src/index.ts)
export { Path } from './Path';
export type { Point, Course } from './types';
export { GPXParser, GPXWriter } from './gpx';
export { MaxSpeedComputer } from './physics';
```

### Type Organization

**Shared types** - Place in appropriate `types.ts` file:

- Top-level shared types → `src/types.ts`
- Domain-specific types → `src/domain/types.ts`
- Only export types that are part of the public API

**Type export patterns:**

```typescript
// types.ts - Define and export types
export interface Point {
    /* ... */
}
export interface Course {
    /* ... */
}

// index.ts - Re-export only public types
export type { Point, Course } from './types';
// Don't re-export internal types like PointWritable
```

## Best Practices

1. **Modularity**: Keep modules focused on single responsibilities
2. **Type Safety**: Use strict TypeScript types, avoid `any`
3. **Error Handling**: Graceful degradation with helpful error messages
4. **Performance**: Optimize for large GPS tracks (10,000+ points)
5. **Documentation**: Comprehensive JSDoc for all public APIs
6. **Testing**: Test edge cases, boundaries, and error conditions
7. **Consistency**: Follow existing patterns and conventions
8. **Import Hygiene**: Use relative paths and import from index.ts files
