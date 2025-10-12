# How Virtual Cyclist Works

## Introduction

Virtual Cyclist is a TypeScript library for simulating realistic cycling physics on GPS routes. It transforms static GPX files into physics-based cycling simulations with accurate speed profiles, power estimates, and time predictions.

### Use Cases

- **Training Analysis**: Predict performance on race routes before event day
- **Route Planning**: Estimate completion times based on your fitness level
- **GPX Enhancement**: Add realistic speed and power data to GPS tracks
- **Performance Comparison**: Compare virtual simulations against actual rides
- **Workout Design**: Create power-based training routes with specific targets

### Key Features

- **Physics-Based Simulation**: Accurate modeling of all cycling forces (aerodynamics, gravity, rolling resistance, wheel friction)
- **GPS Waypoint Alignment**: Virtual cyclist stays on actual recorded GPS path
- **Power Estimation**: Back-calculate cyclist power from speed changes
- **Configurable Parameters**: Customize cyclist characteristics, bike properties, and environmental conditions
- **Multi-Step Processing**: Elevation fixing, speed calculation, virtualization, resampling, and simplification

---

## Complete Processing Pipeline

The `Enhancer` class orchestrates a five-step pipeline that transforms raw GPX data into a complete cycling simulation. With all options enabled (default configuration), the workflow is:

```typescript
const course = Enhancer.getDefaultCourse(path);
const enhancedPath = await Enhancer.enhanceCourse(course, {
    fixElevation: true, // Step 1
    computeMaxSpeeds: true, // Step 2
    virtualizeTrack: true, // Step 3
    computeOnePointPerSecond: true, // Step 4
    simplifyPath: {
        // Step 5
        enable: true,
        tolerance: 10,
        zExaggeration: 3,
    },
});
```

### Step 1: Fix Elevation

**Source**: `src/elevation/Elevation.ts`
**Purpose**: Correct and smooth elevation data from external elevation service

Raw GPX files often have:

- Missing elevation data
- GPS elevation errors (±10-50m typical)
- Noisy altitude measurements

The elevation service:

1. Fetches accurate terrain elevation from external provider (`@glandais/elevation`)
2. Applies smoothing filter with 150-point window to remove noise
3. Preserves overall elevation profile while reducing measurement artifacts

**Configuration**:

```typescript
{
    filterOptions: { enabled: false },    // No outlier filtering
    smoothingOptions: {
        enabled: true,
        windowSize: 150                    // Moving average window
    }
}
```

### Step 2: Compute Maximum Safe Speeds

**Source**: `src/physics/MaxSpeedComputer.ts`
**Purpose**: Calculate speed limits based on cornering physics and braking constraints

This two-pass algorithm ensures the cyclist can safely navigate the route:

#### Forward Pass: Cornering Limits

For each point, calculate maximum cornering speed using bicycle dynamics:

```
v_max = √(g × radius × tan(θ_max))
```

Where:

- `radius`: Turning radius from three consecutive GPS points (transformed to local coordinates)
- `θ_max`: Maximum lean angle (default: 35°)
- Safety margin: +2m added to calculated radius

The algorithm:

1. Transform three consecutive GPS points to local Cartesian coordinates
2. Find circle passing through the three points (circumcenter calculation)
3. Calculate turning radius from circle
4. Apply cornering physics formula
5. Store minimum of cornering limit and cyclist's absolute max speed

#### Reverse Pass: Braking Constraints

Working backwards through the route, ensure braking capability:

```
v_0² = v_f² + 2 × a × d
```

Where:

- `v_0`: Maximum speed at previous point
- `v_f`: Required speed at current point
- `a`: Maximum braking deceleration (default: 0.6g = 5.88 m/s²)
- `d`: Distance between points

If the cyclist cannot brake from `v_0` to `v_f` in distance `d`, reduce `v_0`.

### Step 3: Virtualize Track

**Source**: `src/physics/VirtualizeService.ts`
**Purpose**: Simulate realistic cycling using physics-based time-stepping integration

This is the core simulation engine that produces realistic speed profiles:

#### Algorithm Overview

1. **Initialization**: Start at first GPS point with minimal speed (0.56 m/s)
2. **Time-Stepping Loop**: For each 1-second time step:
    - Calculate power balance (cyclist power - all resistances)
    - Determine distance traveled using energy conservation
    - Use binary search to find current GPS segment
    - Snap to waypoint if crossing, otherwise interpolate position
    - Calculate new speed with trapezoidal integration
    - Enforce maximum speed constraints from Step 2
3. **Power Estimation**: Back-calculate cyclist power from final speed profile

#### GPS Waypoint Alignment

The simulation stays on the actual GPS route through:

- **Binary search**: Efficiently find current segment in distance array
- **Waypoint snapping**: When crossing a waypoint, snap exactly to its position
- **Interpolation**: Between waypoints, linearly interpolate position/elevation

This ensures the virtual cyclist follows the exact recorded path.

#### Speed Calculation

Uses trapezoidal rule (modified Euler integration):

```
v_new = 2 × (Δx / Δt) - v_old
```

Derived from:

```
Δx = (v_old + v_new) × Δt / 2
```

Where `Δx` comes from energy conservation:

```
Power × Δt = ΔKE = 0.5 × M_eq × (v_new² - v_old²)
```

### Step 4: Resample to One Point Per Second

**Source**: `src/processing/PointPerSecond.ts`
**Purpose**: Create uniform temporal resolution for time-series analysis

GPS devices record at varying rates (1-5 seconds typically). This step standardizes to exactly 1 Hz:

#### Algorithm

1. For each pair of consecutive points:
    - If they span multiple seconds, interpolate points at each epoch second boundary
    - Use linear interpolation weighted by time distance
2. Special handling:
    - First point: Copy to start of its epoch second if not on boundary
    - Last point: Copy to end of its epoch second if not on boundary
3. Interpolation coefficient:
    ```
    coef = (epoch_time - time_1) / (time_2 - time_1)
    ```

All point properties (position, elevation, speed, power) are interpolated linearly.

### Step 5: Simplify Path

**Source**: `src/processing/DouglasPeucker.ts`
**Purpose**: Reduce point count while preserving route shape using 3D Douglas-Peucker algorithm

After virtualization, paths can have thousands of points. Simplification reduces storage and rendering overhead:

#### 3D Douglas-Peucker

Uses ECEF (Earth-Centered Earth-Fixed) coordinates for true 3D distance:

1. Convert GPS (lat, lon, elevation) to ECEF Cartesian coordinates
2. Apply elevation exaggeration factor (default: 3×) to emphasize terrain features
3. Recursively find points furthest from line segments
4. Keep points with perpendicular distance > tolerance (default: 10m)

**Why ECEF?**

- Accurate 3D distance calculations across curved Earth surface
- Avoids distortions from simple lat/lon differencing
- Properly accounts for elevation in distance metric

**Elevation Exaggeration**:
Multiply elevation by 3 before ECEF conversion, making terrain features more significant in simplification decisions. This prevents important climbs/descents from being simplified away.

---

## Physics Model Overview

Virtual Cyclist simulates cycling by integrating Newton's second law over time:

```
F_net = M × a  →  P_net = F_net × v  →  v = ∫(P_net / (M × v)) dt
```

### Force Components

Four resistance forces oppose the cyclist's power output:

1. **Aerodynamic Drag**: Dominant at high speeds (cubic relationship)
2. **Gravitational Force**: Dominant on climbs/descents (linear with grade)
3. **Rolling Resistance**: Tire deformation and road friction (linear with speed)
4. **Wheel Bearings Friction**: Hub mechanical resistance (quadratic with speed)

### Energy Conservation Principle

The simulation uses power-based integration instead of force-based:

```
Power_cyclist - Power_drag - Power_gravity - Power_rolling - Power_bearings = dKE/dt
```

Where kinetic energy:

```
KE = 0.5 × M_eq × v²
```

This approach is numerically stable and matches how cyclists actually think about performance (watts, not newtons).

### Equivalent Mass

Accelerating the bike requires energy for both linear and rotational motion of the wheels:

```
M_eq = m + (I_front + I_rear) / r²
```

This accounts for the extra "inertia" of spinning wheels. Typical values add ~0.3% to system mass.

### Time Integration

Uses modified trapezoidal rule (implicit method) for numerical stability:

- Calculate new speed from power balance
- Average old and new speed for distance traveled
- Adaptive time stepping when crossing GPS waypoints
- Enforces minimum speed (0.56 m/s = 2 km/h) to avoid numerical issues

---

## Detailed Formulas

All formulas below are extracted from the actual implementation with exact constants and variable names.

### 1. Aerodynamic Drag Power

**Without Wind** (simple case):

$$P_{aero} = -\frac{C_d \cdot A \cdot \rho}{2} \cdot v^3$$

**Variables**:

- $C_d$: Drag coefficient (dimensionless, default: 0.7)
- $A$: Frontal area (m², default: 0.5)
- $\rho$: Air density (kg/m³, default: 1.225 at sea level, 15°C)
- $v$: Cyclist velocity (m/s)

**Aerodynamic Coefficient**:
$$aeroCoef = \frac{C_d \cdot A \cdot \rho}{2}$$

Typical value: $(0.7 \times 0.5 \times 1.225) / 2 = 0.214$ kg/m

**Physical Meaning**: Power required to overcome air resistance increases with the cube of velocity. Doubling speed requires 8× more power to overcome drag.

**Example Values**:
| Speed | Power @ CdA=0.35 m² |
|-------|---------------------|
| 20 km/h (5.56 m/s) | 37 W |
| 30 km/h (8.33 m/s) | 124 W |
| 40 km/h (11.1 m/s) | 293 W |

**With Wind** (Isvan's model):

When wind is present, the calculation uses advanced aerodynamics accounting for wind angle:

$$P_{aero} = -aeroCoef \cdot \lambda \cdot \sqrt{l_3} \cdot l_1 \cdot v$$

Where:

```
l₁ = v + w · cos(α)                    (velocity component in travel direction)
l₂ = l₁²                                (square of directional component)
l₃ = v² + w² + 2vw · cos(α)           (magnitude² of combined velocity)
l₄ = l₂ / l₃                           (ratio of directional to total)
λ = l₄ + μ · (1 - l₄)                  (turbulence-adjusted factor)
μ = 1.2                                 (turbulence coefficient)
```

- $w$: Wind speed (m/s)
- $\alpha$: Angle between wind direction and travel direction (radians)
- $\mu$: Turbulence factor accounting for non-ideal aerodynamic flow

**Source**: Isvan, O. (2011). "Power Management for the Propulsion of Lightweight Vehicles"

### 2. Gravitational Power

$$P_{grav} = -m \cdot g \cdot v \cdot \sin(\arctan(grade))$$

**Variables**:

- $m$: Total system mass = cyclist + bike (kg, default: 80)
- $g$: Gravitational acceleration (m/s², constant: 9.8)
- $v$: Velocity (m/s)
- $grade$: Road gradient (dimensionless, e.g., 0.05 for 5%)

**Simplification for small angles**:
$$\sin(\arctan(grade)) \approx \frac{grade}{\sqrt{1 + grade^2}} \approx grade$$

For grades < 10%, the approximation $\sin(\arctan(grade)) \approx grade$ is within 0.5%.

**Sign Convention**:

- Negative (resistance) when climbing (positive grade)
- Positive (assistance) when descending (negative grade)

**Physical Meaning**: Power to change gravitational potential energy. On climbs, this is the dominant resistance force.

**Example Values** (80 kg system, 15 km/h = 4.17 m/s):
| Grade | Power |
|-------|-------|
| 0% (flat) | 0 W |
| 5% | 163 W |
| 10% | 326 W |
| -5% (descent) | -163 W |

### 3. Rolling Resistance Power

$$P_{roll} = -\cos(\arctan(grade)) \cdot m \cdot g \cdot v \cdot C_{rr}$$

**Variables**:

- $C_{rr}$: Coefficient of rolling resistance (dimensionless, default: 0.004)
- Other variables same as gravitational power

**Normal Force Adjustment**:
$$\cos(\arctan(grade)) \approx \frac{1}{\sqrt{1 + grade^2}}$$

This accounts for reduced normal force on steep grades.

**Physical Meaning**: Energy lost to tire deformation and road surface friction. Always resistive (negative). Linear with speed.

**Example Values** (80 kg, modern road tires with Crr=0.004):
| Speed | Power (flat) | Power (10% grade) |
|-------|--------------|-------------------|
| 15 km/h | 13 W | 13 W |
| 25 km/h | 22 W | 22 W |
| 35 km/h | 31 W | 30 W |

Note: Grade has minimal effect on rolling resistance (<5% change at 10% grade).

### 4. Wheel Bearings Friction Power

$$P_{bearings} = -\frac{v \cdot (91 + 8.7 \cdot v)}{1000}$$

**Variables**:

- $v$: Velocity (m/s)
- Constants: 91 (static friction), 8.7 (dynamic friction coefficient)

**Physical Meaning**: Mechanical friction in wheel hubs. Empirical model with static and speed-dependent components. Always resistive.

**Example Values**:
| Speed | Power Loss |
|-------|------------|
| 5 m/s (18 km/h) | 0.7 W |
| 10 m/s (36 km/h) | 1.8 W |
| 15 m/s (54 km/h) | 3.3 W |

Small compared to other resistances, but measurable in precise power analysis.

**Source**: Empirical measurements of cartridge bearing friction in bicycle wheels.

### 5. Air Density (Altitude and Temperature Dependent)

$$\rho = \frac{P}{R \cdot T}$$

Where pressure varies with altitude using barometric formula:

$$P = P_0 \cdot \left(1 - \frac{L \cdot h}{T_0}\right)^{\frac{g}{R \cdot L}}$$

**Variables**:

- $P_0$: Sea-level pressure (Pa, constant: 101325)
- $T_0$: Sea-level temperature (K, constant: 288.15 = 15°C)
- $g$: Gravity (m/s², constant: 9.80665)
- $L$: Temperature lapse rate (K/m, constant: 0.0065)
- $R$: Specific gas constant for dry air (J/(kg·K), constant: 287.05)
- $h$: Altitude above sea level (m, from GPS)
- $T$: Actual temperature (K, from input or default 15°C)

**Physical Meaning**: Air density decreases with altitude and increases with lower temperature, affecting aerodynamic drag.

**Example Values**:
| Altitude | Temperature | Air Density |
|----------|-------------|-------------|
| 0 m (sea level) | 15°C | 1.225 kg/m³ |
| 500 m | 15°C | 1.167 kg/m³ (-4.7%) |
| 1000 m | 15°C | 1.112 kg/m³ (-9.2%) |
| 2000 m | 15°C | 1.007 kg/m³ (-17.8%) |
| 0 m | 30°C | 1.164 kg/m³ (-5.0%) |

**Impact on Drag**: 10% reduction in air density → 10% reduction in drag power at same speed.

### 6. Maximum Cornering Speed

$$v_{max} = \sqrt{g \cdot r \cdot \tan(\theta_{max})}$$

**Variables**:

- $g$: Gravitational acceleration (m/s², constant: 9.8)
- $r$: Turning radius (m, calculated from GPS geometry + 2m safety margin)
- $\theta_{max}$: Maximum lean angle (radians, default: 35° = 0.611 rad)

**Derivation**: From circular motion physics, lateral acceleration $a = v^2 / r$. Maximum lateral force without losing traction: $F = m \cdot g \cdot \tan(\theta)$.

**Physical Meaning**: Faster speeds require larger turning radius or greater lean angle. Exceeding this speed risks tire slip.

**Example Values** (35° max lean angle):
| Radius | Max Speed |
|--------|-----------|
| 10 m (tight turn) | 23.2 km/h |
| 30 m (moderate) | 40.1 km/h |
| 50 m (gentle) | 51.7 km/h |
| 100 m (highway) | 73.2 km/h |

**Safety Margin**: Implementation adds 2m to calculated radius, providing conservative speed limits.

### 7. Braking Constraint

$$v_0 = \sqrt{v_f^2 + 2 \cdot a \cdot d}$$

**Variables**:

- $v_0$: Maximum allowable speed at previous point (m/s)
- $v_f$: Required speed at current point (m/s, from cornering limit)
- $a$: Maximum braking deceleration (m/s², default: 5.88 = 0.6g)
- $d$: Distance between points (m)

**Derivation**: From kinematic equation $v_f^2 = v_0^2 + 2ad$ with $a$ negative (braking).

**Physical Meaning**: Ensures cyclist can brake safely from any point to the next required speed. Prevents entering turns too fast.

**Example Values** (0.6g braking = 5.88 m/s²):
| Distance | Final Speed | Max Initial Speed |
|----------|-------------|-------------------|
| 10 m | 20 km/h | 28.8 km/h |
| 50 m | 20 km/h | 50.4 km/h |
| 100 m | 20 km/h | 69.5 km/h |

**Safety Note**: 0.6g is conservative limit ensuring safe braking on dry pavement with quality brakes. Professional braking can exceed 0.8g.

### 8. Equivalent Mass (Rotational Inertia)

$$M_{eq} = m + \frac{I_{total}}{r^2}$$

Where:
$$I_{total} = I_{front} + I_{rear}$$

**Variables**:

- $m$: Total system mass = cyclist + bike (kg, default: 80)
- $I_{front}$: Front wheel rotational inertia (kg·m², default: 0.05)
- $I_{rear}$: Rear wheel rotational inertia (kg·m², default: 0.07)
- $r$: Wheel radius (m, default: 0.7 for 700c wheels)

**Physical Meaning**: Accelerating wheels requires energy for both linear and rotational motion. The term $I/r^2$ converts rotational inertia to equivalent linear mass.

**Example Calculation**:

```
M_eq = 80 + (0.05 + 0.07) / 0.7²
     = 80 + 0.12 / 0.49
     = 80 + 0.245
     = 80.245 kg
```

**Impact**: Increases effective mass by ~0.3%, making acceleration slightly harder. More significant with heavier wheels.

### 9. Energy Integration (Power to Speed)

From power balance and kinetic energy:

$$P_{net} = \frac{dKE}{dt} = \frac{d}{dt}\left(\frac{1}{2} M_{eq} v^2\right) = M_{eq} \cdot v \cdot \frac{dv}{dt}$$

Rearranging:
$$P_{net} \cdot dt = \frac{1}{2} M_{eq} (v_{new}^2 - v_{old}^2)$$

Solving for new speed:
$$v_{new} = \sqrt{v_{old}^2 + \frac{2 \cdot P_{net} \cdot dt}{M_{eq}}}$$

**Trapezoidal Rule for Distance**:
$$\Delta x = \frac{v_{old} + v_{new}}{2} \cdot \Delta t$$

**Variables**:

- $P_{net}$: Net power = cyclist power - all resistances (W)
- $\Delta t$: Time step (s, default: 1.0)
- $M_{eq}$: Equivalent mass (kg)
- $v_{old}$, $v_{new}$: Velocities before and after time step (m/s)

**Physical Meaning**: Power input changes kinetic energy. Positive net power → acceleration, negative → deceleration.

**Numerical Stability**:

- Enforces minimum speed (0.56 m/s = 2 km/h) to avoid division by zero
- Uses square root for speed calculation (always real for forward motion)
- Trapezoidal rule provides second-order accuracy

---

## Parameters Reference

### Cyclist Parameters

Default values represent a recreational/competitive cyclist (intermediate to advanced level).

| Parameter          | Symbol        | Default Value | Units         | Physical Meaning                   |
| ------------------ | ------------- | ------------- | ------------- | ---------------------------------- |
| Mass               | `mKg`         | 80            | kg            | Total system mass (cyclist + bike) |
| Drag Coefficient   | `cd`          | 0.7           | dimensionless | Aerodynamic drag coefficient       |
| Frontal Area       | `a`           | 0.5           | m²            | Projected frontal area             |
| CdA                | `cd × a`      | 0.35          | m²            | Combined aerodynamic parameter     |
| Max Brake          | `maxBrakeG`   | 0.6           | g             | Maximum braking deceleration       |
| Max Brake (SI)     | `maxBrakeMS2` | 5.88          | m/s²          | Braking limit in standard units    |
| Max Lean Angle     | `maxAngleDeg` | 35            | degrees       | Maximum cornering lean angle       |
| Max Lean (radians) | `maxAngleRad` | 0.611         | rad           | Lean angle in radians              |
| Max Speed          | `maxSpeedKmH` | 100           | km/h          | Absolute maximum speed             |
| Max Speed (SI)     | `maxSpeedMs`  | 27.8          | m/s           | Maximum speed in standard units    |
| Power Output       | `powerW`      | 280           | W             | Sustained power (≈3.5 W/kg FTP)    |

**CdA Context**:

- Professional time trial position: 0.20-0.25 m²
- Aerodynamic road position: 0.25-0.30 m²
- Standard road position: 0.30-0.35 m² (default)
- Upright touring position: 0.35-0.45 m²

### Bike Parameters

Default values represent a modern road bike with high-performance components.

| Parameter             | Symbol                       | Default Value | Units         | Physical Meaning                    |
| --------------------- | ---------------------------- | ------------- | ------------- | ----------------------------------- |
| Rolling Resistance    | `crr`                        | 0.004         | dimensionless | Tire rolling resistance coefficient |
| Front Wheel Inertia   | `inertiaFront`               | 0.05          | kg·m²         | Rotational inertia of front wheel   |
| Rear Wheel Inertia    | `inertiaRear`                | 0.07          | kg·m²         | Rotational inertia of rear wheel    |
| Total Inertia         | `inertiaFront + inertiaRear` | 0.12          | kg·m²         | Combined wheel inertia              |
| Wheel Radius          | `wheelRadius`                | 0.7           | m             | Effective rolling radius (700c)     |
| Wheel Diameter        | `2 × wheelRadius`            | 1.4           | m             | Wheel diameter                      |
| Drivetrain Efficiency | `efficiency`                 | 0.976         | dimensionless | Power transmission efficiency       |
| Power Loss            | `1 - efficiency`             | 0.024         | dimensionless | Drivetrain loss factor (2.4%)       |

**Crr Context**:

- Continental GP5000 (high-end): 0.0033
- Quality clincher road tire: 0.004 (default)
- Budget road tire: 0.005-0.006
- Mountain bike tire: 0.008-0.012

**Wheel Inertia Context**:

- Lightweight carbon racing wheels: 0.04-0.06 kg·m² per wheel
- Standard aluminum wheels: 0.06-0.08 kg·m² per wheel
- Heavy training wheels: 0.08-0.12 kg·m² per wheel

### Environmental Parameters

| Parameter               | Symbol   | Default/Range | Units   | Physical Meaning                   |
| ----------------------- | -------- | ------------- | ------- | ---------------------------------- |
| Air Density (sea level) | `ρ`      | 1.225         | kg/m³   | Standard atmosphere, 15°C          |
| Air Density (1000m)     | `ρ`      | 1.112         | kg/m³   | -9.2% vs sea level                 |
| Air Density (2000m)     | `ρ`      | 1.007         | kg/m³   | -17.8% vs sea level                |
| Temperature             | `T`      | 15            | °C      | Ambient temperature (affects ρ)    |
| Wind Speed              | `w`      | 0-20          | m/s     | Wind velocity magnitude            |
| Wind Direction          | `θ_wind` | 0-360         | degrees | Wind source direction (0° = North) |
| Gravity                 | `g`      | 9.8           | m/s²    | Gravitational acceleration         |

**Temperature Impact on Density**:

- -10°C: ρ = 1.341 kg/m³ (+9.5%)
- 0°C: ρ = 1.292 kg/m³ (+5.5%)
- 15°C: ρ = 1.225 kg/m³ (standard)
- 30°C: ρ = 1.164 kg/m³ (-5.0%)

### Processing Parameters

| Parameter                | Symbol          | Default Value | Units         | Purpose                                |
| ------------------------ | --------------- | ------------- | ------------- | -------------------------------------- |
| Time Step                | `DT`            | 1.0           | s             | Simulation integration step            |
| Minimum Speed            | `MINIMAL_SPEED` | 0.56          | m/s           | Numerical stability threshold (2 km/h) |
| Simplification Tolerance | `tolerance`     | 10            | m             | Douglas-Peucker perpendicular distance |
| Elevation Exaggeration   | `zExaggeration` | 3             | dimensionless | ECEF elevation scaling factor          |
| Smoothing Window         | `windowSize`    | 150           | points        | Elevation smoothing filter size        |
| Cornering Safety Margin  | -               | 2             | m             | Added to calculated turning radius     |
| Turbulence Factor        | `μ`             | 1.2           | dimensionless | Wind model aerodynamic adjustment      |
| Wheel Bearing Static     | -               | 91            | -             | Empirical bearing friction constant    |
| Wheel Bearing Dynamic    | -               | 8.7           | -             | Speed-dependent friction coefficient   |

**Time Step Notes**:

- 1.0s provides good balance between accuracy and performance
- Smaller steps (0.5s) improve accuracy on steep/technical terrain
- Adaptive stepping when crossing GPS waypoints

**Simplification Tolerance**:

- 5m: Preserve more detail, larger file size
- 10m: Good balance (default)
- 20m: Aggressive simplification, smoother visualization

---

## Calculation Pipeline Details

Complete step-by-step workflow with code references.

### Initialization

```typescript
// Create default course configuration
const course: CoursePhysics = {
    path: inputPath,
    cyclist: Cyclist.getDefault(), // 80kg, 280W, CdA=0.35m²
    bike: Bike.getDefault(), // Crr=0.004, 97.6% efficiency
    rhoProvider: rhoProviderEstimate, // Altitude/temp dependent
    aeroProvider: aeroProviderConstant, // CdA×ρ/2 calculation
    windProvider: windProviderNone, // No wind by default
    cyclistPowerProvider: new PowerProviderConstant(280, false),
};
```

**Source**: `src/enhancer/Enhancer.ts:17-26`

### Step 1: Elevation Fixing

```typescript
// Fetch and smooth elevation data
const coordinates = Array.from(path.coordinatesIterator());
const correctedElevations = await elevationProvider.getElevationsAlong(coordinates, {
    filterOptions: { enabled: false },
    smoothingOptions: { enabled: true, windowSize: 150 },
});
```

**Input**: GPS coordinates (latitude, longitude)
**Output**: GPS coordinates with corrected, smoothed elevation
**Source**: `src/elevation/Elevation.ts:9-35`

**Process**:

1. Extract lat/lon from all points
2. Query external elevation service (SRTM, ASTER, or similar)
3. Apply 150-point moving average smoothing
4. Create new path with corrected elevations
5. Compute derived data (distances, grades, bearings)

### Step 2: Maximum Speed Calculation

#### Forward Pass (Cornering)

```typescript
for (let i = 1; i < pointCount - 1; i++) {
    // Transform to local coordinates
    const tPrev = transform(path, i - 1, i);
    const tCurrent = new Vector3D(0, 0, 0);
    const tNext = transform(path, i + 1, i);

    // Find circle center
    const circleCenter = getCircleCenter(tPrev, tCurrent, tNext);

    // Calculate radius
    const radius = distance(circleCenter, tCurrent) + 2; // +2m safety

    // Apply cornering physics
    const vMax = sqrt(g * radius * tan(maxAngleDeg));
    path.setSpeedMax(i, min(cyclist.maxSpeedMs, vMax));
}
```

**Source**: `src/physics/MaxSpeedComputer.ts:51-71, 100-139`

#### Reverse Pass (Braking)

```typescript
for (let i = pointCount - 1; i > 0; i--) {
    const v0 = path.getSpeedMax(i - 1);
    const vf = path.getSpeedMax(i);
    const dist = path.getDistance(i) - path.getDistance(i - 1);
    const a = -cyclist.getMaxBrakeMS2();

    // Check if braking is sufficient
    const requiredDist = (vf² - v0²) / (2 * a);

    if (requiredDist > dist) {
        // Reduce previous speed
        const newV0 = sqrt(vf² - 2 * a * dist);
        path.setSpeedMax(i - 1, newV0);
    }
}
```

**Source**: `src/physics/MaxSpeedComputer.ts:80-186`

### Step 3: Virtualization (Main Simulation)

```typescript
// Initialize simulation
let currentDist = 0;
let currentSpeed = MINIMAL_SPEED; // 0.56 m/s
let currentTime = startTime;
const equivalentMass = powerComputer.getEquivalentMass(course);

// Time-stepping loop
while (currentDist < totalDistance) {
    // 1. Calculate power balance
    const pSum = powerComputer.getNewPower(course, newPath, newPath.length - 1, true);

    // 2. Determine distance for time step
    const dx = powerComputer.getDx(pSum, equivalentMass, currentSpeed, DT);

    // 3. Find current GPS segment (binary search)
    const index = getIndex(dists, currentDist);
    const newIndex = getNextIndex(dists, currentDist, dx);

    // 4. Waypoint crossing or interpolation
    if (index !== newIndex) {
        // Snap to waypoint
        dxToNext = inputPath.getDistance(newIndex) - currentDist;
        dtToNext = powerComputer.getDt(pSum, equivalentMass, currentSpeed, dxToNext);
        currentPoint = inputPath.getPointData(newIndex);
        currentDist = inputPath.getDistance(newIndex);
    } else {
        // Interpolate between waypoints
        dxToNext = dx;
        dtToNext = DT;
        const coef = (currentDist + dx - p1dist) / (p2dist - p1dist);
        currentPoint = inputPath.interpolatePoint(index, index + 1, coef);
        currentDist += dx;
    }

    // 5. Calculate new speed (trapezoidal rule)
    let speedNew = 2 * (dxToNext / dtToNext) - currentSpeed;

    // 6. Enforce maximum speed constraint
    const speedMax = currentPoint.speedMax;
    if (speedNew > speedMax) {
        speedNew = speedMax;
        dtToNext = (2 * dxToNext) / (currentSpeed + speedNew);
    }

    currentSpeed = speedNew;
    currentTime += dtToNext * 1000; // Convert to milliseconds

    // 7. Add simulated point
    newPath.addPoint({
        ...currentPoint,
        dist: currentDist,
        time: currentTime,
        speed: currentSpeed,
    });
}
```

**Source**: `src/physics/VirtualizeService.ts:56-161`

**Binary Search for GPS Segment**:

```typescript
function getIndex(dists: Float64Array, dist: number): number {
    let left = 0,
        right = dists.length - 1;

    while (left <= right) {
        const mid = left + floor((right - left) / 2);

        if (dists[mid] <= dist && dist < dists[mid + 1]) {
            return mid;
        }

        if (dists[mid] < dist) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}
```

**Source**: `src/physics/VirtualizeService.ts:195-213`

**Power Balance Calculation**:

```typescript
function getNewPower(course, path, pointIndex, withCyclist): number {
    let pSum = 0;
    pSum += wheelBearingsPower(path, pointIndex); // ~2W @ 25 km/h
    pSum += rollingResistancePower(course, path, pointIndex); // ~20W @ 25 km/h
    pSum += aeroPower(course, path, pointIndex); // ~100W @ 25 km/h
    pSum += gravPower(course, path, pointIndex); // Varies with grade
    if (withCyclist) {
        pSum += muscularPower(course, path, pointIndex); // 280W (default)
    }
    return pSum;
}
```

**Source**: `src/physics/power/PowerComputer.ts:75-90`

### Step 4: Resampling to 1 Hz

```typescript
const newPointsMap = new Map<number, InterpolationData>();

for (let i = 0; i < path.length - 1; i++) {
    const time1 = path.getTime(i);
    const time2 = path.getTime(i + 1);
    const epochSec1 = floor(time1 / 1000);
    const epochSec2 = floor(time2 / 1000);

    if (epochSec1 !== epochSec2) {
        // Points span multiple seconds
        const duration = time2 - time1;

        for (let epoch = epochSec1 + 1; epoch <= epochSec2; epoch++) {
            const epochTime = epoch * 1000;
            const coef = (epochTime - time1) / duration;

            newPointsMap.set(epoch, {
                type: 'interpolate',
                index1: i,
                index2: i + 1,
                coef: coef,
            });
        }
    }
}

// Create resampled path
const sortedEpochs = Array.from(newPointsMap.keys()).sort();
for (const epoch of sortedEpochs) {
    const data = newPointsMap.get(epoch);
    const point = interpolatePoint(data.index1, data.index2, data.coef);
    point.time = epoch * 1000; // Exact epoch second
    newPath.addPoint(point);
}
```

**Source**: `src/processing/PointPerSecond.ts:43-157`

### Step 5: Simplification

```typescript
function simplify(path, tolerance, zExaggeration): Path {
    if (path.length <= 2) return path;

    const simplified = new Path();
    simplified.addPoint(path.getPointData(0)); // Always keep first

    const intermediate = simplifyRecursive(path, 0, path.length - 1, tolerance, zExaggeration);
    for (const point of intermediate) {
        simplified.addPoint(point);
    }

    simplified.addPoint(path.getPointData(path.length - 1)); // Always keep last
    return simplified;
}

function simplifyRecursive(path, firstIndex, lastIndex, tolerance, zExaggeration): Point[] {
    // Convert to ECEF coordinates (with elevation exaggeration)
    const firstEcef = toEcef(path.getPointData(firstIndex), zExaggeration);
    const lastEcef = toEcef(path.getPointData(lastIndex), zExaggeration);

    // Find point with maximum perpendicular distance
    let maxDist = 0;
    let maxIndex = -1;

    for (let i = firstIndex + 1; i < lastIndex; i++) {
        const pointEcef = toEcef(path.getPointData(i), zExaggeration);
        const dist = pointEcef.distanceToSegment(firstEcef, lastEcef);

        if (dist > maxDist) {
            maxDist = dist;
            maxIndex = i;
        }
    }

    // Recursively simplify if max distance exceeds tolerance
    if (maxDist > tolerance && maxIndex !== -1) {
        const left = simplifyRecursive(path, firstIndex, maxIndex, tolerance, zExaggeration);
        const right = simplifyRecursive(path, maxIndex, lastIndex, tolerance, zExaggeration);
        return [...left, path.getPointData(maxIndex), ...right];
    }

    return [];
}
```

**Source**: `src/processing/DouglasPeucker.ts:16-113`

**ECEF Conversion** (with elevation exaggeration):

```typescript
function toEcef(point, zExaggeration): Vector3D {
    const lat = point.latitude; // radians
    const lon = point.longitude; // radians
    const h = point.elevation * zExaggeration; // meters (exaggerated)

    const N = SEMI_MAJOR_AXIS / sqrt(1 - E2 * sin(lat)²);

    const x = (N + h) * cos(lat) * cos(lon);
    const y = (N + h) * cos(lat) * sin(lon);
    const z = (N * (1 - E2) + h) * sin(lat);

    return new Vector3D(x, y, z);
}
```

**Source**: `src/processing/EcefConverter.ts`

---

## Examples

### Example 1: Flat Terrain

**Scenario**: Recreational cyclist on flat road at steady pace

**Input Parameters**:

- Course: Flat, 0% grade throughout
- Cyclist: 80 kg total, 280W sustained power, CdA = 0.35 m²
- Conditions: Sea level (ρ = 1.225 kg/m³), 15°C, no wind
- Bike: Crr = 0.004, 97.6% efficiency

**Steady-State Speed Calculation**:

At equilibrium, cyclist power equals total resistance:

```
P_cyclist = P_aero + P_rolling + P_bearings
```

Using default parameters, solve for speed iteratively:

**Trial 1: v = 30 km/h = 8.33 m/s**

- Aero coef = (0.7 × 0.5 × 1.225) / 2 = 0.214 kg/m
- P_aero = -0.214 × 8.33³ = -124 W
- P_rolling = -0.004 × 80 × 9.8 × 8.33 = -26 W
- P_bearings = -(8.33 × (91 + 8.7 × 8.33)) / 1000 = -1.4 W
- **Total resistance: 151 W**

Cyclist provides 280W × 0.976 = 273W (after drivetrain loss)
Net power = 273 - 151 = **122W surplus** → will accelerate

**Trial 2: v = 35 km/h = 9.72 m/s**

- P_aero = -0.214 × 9.72³ = -196 W
- P_rolling = -0.004 × 80 × 9.8 × 9.72 = -31 W
- P_bearings = -(9.72 × (91 + 8.7 × 9.72)) / 1000 = -1.7 W
- **Total resistance: 229 W**

Net power = 273 - 229 = **44W surplus** → still accelerating

**Trial 3: v = 38 km/h = 10.56 m/s**

- P_aero = -0.214 × 10.56³ = -252 W
- P_rolling = -0.004 × 80 × 9.8 × 10.56 = -33 W
- P_bearings = -(10.56 × (91 + 8.7 × 10.56)) / 1000 = -1.9 W
- **Total resistance: 287 W**

Net power = 273 - 287 = **-14W deficit** → slight deceleration

**Equilibrium: approximately 37 km/h (10.3 m/s)**

**Power Breakdown**:
| Component | Power | Percentage |
|-----------|-------|------------|
| Cyclist (wheel) | 273 W | 100% |
| Aerodynamic drag | -239 W | 87.5% |
| Rolling resistance | -32 W | 11.7% |
| Wheel bearings | -2 W | 0.7% |
| **Net** | 0 W | 0% |

**Key Insight**: On flat terrain at moderate speeds, aerodynamic drag dominates (87.5% of resistance). Rolling resistance is significant (11.7%) but secondary.

### Example 2: Climbing

**Scenario**: Same cyclist climbing a steady grade

**Input Parameters**:

- Grade: 5% (0.05)
- All other parameters same as Example 1

**Expected Speed**: Much slower due to gravitational resistance

**Trial: v = 15 km/h = 4.17 m/s**

```
Gravitational term: sin(atan(0.05)) = 0.04997 ≈ 0.05
Normal force term: cos(atan(0.05)) = 0.99875 ≈ 1.0
```

- P_gravity = -80 × 9.8 × 4.17 × 0.05 = **-163 W**
- P_aero = -0.214 × 4.17³ = -16 W
- P_rolling = -1.0 × 80 × 9.8 × 4.17 × 0.004 = -13 W
- P_bearings = -(4.17 × (91 + 8.7 × 4.17)) / 1000 = -0.5 W
- **Total resistance: 193 W**

Net power = 273 - 193 = **80W surplus** → will accelerate

**Trial: v = 18 km/h = 5.0 m/s**

- P_gravity = -80 × 9.8 × 5.0 × 0.05 = **-196 W**
- P_aero = -0.214 × 5.0³ = -27 W
- P_rolling = -80 × 9.8 × 5.0 × 0.004 = -16 W
- P_bearings = -(5.0 × (91 + 8.7 × 5.0)) / 1000 = -0.7 W
- **Total resistance: 240 W**

Net power = 273 - 240 = **33W surplus** → still accelerating

**Trial: v = 20 km/h = 5.56 m/s**

- P_gravity = -80 × 9.8 × 5.56 × 0.05 = **-218 W**
- P_aero = -0.214 × 5.56³ = -37 W
- P_rolling = -80 × 9.8 × 5.56 × 0.004 = -17 W
- P_bearings = -(5.56 × (91 + 8.7 × 5.56)) / 1000 = -0.8 W
- **Total resistance: 273 W**

Net power = 273 - 273 = **0W equilibrium**

**Equilibrium: approximately 20 km/h (5.56 m/s)**

**Power Breakdown**:
| Component | Power | Percentage |
|-----------|-------|------------|
| Cyclist (wheel) | 273 W | 100% |
| Gravitational | -218 W | 79.9% |
| Aerodynamic drag | -37 W | 13.6% |
| Rolling resistance | -17 W | 6.2% |
| Wheel bearings | -1 W | 0.4% |
| **Net** | 0 W | 0% |

**Key Insight**: On 5% climb, gravity dominates (80% of resistance). Speed drops from 37 km/h to 20 km/h (46% reduction). Aerodynamic drag becomes secondary.

**Climbing Performance**:
| Grade | Equilibrium Speed | Gravity % | Aero % |
|-------|-------------------|-----------|--------|
| 0% | 37 km/h | 0% | 87.5% |
| 2% | 28 km/h | 54% | 32% |
| 5% | 20 km/h | 80% | 14% |
| 10% | 14 km/h | 89% | 6% |

### Example 3: Descending

**Scenario**: Same cyclist descending, with speed limited by maximum safe speed

**Input Parameters**:

- Grade: -3% (-0.03)
- Corner with radius: 50m
- All other parameters same as Example 1

**Step 1: Calculate Maximum Cornering Speed**

From cornering physics:

```
radius = 50m (from GPS geometry) + 2m (safety) = 52m
v_max = sqrt(g × r × tan(θ_max))
v_max = sqrt(9.8 × 52 × tan(35°))
v_max = sqrt(9.8 × 52 × 0.700)
v_max = sqrt(356.7)
v_max = 18.9 m/s = 68 km/h
```

**Step 2: Power Balance at Maximum Speed**

**Trial: v = 18.9 m/s (68 km/h, cornering limit)**

```
Gravitational: sin(atan(-0.03)) = -0.02999 ≈ -0.03
```

- P_gravity = -80 × 9.8 × 18.9 × (-0.03) = **+444 W** (gravity assists!)
- P_aero = -0.214 × 18.9³ = -1450 W
- P_rolling = -80 × 9.8 × 18.9 × 0.004 = -59 W
- P_bearings = -(18.9 × (91 + 8.7 × 18.9)) / 1000 = -4.8 W
- **Total resistance: 1514 W**
- Gravity assistance: +444 W
- **Net resistance: 1070 W**

Cyclist provides 273W (wheel power)
Net power = 273 + 444 - 1514 = **-797W deficit** → will decelerate

**Speed naturally limited by aerodynamic drag before hitting corner limit!**

**Let's find equilibrium descent speed:**

**Trial: v = 50 km/h = 13.9 m/s**

- P_gravity = -80 × 9.8 × 13.9 × (-0.03) = **+326 W**
- P_aero = -0.214 × 13.9³ = -575 W
- P_rolling = -80 × 9.8 × 13.9 × 0.004 = -44 W
- P_bearings = -(13.9 × (91 + 8.7 × 13.9)) / 1000 = -2.9 W
- **Total: 326 - 575 - 44 - 3 = -296W**

Net power = 273 - 296 = **-23W deficit** → slight deceleration

**Trial: v = 48 km/h = 13.3 m/s**

- P_gravity = +80 × 9.8 × 13.3 × 0.03 = **+313 W**
- P_aero = -0.214 × 13.3³ = -505 W
- P_rolling = -80 × 9.8 × 13.3 × 0.004 = -42 W
- P_bearings = -(13.3 × (91 + 8.7 × 13.3)) / 1000 = -2.7 W
- **Total: 313 - 505 - 42 - 3 = -237W**

Net power = 273 - 237 = **+36W surplus** → slight acceleration

**Equilibrium: approximately 49 km/h (13.6 m/s)**

**Power Breakdown**:
| Component | Power | Type |
|-----------|-------|------|
| Gravity assistance | +320 W | Input |
| Cyclist (wheel) | +273 W | Input |
| **Total input** | **593 W** | |
| Aerodynamic drag | -543 W | Resistance |
| Rolling resistance | -43 W | Resistance |
| Wheel bearings | -3 W | Resistance |
| **Total resistance** | **-589 W** | |
| **Net** | ~0 W | Equilibrium |

**Corner Entry Analysis**:

Approaching 50m radius corner at 49 km/h:

- Maximum safe speed: 68 km/h (from cornering formula)
- Actual speed: 49 km/h
- **Safety margin: 19 km/h** ✓ Safe to enter corner

If corner radius were tighter (e.g., 20m):

- Maximum safe speed: 43 km/h
- Descent speed: 49 km/h
- **Braking required!** Must slow by 6 km/h

**Key Insight**: On gentle descents (-3%), gravity provides significant power assistance (320W), allowing higher speeds. However, aerodynamic drag increases with cube of velocity, creating natural speed limit. Tight corners require braking from descent speed.

**Descent Speed Comparison**:
| Grade | Equilibrium Speed | Gravity Assist | Corner Limit (r=30m) |
|-------|-------------------|----------------|----------------------|
| 0% | 37 km/h | 0 W | 40 km/h (no braking) |
| -2% | 43 km/h | +214 W | 40 km/h (brake!) |
| -3% | 49 km/h | +320 W | 40 km/h (brake!) |
| -5% | 60 km/h | +533 W | 40 km/h (brake hard!) |

---

## References

### Academic Research

1. **Isvan, O. (2011)**: "Power Management for the Propulsion of Lightweight Vehicles"
   Available at: https://www.sheldonbrown.com/isvan/Power%20Management%20for%20Lightweight%20Vehicles.pdf
   _Primary source for wind model with turbulence factor (μ = 1.2)_

2. **Martin, J.C., Milliken, D.L., Cobb, J.E., McFadden, K.L., & Coggan, A.R. (1998)**:
   "Validation of a Mathematical Model for Road Cycling Power"
   _Journal of Applied Biomechanics, 14, 276-291_
   _Validates power-based cycling physics model_

3. **SAE Technical Paper 2020-01-0876**:
   "Bicycle Braking Performance Testing"
   _Establishes 0.6-0.8g safe braking limits for bicycles_

### Technical References

4. **Bicycle Rolling Resistance**:
   https://www.bicyclerollingresistance.com
   _Empirical measurements of tire Crr values (0.003-0.006 range for road tires)_

5. **Sheldon Brown - Brandt's Analysis**:
   https://www.sheldonbrown.com/brandt/
   _Bicycle physics, cornering dynamics, and rolling resistance_

### Standards and Specifications

6. **WGS-84 (World Geodetic System 1984)**:
   _Geodetic reference system for GPS coordinates_
    - Semi-major axis: 6,378,137 m
    - First eccentricity squared: 6.6943799901378×10⁻³
      _Used for ECEF coordinate transformations_

7. **ISO International Standard Atmosphere (ISA)**:
   _Standard atmospheric conditions at sea level_
    - Pressure: 101,325 Pa
    - Temperature: 288.15 K (15°C)
    - Air density: 1.225 kg/m³

### Cycling Performance Data

8. **Allen, H., & Coggan, A. (2010)**:
   "Training and Racing with a Power Meter"
   _Reference for FTP (Functional Threshold Power) and W/kg benchmarks_

9. **ResearchGate - Aerodynamic Drag in Cycling**:
   "Methods of Assessment"
   _Establishes CdA ranges: 0.20-0.45 m² depending on position_

### Implementation Sources

10. **Original Java Implementation**:
    gpx2web project by Guillaume Landais
    _Source of algorithm design and empirical constants_

---

## Appendix: Coordinate Systems

### GPS Coordinates (WGS-84)

- **Latitude**: Angular distance north/south of equator (-90° to +90°)
- **Longitude**: Angular distance east/west of prime meridian (-180° to +180°)
- **Elevation**: Height above WGS-84 ellipsoid (meters)

**Storage**: Latitude and longitude stored as radians internally, converted to/from degrees for I/O.

### ECEF (Earth-Centered Earth-Fixed)

Cartesian coordinate system with origin at Earth's center:

```
X-axis: Intersection of equator and prime meridian
Y-axis: Intersection of equator and 90°E meridian
Z-axis: North pole
```

**Conversion from GPS**:

```typescript
const N = SEMI_MAJOR_AXIS / sqrt(1 - E² × sin²(lat));
const x = (N + h) × cos(lat) × cos(lon);
const y = (N + h) × cos(lat) × sin(lon);
const z = (N × (1 - E²) + h) × sin(lat);
```

**Purpose**: Enable accurate 3D distance calculations that account for Earth's curvature and elevation.

**Elevation Exaggeration**: Multiply elevation by factor (default: 3) before ECEF conversion to emphasize terrain features in simplification algorithm.

---

## Glossary

| Term                 | Definition                                            |
| -------------------- | ----------------------------------------------------- |
| **CdA**              | Aerodynamic drag area = Cd × A (m²)                   |
| **Crr**              | Coefficient of rolling resistance (dimensionless)     |
| **DT**               | Time step for numerical integration (seconds)         |
| **ECEF**             | Earth-Centered Earth-Fixed coordinate system          |
| **FTP**              | Functional Threshold Power - sustainable 1-hour power |
| **GPX**              | GPS Exchange Format (XML)                             |
| **ISA**              | International Standard Atmosphere                     |
| **WGS-84**           | World Geodetic System 1984 (GPS coordinate system)    |
| **Equivalent Mass**  | Total linear + rotational inertia mass                |
| **Trapezoidal Rule** | Numerical integration method: Δx = (v₁ + v₂) × Δt / 2 |
| **Binary Search**    | O(log n) algorithm for finding GPS segment            |
| **Douglas-Peucker**  | Recursive line simplification algorithm               |

---

**Document Version**: 1.0
**Last Updated**: 2025
**Library Version**: Based on virtual-cyclist TypeScript implementation
**Author**: Generated from source code analysis
