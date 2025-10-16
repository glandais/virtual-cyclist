# Point Insights Architecture - Virtual Cyclist Demo

**Date:** 2025-10-15
**Purpose:** Architectural design for displaying computation insights when users highlight/select points in the demo

---

## 🎯 Original Requirement

When a user highlights a point in the demo application, provide insights on computed fields including:

- Show formulas and calculations
- Display dependencies between fields
- Explain how values are computed
- Provide educational context for the physics/algorithms

**Key Questions Addressed:**

1. What architecture to use?
2. What UX pattern?
3. KaTeX vs MathJax for math rendering?
4. How to handle both simple formulas AND complex algorithms?

---

## 📊 Current State Analysis

### Demo Application Architecture

**Technology Stack:**

- Vue 3 SPA with composables pattern
- Chart.js for elevation/speed visualization
- Leaflet for map display
- TypeScript with strict mode

**Key Components:**

- `App.vue` - Central orchestration
- `DataChart.vue` - Chart.js visualization
- `MapView.vue` - Leaflet map
- `FieldsSidebar.vue` - Field selection drawer
- `ConfigModal.vue` - Cyclist/bike settings

**Composables (Business Logic):**

- `useGPXDemo.ts` - File loading and enhancement
- `useChart.ts` - Chart initialization and data binding
- `useMap.ts` - Map management
- `useHoverSync.ts` - Synchronizes hover between chart and map
- `useConfigPersistence.ts` - localStorage config

**Current Interaction Patterns:**

- **Hover:** Synchronized between chart and map, shows tooltip with 3 fields (distance, elevation, speed)
- **Zoom/Pan:** Mouse wheel and drag on chart
- **Field Selection:** Sidebar drawer for choosing which fields to display

**Current Limitations:**

- No point selection (click) - only hover
- No comprehensive field details panel
- No formula/calculation explanations
- No dependency visualization
- Chart only shows distance on X-axis

### Computed Fields (34 Total)

Virtual Cyclist computes 34 fields per point, organized into categories:

#### 📍 GPS Data (4 fields)

- `latitude`, `longitude` - GPS coordinates (radians)
- `time` - Timestamp (ms since epoch)
- `elevation` - From external API

#### 📐 Path Geometry (4 fields)

- `distance` - Cumulative distance from start (Haversine formula)
- `elapsed` - Time elapsed from start
- `bearing` - Direction of travel (atan2)
- `grade` - Road slope (Δh / Δd)

#### 🚴 Motion & Speed (5 fields)

- `speed` - Current speed from GPS or simulation
- `speedMax` - Maximum safe speed (two-pass algorithm: cornering + braking)
- `speedMaxIncline` - Incline-only limit (before braking constraints)
- `virtSpeedCurrent` - Simulated speed from physics
- `radius` - Turning radius (circle through 3 points algorithm)

#### ⚡ Power Components (8 fields)

- `pAero` - Aerodynamic drag: `0.5 × ρ × CdA × (v - v_wind)³`
- `pGravity` - Climbing/descending: `m × g × v × sin(grade)`
- `pRollingResistance` - Tire resistance: `Crr × m × g × v × cos(grade)`
- `pWheelBearings` - Bearing friction
- `pInputPower` - Power from GPX file (if available)
- `pComputedTotalPower` - From kinetic energy change
- `pComputedWheelPower` - Wheel power from speed change
- `pComputedPower` - Final computed cyclist power

#### 💨 Aerodynamics (5 fields)

- `windSpeed`, `windDirection` - Wind vector
- `windBearing` - Wind bearing relative to cyclist
- `windAlpha` - Wind angle of attack
- `aeroCoef` - Coefficient adjustment based on wind angle

#### 👤 Cyclist Performance (8 fields)

- `pCyclistProvidedOptimalPower` - Base power output
- `pCyclistProvidedOptimalPowerWithHarmonics` - With fatigue modeling
- `pCyclistPowerNeeded` - Required to maintain speed
- `pCyclistProvidedMuscular` - Raw muscular power
- `PCyclistProvidedWheel` - After drivetrain loss
- `heartRate`, `cadence`, `temperature` - Sensor data

---

## 🏗️ Recommended Architecture

### Interaction Model: Hover + Selection Pattern

**Two-Level Interaction:**

1. **Hover (existing)** - Quick preview tooltip
    - Shows 3 key metrics: distance, elevation, speed
    - Non-intrusive, preserves current UX
    - Disappears when mouse moves away

2. **Click/Select (new)** - Persistent detail panel
    - Opens comprehensive insights panel
    - Persists while user explores data
    - Shows all 34 fields organized by category
    - Displays formulas, algorithms, and dependencies

**Why this pattern:**

- Preserves familiar hover behavior (users expect quick tooltips)
- Click signals intent for deeper investigation
- Allows persistent exploration while maintaining context
- Progressive disclosure: simple → detailed → expert

### UI Pattern: Collapsible Right Side Panel

```
┌─────────────────────────┬──────────────────────┐
│  Chart View             │ Point Details Panel  │
│                         │ ┌──────────────────┐ │
│  [Selected point •]     │ │ 📍 Point at 42.5km│ │ ← Sticky header
│                         │ └──────────────────┘ │
│  [Elevation profile]    │                      │
│                         │ ▼ Path Geometry  [4] │ ← Category (expanded)
│  [Speed curve]          │  d    Distance: 42.5km│
│                         │  h    Elevation: 850m│
│                         │  g    Grade: 4.2% [📐]│ ← Formula available
│                         │  β    Bearing: 285°  │
│                         │                      │
│                         │ ▼ Motion & Speed [5] │
│                         │  v      Speed: 32km/h│
│                         │  v_max  Max: 45 km/h │
│                         │  r      Radius: 245m │
│                         │  ...                 │
│                         │                      │
│                         │ ▶ Power Analysis [8] │ ← Collapsed
│                         │ ▶ Aerodynamics  [5]  │
│                         │ ▶ Cyclist Data  [8]  │
└─────────────────────────┴──────────────────────┘
```

**Panel Features:**

- Sticky header with point summary and close button
- Collapsible category sections (2-3 expanded by default)
- Each field shows: symbol + name + value + unit
- Icon/badge indicates computation type
- Click field to expand formula/algorithm details
- Keyboard navigation (arrow keys, Escape)

### Progressive Disclosure (3 Levels)

**Level 1: Hover Tooltip (Existing)**

- Distance, elevation, speed only
- Quick preview without selection
- Non-intrusive

**Level 2: Category View (Default on Click)**

- All fields grouped by 6 categories
- Symbol + name + formatted value + unit
- Icon indicates if formula/algorithm available
- 2-3 most relevant categories expanded

**Level 3: Formula & Computation (On-Demand)**

- Click field to see detailed explanation
- KaTeX-rendered formula
- Step-by-step calculation breakdown
- Shows intermediate values and dependencies
- Link to implementation code (for algorithms)

### Example: Expanded Field Detail

When user clicks "Grade: 4.2%" field:

```
┌────────────────────────────────┐
│ g  Grade: 4.2%           [×]   │ ← Close button
├────────────────────────────────┤
│ Formula:                       │
│   g = Δh / Δd                 │ ← KaTeX rendered
│                                │
│ Calculation:                   │
│   Δh = h₁ - h₀                │
│      = 850 - 814.8            │
│      = 35.2 m                 │
│                                │
│   Δd = d₁ - d₀                │
│      = 42,500 - 41,658        │
│      = 842 m                  │
│                                │
│   g = 35.2 / 842              │
│     = 0.0418 = 4.2%           │
│                                │
│ Dependencies:                  │
│   • h (elevation) [click]     │ ← Clickable, jumps to field
│   • d (distance) [click]      │
└────────────────────────────────┘
```

---

## 🔣 Symbol System for Fields

### Why Symbols?

**Benefits:**

1. **Visual consistency** - Same symbol in field list and formulas
2. **Quick scanning** - Easier to spot patterns and dependencies
3. **Professional feel** - Like physics textbooks and research papers
4. **Reduced cognitive load** - Symbols are more compact than full names
5. **Formula recognition** - Immediately understand formula variables

### Proposed Symbols by Category

**📍 GPS Data**

- `lat, lon` - Latitude, Longitude (or λ, φ in formulas)
- `t` - Time
- `h` - Elevation (height)

**📐 Path Geometry**

- `d` - Distance
- `Δt` - Elapsed time
- `β` - Bearing
- `g` - Grade (slope)

**🚴 Motion & Speed**

- `v` - Speed (current)
- `v_max` - Maximum safe speed
- `v_inc` - Speed max (incline only, before braking)
- `v_virt` - Virtual/simulated speed
- `r` - Radius (turning)

**⚡ Power Components**

- `P_a` - Aerodynamic power
- `P_g` - Gravity power
- `P_r` - Rolling resistance power
- `P_b` - Bearing friction power
- `P_in` - Input power (from sensor)

**💨 Aerodynamics**

- `v_w` - Wind speed
- `θ_w` - Wind direction
- `β_w` - Wind bearing
- `α` - Wind angle of attack
- `C_d` - Aero coefficient

**👤 Cyclist Performance**

- `P_opt` - Optimal power
- `P_har` - Power with harmonics
- `P_need` - Power needed
- `P_mus` - Muscular power
- `P_whl` - Wheel power
- `P_tot` - Total computed power
- `HR` - Heart rate
- `cad` - Cadence

### Symbol Usage Example

**In field list:**

```
⚡ Power Components
  P_a  Aerodynamic Power: -125 W  [📐]
  P_g  Gravity Power: -85 W       [📐]
  P_r  Rolling Resistance: -12 W  [📐]
  P_b  Bearing Friction: -3 W     [📐]
```

**In expanded formula:**

```
Formula:
  P_a = ½ ρ · C_dA · (v - v_w)³

Where:
  ρ = air density [click to see]
  C_dA = drag coefficient × area [click]
  v = speed [click to jump to field]
  v_w = wind speed [click]
```

**Benefit:** When user sees `v` in the formula, they immediately recognize it's the same `v` (speed) they saw in the Motion & Speed category.

---

## 📋 Field Classification System

Not all fields are computed the same way. We identified **4 distinct computation types**:

### Type 1: Simple Formula (Single Equation)

**Examples:** grade, pAero, pGravity, pRolling

**Characteristics:**

- Single mathematical equation
- Direct calculation from dependencies
- Can be expressed in LaTeX

**Presentation:**

- Show LaTeX formula
- Show step-by-step substitution
- List dependencies with links
- Badge: `[📐]`

**Example (Grade):**

```
Formula: g = Δh / Δd

Calculation:
  Δh = h₁ - h₀ = 850 - 814.8 = 35.2 m
  Δd = d₁ - d₀ = 42,500 - 41,658 = 842 m
  g = 35.2 / 842 = 0.0418 = 4.2%

Dependencies: h (elevation), d (distance)
```

### Type 2: Multi-Step Algorithm (Procedural Logic)

**Examples:** radius, speedMax

**Characteristics:**

- Multiple steps with conditional logic
- Geometric or iterative algorithms
- May involve coordinate transformations
- Complex enough to warrant code reference

**Presentation:**

- Show numbered algorithm steps
- Include pseudocode or code snippets
- Show intermediate results for this specific point
- Link to implementation file
- Badge: `[⚙️]`

**Example (Radius):**

```
Algorithm:

1. Transform 3 consecutive GPS points to local Cartesian coordinates
   • Previous: (-15.2, -8.3) m
   • Current: (0, 0) m [origin]
   • Next: (18.7, 12.1) m
   Using equirectangular projection

2. Find circle center through 3 points (circumcenter)
   • Solve linear system for circle equations
   • Center: (125.3, 215.7) m
   • See: MaxSpeedComputer.getCircleCenter()

3. Calculate radius from center to current point
   • r = √(x² + y²) = √(125.3² + 215.7²)
   • r = 249.8 m

4. Add 2m safety margin for trajectory uncertainty
   • r_final = 249.8 + 2 = 251.8 m

Implementation: MaxSpeedComputer.ts:100-140
Dependencies: lat, lon (3 consecutive points)
```

### Type 3: External Data/Lookup

**Examples:** elevation (from API)

**Characteristics:**

- Fetched from external service or database
- Not computed from other cycling parameters
- May involve interpolation

**Presentation:**

- Identify data source
- Explain process (API call, lookup, interpolation)
- Note that it's measured/surveyed, not computed
- Badge: `[API]`

**Example (Elevation):**

```
Data Source:
  External elevation API (@glandais/elevation package)

Process:
  1. Send GPS coordinates (lat, lon) to API
  2. API returns elevation from terrain database
  3. Value may be interpolated between data points

Note: This is measured/surveyed data from terrain models,
not computed from other cycling parameters.
```

### Type 4: Raw GPS Data

**Examples:** latitude, longitude, time, heartRate, cadence

**Characteristics:**

- Recorded directly by GPS device or sensors
- No computation involved
- Source data for other calculations

**Presentation:**

- State it's from GPX file
- No formula or algorithm
- Badge: `[GPS]`

**Example:**

```
Source: Raw GPS data from GPX file

This value is recorded directly by the GPS device
or bike sensors, not computed from other fields.
```

### Badge System

Display small badge after each field value to indicate type:

```
📐 Path Geometry
  d    Distance: 42.5 km          [GPS]  ← Type 4
  h    Elevation: 850 m           [API]  ← Type 3
  g    Grade: 4.2%                [📐]   ← Type 1
  β    Bearing: 285°              [📐]   ← Type 1

🚴 Motion & Speed
  v      Speed: 32.4 km/h         [GPS]  ← Type 4
  v_max  Max Speed: 45.0 km/h     [⚙️]   ← Type 2
  r      Radius: 245 m            [⚙️]   ← Type 2
```

---

## 🔧 Technology Choice: KaTeX

### KaTeX vs MathJax Comparison

| Aspect                | **KaTeX** ✅              | MathJax                   |
| --------------------- | ------------------------- | ------------------------- |
| **Rendering Speed**   | ~3-5ms per formula        | ~50-100ms per formula     |
| **Bundle Size**       | ~150KB gzipped            | ~500KB+ gzipped           |
| **Rendering Method**  | Pure CSS/fonts            | JavaScript + CSS          |
| **Build Integration** | Excellent Vite support    | Requires configuration    |
| **LaTeX Coverage**    | 99% of math commands      | 100% of LaTeX             |
| **Our Use Case**      | ✅ All formulas supported | ✅ All formulas supported |

### Decision: **KaTeX**

**Rationale:**

1. **Sufficient Coverage:** Virtual Cyclist formulas are straightforward:
    - Basic algebra: `v = √(g × r × tan(θ))`
    - Fractions: `g = Δh / Δd`
    - Greek letters: `ρ, θ, Δ`
    - Subscripts/superscripts: `P_aero`, `v²`
    - No complex matrices, integrals, or exotic symbols needed

2. **Performance:** 10-20x faster rendering is noticeable in interactive UI

3. **Bundle Size:** 150KB vs 500KB+ - significant for web app

4. **Build Integration:** Vite plugin available for auto CSS import

5. **Maintenance:** Active development, modern codebase

**Installation:**

```bash
npm install katex @types/katex
```

**Usage:**

```typescript
import katex from 'katex';
import 'katex/dist/katex.min.css';

const html = katex.renderToString(
    String.raw`
  v_{max} = \sqrt{g \cdot r \cdot \tan(\theta_{lean})}
`,
    {
        displayMode: true, // Block display (centered)
        throwOnError: false, // Graceful degradation
    }
);
```

### Optional: math.js for "What If" Scenarios

**Not for rendering, but for interactive recalculation:**

```typescript
import * as math from 'mathjs';

// Allow user to tweak parameters and see recalculated results
function recalculateMaxSpeed(radius: number, leanAngle: number): number {
    const g = 9.81;
    return math.evaluate('sqrt(g * r * tan(theta))', {
        g,
        r: radius,
        theta: leanAngle,
    }) as number;
}
```

**Use Cases:**

- "What if lean angle was 35° instead of 30°?"
- "What if bike weight was 8kg instead of 9kg?"
- Live preview as user drags sliders
- Sensitivity analysis

**Decision:** Start with KaTeX only, add math.js later if interactive recalculation feature is desired (Phase 4).

---

## 🧩 Component Architecture

### New Components

#### 1. Composable: `usePointSelection.ts`

**Purpose:** Centralized state management for point selection

```typescript
export interface UsePointSelection {
    selectedIndex: Ref<number | null>;
    panelOpen: Ref<boolean>;
    selectPoint: (index: number) => void;
    clearSelection: () => void;
    nextPoint: () => void;
    previousPoint: () => void;
}

export function usePointSelection(path: Ref<Path | null>) {
    const selectedIndex = ref<number | null>(null);
    const panelOpen = ref(false);

    const selectPoint = (index: number) => {
        selectedIndex.value = index;
        panelOpen.value = true;
    };

    const clearSelection = () => {
        selectedIndex.value = null;
        panelOpen.value = false;
    };

    const nextPoint = () => {
        if (!path.value || selectedIndex.value === null) return;
        const next = selectedIndex.value + 1;
        if (next < path.value.getPointCount()) {
            selectPoint(next);
        }
    };

    const previousPoint = () => {
        if (!path.value || selectedIndex.value === null) return;
        const prev = selectedIndex.value - 1;
        if (prev >= 0) {
            selectPoint(prev);
        }
    };

    // Keyboard navigation
    onMounted(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            if (!panelOpen.value) return;

            switch (e.key) {
                case 'Escape':
                    clearSelection();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    previousPoint();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    nextPoint();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyboard);
        onUnmounted(() => window.removeEventListener('keydown', handleKeyboard));
    });

    return {
        selectedIndex,
        panelOpen,
        selectPoint,
        clearSelection,
        nextPoint,
        previousPoint,
    };
}
```

#### 2. Component: `PointInsightsPanel.vue`

**Purpose:** Main insights panel container

```vue
<template>
    <aside v-if="panelOpen" class="insights-panel">
        <header class="sticky-header">
            <h3>📍 Point at {{ formatDistance(distance) }}</h3>
            <button @click="close" class="close-btn">×</button>
        </header>

        <div class="panel-content">
            <CategorySection
                v-for="category in categories"
                :key="category.name"
                :category="category"
                :path="path"
                :point-index="selectedIndex"
                :default-expanded="category.defaultExpanded"
                @field-click="handleFieldClick"
            />
        </div>
    </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Path } from '@/types/path';
import CategorySection from './CategorySection.vue';
import { getFieldCategories } from '@/utils/fieldInsights';

const props = defineProps<{
    path: Path | null;
    selectedIndex: number | null;
    panelOpen: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();

const categories = computed(() => {
    if (!props.path || props.selectedIndex === null) return [];
    return getFieldCategories(props.path, props.selectedIndex);
});

const distance = computed(() => {
    if (!props.path || props.selectedIndex === null) return 0;
    return props.path.getDistance(props.selectedIndex);
});

const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`;
};

const handleFieldClick = (field: FieldInsight) => {
    // Expand formula/algorithm detail for this field
    // Could emit event to show modal or inline expansion
};

const close = () => {
    emit('close');
};
</script>

<style scoped>
.insights-panel {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 400px;
    background: white;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: flex;
    flex-direction: column;
}

.sticky-header {
    position: sticky;
    top: 0;
    background: white;
    border-bottom: 1px solid #e0e0e0;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
}
</style>
```

#### 3. Component: `CategorySection.vue`

**Purpose:** Collapsible category with field list

```vue
<template>
    <section class="category">
        <header @click="toggle" class="category-header">
            <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span>
            <span class="category-title"> {{ category.icon }} {{ category.name }} </span>
            <span class="field-count">[{{ category.fields.length }}]</span>
        </header>

        <div v-if="isExpanded" class="fields">
            <FieldInsight
                v-for="field in category.fields"
                :key="field.field"
                :field="field"
                :path="path"
                :point-index="pointIndex"
                @click="$emit('field-click', field)"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FieldInsight from './FieldInsight.vue';
import type { FieldCategory, FieldInsight as FieldInsightType } from '@/utils/fieldInsights';

const props = defineProps<{
    category: FieldCategory;
    path: Path;
    pointIndex: number;
    defaultExpanded?: boolean;
}>();

defineEmits<{
    'field-click': [field: FieldInsightType];
}>();

const isExpanded = ref(props.defaultExpanded ?? false);

const toggle = () => {
    isExpanded.value = !isExpanded.value;
};
</script>

<style scoped>
.category {
    margin-bottom: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}

.category-header {
    padding: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f5f5f5;
    user-select: none;
}

.category-header:hover {
    background: #eeeeee;
}

.expand-icon {
    font-size: 0.8rem;
}

.category-title {
    flex: 1;
    font-weight: 600;
}

.field-count {
    color: #666;
    font-size: 0.9rem;
}

.fields {
    padding: 0.5rem;
}
</style>
```

#### 4. Component: `FieldInsight.vue`

**Purpose:** Individual field display with expandable details

```vue
<template>
    <div class="field" :class="{ expanded: isExpanded }">
        <div class="field-summary" @click="toggle">
            <span class="field-symbol">{{ field.symbol }}</span>
            <span class="field-name">{{ field.name }}:</span>
            <span class="field-value">{{ formattedValue }}</span>
            <span v-if="hasDetails" class="badge">{{ badge }}</span>
        </div>

        <div v-if="isExpanded && hasDetails" class="field-detail">
            <!-- Type 1: Simple Formula -->
            <div v-if="field.computationType === 'formula'" class="formula-section">
                <h4>Formula:</h4>
                <div class="formula" v-html="renderedFormula" />

                <h4>Calculation:</h4>
                <ComputationSteps :steps="computationSteps" />

                <div v-if="field.dependencies?.length" class="dependencies">
                    <h4>Dependencies:</h4>
                    <ul>
                        <li v-for="dep in field.dependencies" :key="dep">
                            {{ dep }} <a href="#" @click.prevent="jumpToField(dep)">[jump]</a>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Type 2: Algorithm -->
            <div v-if="field.computationType === 'algorithm'" class="algorithm-section">
                <h4>Algorithm:</h4>
                <AlgorithmSteps :steps="field.algorithmSteps" :results="algorithmResults" />

                <div v-if="field.implementationRef" class="implementation">
                    <p><strong>Implementation:</strong> {{ field.implementationRef }}</p>
                </div>
            </div>

            <!-- Type 3: External Data -->
            <div v-if="field.computationType === 'external'" class="external-section">
                <h4>Data Source:</h4>
                <p>{{ field.dataSource }}</p>
                <p class="note">This is measured/surveyed data, not computed from other fields.</p>
            </div>

            <!-- Type 4: Raw Data -->
            <div v-if="field.computationType === 'raw_data'" class="raw-data-section">
                <p><strong>Source:</strong> Raw GPS data from GPX file</p>
                <p>This value is recorded directly by sensors, not computed.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import katex from 'katex';
import type { FieldInsight } from '@/utils/fieldInsights';
import ComputationSteps from './ComputationSteps.vue';
import AlgorithmSteps from './AlgorithmSteps.vue';

const props = defineProps<{
    field: FieldInsight;
    path: Path;
    pointIndex: number;
}>();

const isExpanded = ref(false);

const hasDetails = computed(() => {
    return (
        props.field.computationType !== 'raw_data' ||
        props.field.formula ||
        props.field.algorithmSteps
    );
});

const badge = computed(() => {
    switch (props.field.computationType) {
        case 'formula':
            return '[📐]';
        case 'algorithm':
            return '[⚙️]';
        case 'external':
            return '[API]';
        case 'raw_data':
            return '[GPS]';
        default:
            return '';
    }
});

const formattedValue = computed(() => {
    const value = props.field.value;
    const unit = props.field.unit;

    // Format based on field type
    let formatted: string;
    if (Math.abs(value) < 0.01) {
        formatted = value.toExponential(2);
    } else if (Math.abs(value) < 1) {
        formatted = value.toFixed(3);
    } else if (Math.abs(value) < 100) {
        formatted = value.toFixed(1);
    } else {
        formatted = value.toFixed(0);
    }

    return `${formatted} ${unit}`;
});

const renderedFormula = computed(() => {
    if (!props.field.formula) return '';
    try {
        return katex.renderToString(props.field.formula, {
            displayMode: true,
            throwOnError: false,
        });
    } catch (e) {
        console.error('KaTeX rendering error:', e);
        return props.field.formula;
    }
});

const computationSteps = computed(() => {
    // Generate step-by-step calculation for this specific point
    // This would call a utility function that calculates intermediate values
    return [];
});

const algorithmResults = computed(() => {
    // Get algorithm results for this specific point
    return {};
});

const toggle = () => {
    if (hasDetails.value) {
        isExpanded.value = !isExpanded.value;
    }
};

const jumpToField = (symbol: string) => {
    // Emit event to scroll to and highlight the dependency field
    // Could be handled by parent component
};
</script>

<style scoped>
.field {
    padding: 0.5rem;
    border-left: 3px solid transparent;
    transition: all 0.2s;
}

.field:hover {
    background: #f9f9f9;
    border-left-color: #2196f3;
}

.field-summary {
    display: grid;
    grid-template-columns: 3rem 1fr auto auto;
    gap: 0.5rem;
    align-items: center;
    cursor: pointer;
    user-select: none;
}

.field-symbol {
    font-family: 'Times New Roman', serif;
    font-style: italic;
    font-weight: 600;
    color: #1976d2;
}

.field-name {
    font-weight: 500;
}

.field-value {
    font-family: 'Courier New', monospace;
    font-weight: 600;
}

.badge {
    font-size: 0.8rem;
    color: #666;
}

.field-detail {
    margin-top: 1rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
    font-size: 0.9rem;
}

.field-detail h4 {
    margin: 0.75rem 0 0.5rem 0;
    font-size: 0.9rem;
    color: #666;
    text-transform: uppercase;
}

.formula {
    margin: 0.5rem 0;
    padding: 1rem;
    background: white;
    border-radius: 4px;
    overflow-x: auto;
}

.dependencies ul {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
}

.dependencies li {
    padding: 0.25rem 0;
}

.note {
    font-style: italic;
    color: #666;
    margin-top: 0.5rem;
}
</style>
```

#### 5. Component: `ComputationSteps.vue`

**Purpose:** Display step-by-step calculation breakdown

```vue
<template>
    <div class="computation-steps">
        <div v-for="(step, index) in steps" :key="index" class="step">
            <div class="step-number">{{ index + 1 }}.</div>
            <div class="step-content">
                <div class="step-description">{{ step.description }}</div>
                <div
                    v-if="step.expression"
                    class="step-expression"
                    v-html="renderExpression(step.expression)"
                />
                <div v-if="step.result !== undefined" class="step-result">
                    = {{ formatResult(step.result, step.unit) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import katex from 'katex';
import type { ComputationStep } from '@/utils/fieldInsights';

defineProps<{
    steps: ComputationStep[];
}>();

const renderExpression = (expression: string): string => {
    try {
        return katex.renderToString(expression, {
            displayMode: false,
            throwOnError: false,
        });
    } catch {
        return expression;
    }
};

const formatResult = (result: number, unit: string): string => {
    const formatted = Math.abs(result) < 0.01 ? result.toExponential(2) : result.toFixed(2);
    return `${formatted} ${unit}`;
};
</script>

<style scoped>
.computation-steps {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.step {
    display: flex;
    gap: 0.5rem;
}

.step-number {
    font-weight: 600;
    color: #1976d2;
    min-width: 1.5rem;
}

.step-content {
    flex: 1;
}

.step-description {
    margin-bottom: 0.25rem;
}

.step-expression {
    font-family: 'Times New Roman', serif;
    padding: 0.25rem 0.5rem;
    background: white;
    border-radius: 2px;
    margin: 0.25rem 0;
}

.step-result {
    font-weight: 600;
    color: #2e7d32;
    margin-top: 0.25rem;
}
</style>
```

### Enhanced Existing Components

#### Update `useChart.ts` - Add Click Handler

```typescript
// In useChart.ts composable

import { usePointSelection } from './usePointSelection';

export function useChart(/* existing params */) {
    const { selectPoint } = usePointSelection(path);

    // ... existing chart setup ...

    const handleChartClick = (event: ChartEvent) => {
        const points = chart.getElementsAtEventForMode(event, 'index', { intersect: false }, false);

        if (points.length > 0) {
            const index = points[0].index;
            selectPoint(index);
        }
    };

    // Register click handler
    chart.options.onClick = handleChartClick;

    // Add visual indicator for selected point
    const selectedLinePlugin = {
        id: 'selectedLine',
        afterDraw: (chart: Chart) => {
            if (selectedIndex.value === null) return;

            // Draw vertical line at selected point
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data[selectedIndex.value]) return;

            const x = meta.data[selectedIndex.value].x;
            const ctx = chart.ctx;

            ctx.save();
            ctx.strokeStyle = '#FF5722';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x, chart.chartArea.top);
            ctx.lineTo(x, chart.chartArea.bottom);
            ctx.stroke();
            ctx.restore();
        },
    };

    chart.plugins.register(selectedLinePlugin);

    // ... rest of existing code ...
}
```

#### Update `useMap.ts` - Add Click Handler

```typescript
// In useMap.ts composable

import { usePointSelection } from './usePointSelection';

export function useMap(/* existing params */) {
    const { selectPoint } = usePointSelection(path);

    // ... existing map setup ...

    // Add click handler to polyline
    polyline.on('click', (e: LeafletMouseEvent) => {
        const clickedLatLng = e.latlng;
        const index = findNearestPointIndex(clickedLatLng, path.value);
        selectPoint(index);
    });

    // Add selection marker (different from hover marker)
    const selectionMarker = ref<L.Marker | null>(null);

    watch(selectedIndex, index => {
        if (selectionMarker.value) {
            map.removeLayer(selectionMarker.value);
            selectionMarker.value = null;
        }

        if (index !== null && path.value) {
            const lat = path.value.getLatitude(index) * (180 / Math.PI);
            const lon = path.value.getLongitude(index) * (180 / Math.PI);

            selectionMarker.value = L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'selection-marker',
                    html: '<div class="marker-inner"></div>',
                    iconSize: [16, 16],
                }),
            }).addTo(map);
        }
    });

    // ... rest of existing code ...
}
```

### Data Utilities

#### Create `utils/fieldInsights.ts`

```typescript
import { Path, PointField } from '@/types/path';

export enum ComputationType {
    FORMULA = 'formula',
    ALGORITHM = 'algorithm',
    EXTERNAL = 'external',
    RAW_DATA = 'raw_data',
}

export enum FieldCategory {
    GPS_DATA = 'GPS Data',
    GEOMETRY = 'Path Geometry',
    MOTION = 'Motion & Speed',
    POWER = 'Power Components',
    AERO = 'Aerodynamics',
    CYCLIST = 'Cyclist Performance',
}

export interface FieldDefinition {
    field: PointField;
    symbol: string;
    name: string;
    unit: string;
    category: FieldCategory;
    computationType: ComputationType;

    // Type 1: Simple formula
    formula?: string; // LaTeX
    formulaExplanation?: string;

    // Type 2: Algorithm
    algorithmSteps?: AlgorithmStep[];
    implementationRef?: string;

    // Type 3: External
    dataSource?: string;

    // All types
    dependencies?: string[];
}

export interface AlgorithmStep {
    number: number;
    description: string;
    code?: string;
}

export interface ComputationStep {
    description: string;
    expression: string; // LaTeX or plain text
    result: number;
    unit: string;
}

export interface FieldInsight extends FieldDefinition {
    value: number;
}

export interface CategoryData {
    name: string;
    icon: string;
    fields: FieldInsight[];
    defaultExpanded: boolean;
}

// Field definitions with all metadata
export const FIELD_DEFINITIONS: FieldDefinition[] = [
    // GPS Data
    {
        field: PointField.LATITUDE,
        symbol: 'lat',
        name: 'Latitude',
        unit: '°',
        category: FieldCategory.GPS_DATA,
        computationType: ComputationType.RAW_DATA,
        dependencies: [],
    },
    {
        field: PointField.ELEVATION,
        symbol: 'h',
        name: 'Elevation',
        unit: 'm',
        category: FieldCategory.GPS_DATA,
        computationType: ComputationType.EXTERNAL,
        dataSource: '@glandais/elevation package (external terrain API)',
        dependencies: [],
    },

    // Path Geometry
    {
        field: PointField.GRADE,
        symbol: 'g',
        name: 'Grade',
        unit: '%',
        category: FieldCategory.GEOMETRY,
        computationType: ComputationType.FORMULA,
        formula: String.raw`g = \frac{\Delta h}{\Delta d} \times 100`,
        formulaExplanation: 'Change in elevation divided by horizontal distance',
        dependencies: ['h', 'd'],
    },

    // Motion & Speed
    {
        field: PointField.RADIUS,
        symbol: 'r',
        name: 'Radius',
        unit: 'm',
        category: FieldCategory.MOTION,
        computationType: ComputationType.ALGORITHM,
        algorithmSteps: [
            {
                number: 1,
                description: 'Transform 3 consecutive GPS points to local Cartesian coordinates',
                code: 'MaxSpeedComputer.transform(prev, current, next)',
            },
            {
                number: 2,
                description: 'Find circle center through 3 points (circumcenter)',
                code: 'MaxSpeedComputer.getCircleCenter(p1, p2, p3)',
            },
            {
                number: 3,
                description: 'Calculate radius from center to current point',
                code: 'r = Math.hypot(center.x, center.y)',
            },
            {
                number: 4,
                description: 'Add 2m safety margin for trajectory uncertainty',
                code: 'r_final = r + 2',
            },
        ],
        implementationRef: 'MaxSpeedComputer.ts:100-140',
        dependencies: ['lat', 'lon'],
    },

    // Power Components
    {
        field: PointField.P_AERO,
        symbol: 'P_a',
        name: 'Aerodynamic Power',
        unit: 'W',
        category: FieldCategory.POWER,
        computationType: ComputationType.FORMULA,
        formula: String.raw`P_a = \frac{1}{2} \rho \cdot C_{dA} \cdot (v - v_w)^3`,
        formulaExplanation: 'Drag power increases with cube of relative wind speed',
        dependencies: ['v', 'v_w', 'ρ', 'C_d'],
    },

    // ... Add all 34 fields ...
];

// Get all field insights for a specific point
export function getFieldInsights(path: Path, index: number): FieldInsight[] {
    return FIELD_DEFINITIONS.map(def => ({
        ...def,
        value: path.getField(index, def.field),
    }));
}

// Get field insights organized by category
export function getFieldCategories(path: Path, index: number): CategoryData[] {
    const insights = getFieldInsights(path, index);

    const categories = [
        {
            name: FieldCategory.GPS_DATA,
            icon: '📍',
            defaultExpanded: false,
        },
        {
            name: FieldCategory.GEOMETRY,
            icon: '📐',
            defaultExpanded: true,
        },
        {
            name: FieldCategory.MOTION,
            icon: '🚴',
            defaultExpanded: true,
        },
        {
            name: FieldCategory.POWER,
            icon: '⚡',
            defaultExpanded: true,
        },
        {
            name: FieldCategory.AERO,
            icon: '💨',
            defaultExpanded: false,
        },
        {
            name: FieldCategory.CYCLIST,
            icon: '👤',
            defaultExpanded: false,
        },
    ];

    return categories.map(cat => ({
        ...cat,
        fields: insights.filter(f => f.category === cat.name),
    }));
}

// Get computation steps for a field at a specific point
export function getComputationSteps(
    path: Path,
    index: number,
    field: PointField
): ComputationStep[] {
    // Implementation would calculate step-by-step for each field type
    // Example for grade:
    if (field === PointField.GRADE && index > 0) {
        const h1 = path.getElevation(index);
        const h0 = path.getElevation(index - 1);
        const d1 = path.getDistance(index);
        const d0 = path.getDistance(index - 1);
        const dh = h1 - h0;
        const dd = d1 - d0;
        const grade = (dh / dd) * 100;

        return [
            {
                description: 'Get current elevation',
                expression: String.raw`h_1`,
                result: h1,
                unit: 'm',
            },
            {
                description: 'Get previous elevation',
                expression: String.raw`h_0`,
                result: h0,
                unit: 'm',
            },
            {
                description: 'Calculate elevation change',
                expression: String.raw`\Delta h = h_1 - h_0`,
                result: dh,
                unit: 'm',
            },
            {
                description: 'Get current distance',
                expression: String.raw`d_1`,
                result: d1,
                unit: 'm',
            },
            {
                description: 'Get previous distance',
                expression: String.raw`d_0`,
                result: d0,
                unit: 'm',
            },
            {
                description: 'Calculate distance change',
                expression: String.raw`\Delta d = d_1 - d_0`,
                result: dd,
                unit: 'm',
            },
            {
                description: 'Calculate grade',
                expression: String.raw`g = \frac{\Delta h}{\Delta d} \times 100`,
                result: grade,
                unit: '%',
            },
        ];
    }

    // ... Implement for other fields ...

    return [];
}
```

---

## 📋 Implementation Phases

### Phase 1: Selection Infrastructure (Core Mechanics)

**Goal:** Enable point selection and basic panel display

**Tasks:**

1. Create `composables/usePointSelection.ts` composable
    - State management for selected point index
    - Keyboard navigation (Arrow keys, Escape)
    - Methods: selectPoint, clearSelection, nextPoint, previousPoint

2. Update `composables/useChart.ts`
    - Add click handler to Chart.js
    - Add custom plugin for selected point visual indicator (vertical line)

3. Update `composables/useMap.ts`
    - Add click handler to Leaflet polyline
    - Create selection marker (different style from hover marker)
    - Watch selectedIndex and update marker position

4. Create basic `components/PointInsightsPanel.vue`
    - Right side panel with sticky header
    - Close button functionality
    - Basic layout structure

5. Integrate into `App.vue`
    - Import usePointSelection composable
    - Add PointInsightsPanel component
    - Wire up selection state

**Deliverables:**

- Click on chart or map selects a point
- Panel opens on right side
- Keyboard navigation works
- Visual indicators on chart and map
- Close button and Escape key work

**Testing:**

- Click various points and verify selection
- Test keyboard navigation (arrows, escape)
- Verify visual indicators appear correctly
- Test panel open/close

---

### Phase 2: Field Organization & Display

**Goal:** Display all fields organized by category

**Tasks:**

1. Create `utils/fieldInsights.ts`
    - Define FieldCategory enum
    - Define ComputationType enum
    - Create FIELD_DEFINITIONS array with metadata for all 34 fields
    - Implement getFieldInsights() and getFieldCategories()

2. Create `components/CategorySection.vue`
    - Collapsible section with expand/collapse animation
    - Header with icon, name, field count
    - List of fields in category
    - Default expanded state

3. Create `components/FieldInsight.vue`
    - Display: symbol + name + value + unit
    - Badge showing computation type
    - Click handler for expansion (prepared for Phase 3)
    - Proper value formatting with appropriate precision

4. Update `PointInsightsPanel.vue`
    - Fetch field categories from utility
    - Render CategorySection components
    - Handle field click events

5. Implement value formatting
    - Unit conversions (m to km, m/s to km/h, etc.)
    - Appropriate decimal precision
    - Handle very small/large numbers
    - Color coding (positive/negative for power fields)

**Deliverables:**

- Panel shows all 34 fields organized into 6 categories
- Categories can be expanded/collapsed
- Each field shows: symbol, name, formatted value, unit, badge
- Proper styling and visual hierarchy
- Responsive to different panel widths

**Testing:**

- Verify all 34 fields appear
- Check value formatting for various field types
- Test expand/collapse animations
- Verify badges show correct computation type

---

### Phase 3: Formula Rendering & Computation Details

**Goal:** Show formulas, algorithms, and step-by-step calculations

**Tasks:**

1. Install KaTeX

    ```bash
    npm install katex @types/katex
    ```

    - Add to dependencies
    - Import CSS globally in main.ts or App.vue

2. Extend `utils/fieldInsights.ts`
    - Add LaTeX formulas to all Type 1 fields
    - Add algorithm steps to all Type 2 fields
    - Add data source descriptions for Type 3/4 fields
    - Implement getComputationSteps() for key fields

3. Update `FieldInsight.vue`
    - Add expandable detail section
    - Render formulas with KaTeX
    - Show different content based on ComputationType
    - Add dependencies list with clickable links

4. Create `components/ComputationSteps.vue`
    - Display step-by-step calculation
    - Render LaTeX expressions for each step
    - Show intermediate results
    - Proper formatting and styling

5. Create `components/AlgorithmSteps.vue`
    - Display numbered algorithm steps
    - Show pseudocode or code snippets
    - Link to implementation file
    - Show results for this specific point

6. Implement dependency navigation
    - Make dependency symbols clickable
    - Scroll to and highlight target field
    - Visual indication of dependency relationships

**Deliverables:**

- Click any field to see computation details
- Type 1 (Formula): LaTeX formula + step-by-step calculation
- Type 2 (Algorithm): Numbered steps + implementation reference
- Type 3 (External): Data source explanation
- Type 4 (Raw): Source indication
- Dependencies are clickable and navigate correctly
- Professional LaTeX rendering

**Testing:**

- Test formula rendering for all Type 1 fields
- Verify algorithm display for Type 2 fields (radius, speedMax)
- Check computation steps show correct intermediate values
- Test dependency navigation
- Verify KaTeX handles all our formulas correctly

---

### Phase 4: Polish & Enhancement (Optional/Future)

**Goal:** Additional features and improvements

**Tasks:**

1. Add "Copy data" functionality
    - Export point data as JSON
    - Export point data as CSV
    - Copy button for individual fields

2. Implement point comparison
    - Compare current point with neighboring points
    - Show deltas (e.g., "Grade increased by 1.2% from previous point")
    - Highlight significant changes

3. Add field search/filter
    - Search box to filter fields by name or symbol
    - Quick jump to specific field
    - Recently viewed fields list

4. Interactive parameter adjustment (math.js)
    - Install math.js
    - "What if" mode for key parameters
    - Sliders for cyclist weight, bike weight, CdA, etc.
    - Live recalculation of affected fields
    - Sensitivity analysis visualization

5. Visual enhancements
    - Smooth animations for expand/collapse
    - Loading states for heavy calculations
    - Tooltips with additional context
    - Dark mode support

6. Responsive design
    - Collapse panel by default on smaller screens
    - Mobile-friendly interactions
    - Touch gesture support

7. Export/Share capabilities
    - Generate shareable link with selected point
    - Export insights as PDF report
    - Bookmark interesting points

8. Accessibility
    - ARIA labels for screen readers
    - Keyboard-only navigation
    - Focus management
    - High contrast mode

**Deliverables (as needed):**

- Enhanced user experience
- Additional utility features
- Better mobile support
- Improved accessibility

---

## 🎯 Success Criteria

### Functional Requirements

- ✅ User can click any point on chart or map to select it
- ✅ Selection opens detailed insights panel
- ✅ All 34 fields are displayed and organized into 6 categories
- ✅ Each field shows symbol, name, value, unit, and computation type badge
- ✅ Click any field to see formula/algorithm/source details
- ✅ Formulas are properly rendered with KaTeX
- ✅ Step-by-step calculations show intermediate values
- ✅ Dependencies are listed and clickable
- ✅ Keyboard navigation works (arrows to navigate points, escape to close)
- ✅ Visual indicators on chart and map show selected point

### Quality Requirements

- ✅ Professional visual design
- ✅ Fast performance (< 100ms to open panel, < 50ms to render formulas)
- ✅ No console errors or warnings
- ✅ TypeScript type safety maintained
- ✅ Responsive layout (works on various screen sizes)
- ✅ Consistent with existing demo design language

### Technical Requirements

- ✅ Bundle size increase ≤ 200KB (KaTeX + new components)
- ✅ All formulas render correctly in KaTeX
- ✅ No breaking changes to existing demo functionality
- ✅ Code follows project conventions (composables pattern, TypeScript strict mode)
- ✅ Reusable component architecture for future enhancements

---

## 📚 Resources

### KaTeX

- Official Docs: https://katex.org/docs/api.html
- Supported Functions: https://katex.org/docs/supported.html
- Vue Integration: Use v-html with renderToString()

### Physics Formulas

- Reference existing implementation in:
    - `src/physics/MaxSpeedComputer.ts` - Speed calculations
    - `src/physics/power/` - Power component formulas
    - `src/processing/EcefConverter.ts` - Coordinate transformations

### Vue 3 Best Practices

- Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- TypeScript: https://vuejs.org/guide/typescript/overview.html
- Composables Pattern: https://vuejs.org/guide/reusability/composables.html

### Existing Demo Code

- Study `useHoverSync.ts` for interaction patterns
- Reference `DataChart.vue` for Chart.js integration
- Check `MapView.vue` for Leaflet patterns
- Review `FieldsSidebar.vue` for field organization UI

---

## 🔄 Future Enhancements

### Potential Features (Post-Implementation)

1. **Comparison Mode**
    - Select multiple points
    - Side-by-side comparison
    - Highlight differences

2. **Annotations & Bookmarks**
    - Add notes to specific points
    - Bookmark interesting locations
    - Export/import bookmarks

3. **Historical Data**
    - Compare multiple rides
    - Overlay previous performance
    - Progress tracking

4. **Interactive Recalculation**
    - Adjust parameters live (using math.js)
    - "What if" scenario analysis
    - Sensitivity analysis charts

5. **Advanced Visualizations**
    - 3D path visualization
    - Power curve analysis
    - Speed distribution histograms
    - Grade profiles

6. **Export & Sharing**
    - Export insights as PDF
    - Share specific points via URL
    - Generate ride reports

7. **AI-Powered Insights**
    - Suggest optimal pacing strategy
    - Identify training opportunities
    - Compare with similar routes

---

## 📝 Notes

- This architecture prioritizes **progressive disclosure** to avoid overwhelming users
- Symbol system creates **visual consistency** between field list and formulas
- Four computation types allow **appropriate presentation** for each field
- KaTeX provides **fast, professional** math rendering at minimal bundle cost
- Composables pattern maintains **consistency** with existing demo architecture
- Phase-based implementation allows **incremental delivery** and testing

---

**Last Updated:** 2025-10-15
**Status:** Architecture Design Complete, Ready for Implementation
