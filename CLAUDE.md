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
jest.mock('../../src/elevation/ElevationProcessor');
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

## Best Practices

1. **Modularity**: Keep modules focused on single responsibilities
2. **Type Safety**: Use strict TypeScript types, avoid `any`
3. **Error Handling**: Graceful degradation with helpful error messages
4. **Performance**: Optimize for large GPS tracks (10,000+ points)
5. **Documentation**: Comprehensive JSDoc for all public APIs
6. **Testing**: Test edge cases, boundaries, and error conditions
7. **Consistency**: Follow existing patterns and conventions
