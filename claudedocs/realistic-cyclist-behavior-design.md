# Realistic Virtual Cyclist Behavior Design

## Document Purpose

This document provides a complete specification for implementing realistic cyclist behavior simulation in the Virtual Cyclist library. It captures design decisions, parameter structures, algorithms, and integration strategies for creating human-like cycling behavior rather than optimal AI performance.

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Design Philosophy](#design-philosophy)
3. [Core Architecture](#core-architecture)
4. [Personality Parameters](#personality-parameters)
5. [Energy State Machine](#energy-state-machine)
6. [Terrain Analysis System](#terrain-analysis-system)
7. [Decision Heuristics](#decision-heuristics)
8. [Power Transition System](#power-transition-system)
9. [Integration Strategy](#integration-strategy)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Testing Strategy](#testing-strategy)

---

## Problem Statement

### Current Situation

The existing `CyclistPowerProviderBase` provides power based on `getOptimalPower()`. The system can calculate the power needed to maintain current speed:

```typescript
const powerNeeded = -PowerComputer.INSTANCE.getNewPower(course, path, pointIndex, false);
```

### The Challenge

Create a realistic cyclist simulation that exhibits human-like behavior:

- **Imperfect decisions**: "Good enough" rather than mathematically optimal
- **Delayed reactions**: Recognition and response delays to terrain changes
- **Energy management**: Conservative approach with fatigue modeling
- **Tactical awareness**: Terrain exploitation based on experience level
- **Personality variation**: Different cyclist types behave differently

### Key Example Scenario

**Valley Pattern**: Cyclist speeding down descent → 200m short climb → descending false flat

A real cyclist would:

1. Recognize the upcoming climb (if experienced)
2. Push slightly harder in the descent to carry speed
3. React when gradient hits (some delay)
4. Know recovery is available after the climb
5. Make conservative power decisions to avoid bonking

**Not** calculate the mathematically optimal power profile.

---

## Design Philosophy

### Core Principles

1. **Realistic over Optimal**: Simulate human behavior, not perfect algorithms
2. **Imperfect Information**: Limited look-ahead based on experience
3. **Delayed Reactions**: 2-8 second cognitive delays
4. **Comfort Zones**: Cyclists prefer familiar power ranges
5. **Conservative Energy**: Fear of bonking drives cautious management
6. **Personality-Driven**: Parameterizable behavior traits
7. **Contextual Intelligence**: Different decisions in different situations

### What Makes Behavior Feel Real

- Imperfect decisions that are "good enough"
- Delayed reactions to terrain changes
- Conservative energy management
- Emotional/psychological factors (momentum, fatigue, confidence)
- Personality-driven variety
- Mid-effort adjustments based on "feel"
- Occasional misjudgments and surprises

---

## Core Architecture

### System Flow

```
Every simulation step (1 second):

1. TERRAIN ANALYSIS
   ├─ Calculate look-ahead distance (15-90s based on experience/familiarity)
   ├─ Sample gradient profile ahead
   ├─ Classify terrain segments (steep climb, descent, etc.)
   └─ Detect tactical features (valleys, hills, recovery sections)

2. ENERGY UPDATE
   ├─ Calculate power expenditure from last step
   ├─ Update energy level based on power vs threshold
   ├─ Check for state transitions (FRESH→GOOD→WORKING→etc)
   └─ Apply personality modifiers (pain tolerance, recovery rate)

3. DECISION MAKING
   ├─ Evaluate heuristic rules by priority
   ├─ Score tactical opportunities
   ├─ Check energy feasibility
   ├─ Apply personality filters
   └─ Select target power + reasoning

4. POWER TRANSITION
   ├─ Check if still in reaction delay
   ├─ Calculate ramp rate based on situation
   ├─ Apply power change (deltaTime * rampRate)
   ├─ Add micro-variations (jitter)
   └─ Optional: mid-transition "feel" adjustment

5. OUTPUT
   └─ Return current actual power to physics engine
```

### Key Components

```typescript
// Main behavior provider
class RealisticCyclistPowerProvider extends CyclistPowerProviderBase {
    private behaviorProfile: CyclistBehaviorProfile;
    private energyState: EnergyStateData;
    private powerTransition: PowerTransitionState;
    private terrainAnalyzer: TerrainAnalyzer;
    private decisionEngine: DecisionEngine;

    getOptimalPower(course: Course, path: Path, pointIndex: number): number {
        // 1. Analyze terrain ahead
        const terrain = this.terrainAnalyzer.analyze(path, pointIndex, this.behaviorProfile);

        // 2. Get baseline power needed for current conditions
        const powerNeeded = -PowerComputer.INSTANCE.getNewPower(course, path, pointIndex, false);

        // 3. Make decision based on terrain + energy + personality
        const decision = this.decisionEngine.evaluate(
            terrain,
            this.energyState,
            this.behaviorProfile,
            powerNeeded,
            this.getCurrentSpeed(path, pointIndex)
        );

        // 4. Update energy state
        this.energyState = this.updateEnergyState(
            this.powerTransition.currentPower,
            powerNeeded,
            deltaTime
        );

        // 5. Update power transition toward target
        const actualPower = this.updatePowerTransition(decision.targetPower, deltaTime);

        return actualPower;
    }
}
```

---

## Personality Parameters

### Core Structure

```typescript
interface CyclistBehaviorProfile {
    // Core traits (0.0 - 1.0 scale)
    aggression: number; // Power usage intensity
    experience: number; // Decision quality & terrain anticipation
    riskTolerance: number; // Willingness to go deep
    conservatism: number; // Energy preservation vs exploitation

    // Physical/mental characteristics
    painTolerance: number; // Ability to sustain high efforts
    recoveryRate: number; // How quickly energy regenerates
    tacticalAwareness: number; // Terrain exploitation skill
    paceConsistency: number; // Smoothness vs variability

    // Cognitive aspects
    reactionSpeed: number; // How quickly they respond to changes
    optimism: number; // Over/under estimation of capabilities

    // Optional route-specific
    routeFamiliarity?: number; // Look-ahead distance modifier (0-1)
}
```

### Parameter Influence Map

#### Aggression (0.0 - 1.0)

**Range Descriptions:**

- **0.0-0.3**: Passive - steady effort, rarely surges, conservative on climbs
- **0.4-0.6**: Balanced - tactical surges, responds to terrain
- **0.7-1.0**: Aggressive - frequent attacks, always pushing limits

**Influences:**

- Base power target: `optimalPower * (0.92 + aggression * 0.16)` → 92%-108%
- Pre-climb surge magnitude: `1.10 + aggression * 0.15` → 110%-125%
- Recovery willingness: Low aggression = quicker to back off
- Momentum preservation: High aggression = more likely to carry speed

#### Experience (0.0 - 1.0)

**Range Descriptions:**

- **0.0-0.3**: Novice - reactive only, poor decisions, frequent surprises
- **0.4-0.6**: Intermediate - decent anticipation, learning
- **0.7-1.0**: Expert - excellent terrain reading, optimal tactics

**Influences:**

- Look-ahead distance: `15 + experience * 45` → 15-60 seconds
- Decision quality: Reduces random noise, better power targeting
- Surprise factor: Low experience = gradient changes feel steeper than expected
- Tactical recognition: Higher experience = identifies opportunities faster

#### Risk Tolerance (0.0 - 1.0)

**Range Descriptions:**

- **0.0-0.3**: Cautious - always leaves reserves, fears bonking
- **0.4-0.6**: Measured - calculated risks
- **0.7-1.0**: Fearless - willing to empty the tank

**Influences:**

- Energy threshold for hard efforts: Low risk won't surge if energy < "Fresh"
- Maximum power ceiling: `optimalPower * (1.1 + riskTolerance * 0.3)` → 110%-140%
- Recovery trigger point: Cautious riders recover earlier
- Tactical opportunity exploitation: High risk = more willing to gamble

#### Conservatism (0.0 - 1.0)

**Meaning**: Inverse of exploitation - prefers steady state over terrain tactics

**Influences:**

- Tactical decision frequency: High conservatism = fewer surges/coasts
- Power variability: Conservative = smooth, exploitative = spiky
- Descent behavior: Conservative = soft pedal, exploitative = full gas
- Energy preservation: High conservatism = always saves energy

#### Pain Tolerance (0.0 - 1.0)

**Meaning**: Ability to sustain efforts above threshold

**Influences:**

- Time-to-fatigue at high power: High tolerance = slower energy state degradation
- Recovery requirement: Low tolerance = needs longer recovery periods
- Quitting threshold: Low tolerance = backs off sooner when hurting
- Energy depletion rate modifier: `1.3 - painTolerance * 0.6`

#### Recovery Rate (0.0 - 1.0)

**Meaning**: Physiological recovery speed

**Influences:**

- Energy state transition speed during easy efforts
- Minimum recovery time needed between hard efforts
- Willingness to surge again after recent effort
- Energy regeneration multiplier: `0.6 + recoveryRate * 0.8`

#### Tactical Awareness (0.0 - 1.0)

**Meaning**: Ability to recognize and exploit terrain opportunities

**Influences:**

- Recognition of "short climb then recovery" patterns
- Pre-corner acceleration decisions
- Look-ahead distance bonus: `+tacticalAwareness * 15` seconds
- Decision confidence in tactical situations

#### Pace Consistency (0.0 - 1.0)

**Meaning**: Power output smoothness

**Influences:**

- Power variability: High consistency = ±2%, low = ±8%
- Response damping: High consistency = gradual changes
- Random noise magnitude in decisions
- Micro-adjustment frequency

#### Reaction Speed (0.0 - 1.0)

**Meaning**: Cognitive and physical response time

**Influences:**

- Recognition delay: `2 + (1 - reactionSpeed) * 6` → 2-8 seconds
- Power ramp rate: Fast = 80W/s, slow = 30W/s
- Surprise mitigation: Faster reactions = better handling of unexpected gradients
- Mid-transition adjustment speed

#### Optimism (0.0 - 1.0)

**Meaning**: Self-assessment accuracy (over/under estimation)

**Influences:**

- Energy state perception: Optimistic riders think they have more energy than they do
- Gradient estimation: Optimistic = underestimates climb difficulty
- Recovery time: Optimistic = thinks they've recovered before they actually have
- Decision confidence: Optimistic = overconfident in abilities

### Preset Personality Profiles

```typescript
const PRESETS = {
    // Recreational weekend warrior
    CASUAL: {
        aggression: 0.3,
        experience: 0.4,
        riskTolerance: 0.3,
        conservatism: 0.7,
        painTolerance: 0.4,
        recoveryRate: 0.5,
        tacticalAwareness: 0.3,
        paceConsistency: 0.6,
        reactionSpeed: 0.4,
        optimism: 0.6,
    },

    // Experienced steady rider
    ENDURANCE: {
        aggression: 0.4,
        experience: 0.7,
        riskTolerance: 0.4,
        conservatism: 0.8,
        painTolerance: 0.7,
        recoveryRate: 0.7,
        tacticalAwareness: 0.6,
        paceConsistency: 0.9,
        reactionSpeed: 0.6,
        optimism: 0.5,
    },

    // Club racer - aggressive but smart
    RACER: {
        aggression: 0.7,
        experience: 0.8,
        riskTolerance: 0.7,
        conservatism: 0.3,
        painTolerance: 0.8,
        recoveryRate: 0.6,
        tacticalAwareness: 0.9,
        paceConsistency: 0.5,
        reactionSpeed: 0.8,
        optimism: 0.4,
    },

    // All-out attacker
    AGGRESSIVE: {
        aggression: 0.9,
        experience: 0.6,
        riskTolerance: 0.9,
        conservatism: 0.2,
        painTolerance: 0.7,
        recoveryRate: 0.5,
        tacticalAwareness: 0.7,
        paceConsistency: 0.3,
        reactionSpeed: 0.9,
        optimism: 0.7,
    },

    // Smart time trialist
    TIME_TRIALIST: {
        aggression: 0.5,
        experience: 0.9,
        riskTolerance: 0.6,
        conservatism: 0.6,
        painTolerance: 0.9,
        recoveryRate: 0.5,
        tacticalAwareness: 0.8,
        paceConsistency: 0.95,
        reactionSpeed: 0.7,
        optimism: 0.3,
    },

    // Beginner struggling
    NOVICE: {
        aggression: 0.2,
        experience: 0.2,
        riskTolerance: 0.2,
        conservatism: 0.8,
        painTolerance: 0.3,
        recoveryRate: 0.4,
        tacticalAwareness: 0.2,
        paceConsistency: 0.4,
        reactionSpeed: 0.3,
        optimism: 0.7, // Beginners overestimate abilities
    },
};
```

---

## Energy State Machine

### State Definitions

```typescript
enum EnergyState {
    FRESH = 'FRESH', // 100% - Ready for anything
    GOOD = 'GOOD', // 80-99% - Comfortable, can work hard
    WORKING = 'WORKING', // 60-79% - Feeling it, manageable
    TIRED = 'TIRED', // 40-59% - Survival mode
    VERY_TIRED = 'VERY_TIRED', // 20-39% - Just hanging on
    BONKED = 'BONKED', // 0-19% - System failure
}

interface EnergyStateData {
    state: EnergyState;
    level: number; // 0-100 numeric value
    timeInState: number; // seconds in current state
    timeSinceHardEffort: number; // seconds since last >110% power
    consecutiveHardEfforts: number; // count of efforts with <30s recovery
}
```

### State Transitions

#### FRESH (100%)

- **Depletion**:
    - Power >110% for >10s → -3%/minute
    - Power >100% for >60s → -1.5%/minute
- **Transition**: → GOOD at 99%

#### GOOD (80-99%)

- **Recovery**: Power <80% for >120s → +2%/minute
- **Depletion**:
    - Power >110% for >10s → -4%/minute
    - Power >100% sustained → -2%/minute
- **Transition**: → WORKING at 79%

#### WORKING (60-79%)

- **Recovery**: Power <70% for >180s → +1.5%/minute
- **Depletion**: Power >105% sustained → -3%/minute
- **Transition**: → TIRED at 59%

#### TIRED (40-59%)

- **Recovery**: Power <60% for >240s → +1%/minute
- **Depletion**: Any power >100% → -5%/minute (rapid depletion)
- **Transition**: → VERY_TIRED at 39%

#### VERY_TIRED (20-39%)

- **Recovery**: Power <50% for >300s → +0.5%/minute
- **Depletion**: Power >95% → -6%/minute
- **Transition**: → BONKED at 19%

#### BONKED (0-19%)

- **Recovery**: Power <40% for >600s → +0.3%/minute (very slow)
- **Constraint**: Forced power cap at 70% of optimal
- **Note**: Very difficult to recover from

### Personality Influences on Energy

```typescript
// Pain Tolerance affects depletion rate
const depletionRate = baseDepletionRate * (1.3 - painTolerance * 0.6);
// Range: 0.7x to 1.3x

// Recovery Rate affects regeneration
const recoveryRate = baseRecoveryRate * (0.6 + recoveryRate * 0.8);
// Range: 0.6x to 1.4x

// Optimism affects perceived state
const perceivedState =
    optimism > 0.7
        ? min(actualState + 1, FRESH) // Think they're one level better
        : actualState;

// Risk Tolerance affects warning thresholds
const shouldBackOff =
    riskTolerance < 0.5
        ? energyLevel < 60 // Cautious backs off earlier
        : energyLevel < 40; // Fearless pushes deeper
```

### Consecutive Efforts Penalty

```typescript
if (consecutiveHardEfforts > 3) {
    recoveryRate *= 0.7; // Harder to recover after repeated efforts
}

if (timeSinceHardEffort > 300) {
    // 5 minutes of easy riding
    consecutiveHardEfforts = 0; // Reset counter
}

// Track hard effort
if (currentPower > optimalPower * 1.1 && duration > 10) {
    if (timeSinceHardEffort < 30) {
        consecutiveHardEfforts++;
    }
    timeSinceHardEffort = 0;
}
```

---

## Terrain Analysis System

### Data Structures

```typescript
interface TerrainWindow {
    // Time-based windows
    immediate: TerrainSegment; // 0-10s ahead
    nearTerm: TerrainSegment; // 10-30s ahead
    mediumTerm: TerrainSegment; // 30-60s ahead
    farTerm?: TerrainSegment; // 60s+ (only if experienced/familiar)

    // Key features detected
    features: TerrainFeature[];
}

interface TerrainSegment {
    avgGradient: number; // Average %
    maxGradient: number; // Peak %
    minGradient: number; // Minimum %
    duration: number; // seconds
    distance: number; // meters
    elevationChange: number; // meters
    classification: TerrainType;
}

enum TerrainType {
    STEEP_CLIMB = 'STEEP_CLIMB', // >6%
    MODERATE_CLIMB = 'MODERATE_CLIMB', // 3-6%
    FALSE_FLAT_UP = 'FALSE_FLAT_UP', // 1-3%
    FLAT = 'FLAT', // -1 to 1%
    FALSE_FLAT_DOWN = 'FALSE_FLAT_DOWN', // -3 to -1%
    DESCENT = 'DESCENT', // -6 to -3%
    STEEP_DESCENT = 'STEEP_DESCENT', // <-6%
}

interface TerrainFeature {
    type: FeatureType;
    startsIn: number; // seconds until feature starts
    duration: number; // seconds
    intensity: number; // 0-1 scale (normalized gradient)
    hasRecoveryAfter: boolean; // is there recovery opportunity after?
    confidence: number; // 0-1 how sure about this detection
}

enum FeatureType {
    SHORT_CLIMB = 'SHORT_CLIMB', // <30s climb
    SUSTAINED_CLIMB = 'SUSTAINED_CLIMB', // >30s climb
    VALLEY = 'VALLEY', // Down then up
    HILL = 'HILL', // Up then down
    RECOVERY_SECTION = 'RECOVERY_SECTION', // Descent or easy flat
    TECHNICAL_SECTION = 'TECHNICAL_SECTION', // Corners/variable gradient
}
```

### Look-Ahead Distance Calculation

```typescript
function getLookAheadDistance(profile: CyclistBehaviorProfile, currentSpeed: number): number {
    // Base look-ahead in seconds
    const baseSeconds = 15 + profile.experience * 45; // 15-60s

    // Tactical awareness bonus
    const awarenessBonus = profile.tacticalAwareness * 15; // +0-15s

    // Route familiarity bonus (if known route)
    const familiarityBonus = (profile.routeFamiliarity || 0) * 30; // +0-30s

    const totalSeconds = baseSeconds + awarenessBonus + familiarityBonus;

    // Convert to meters based on current speed
    return currentSpeed * totalSeconds;
}

// Example calculations:
// Novice (exp=0.2, tact=0.2, unfamiliar): 15 + 9 + 3 + 0 = 27s
// Racer (exp=0.8, tact=0.9, knows route): 15 + 36 + 13.5 + 15 = 79.5s
```

### Terrain Classification Algorithm

```typescript
function classifyTerrain(avgGradient: number): TerrainType {
    if (avgGradient > 6) return TerrainType.STEEP_CLIMB;
    if (avgGradient > 3) return TerrainType.MODERATE_CLIMB;
    if (avgGradient > 1) return TerrainType.FALSE_FLAT_UP;
    if (avgGradient > -1) return TerrainType.FLAT;
    if (avgGradient > -3) return TerrainType.FALSE_FLAT_DOWN;
    if (avgGradient > -6) return TerrainType.DESCENT;
    return TerrainType.STEEP_DESCENT;
}
```

### Feature Detection Examples

#### Valley Pattern Detection

```typescript
/**
 * Detect "valley" pattern: descent → climb → descent/flat
 * This is the key example scenario from the conversation
 */
function detectValley(
    gradients: number[],
    distances: number[],
    currentSpeed: number
): TerrainFeature | null {
    // Look for pattern: negative → positive → negative/flat

    let descentEnd = -1;
    let climbEnd = -1;

    // Find descent phase
    for (let i = 0; i < gradients.length; i++) {
        if (gradients[i] < -2) {
            // In descent
            descentEnd = i;
        } else if (descentEnd >= 0) {
            break; // End of descent
        }
    }

    if (descentEnd < 0) return null; // No descent found

    // Find climb phase after descent
    for (let i = descentEnd; i < gradients.length; i++) {
        if (gradients[i] > 2) {
            // Climbing
            climbEnd = i;
        } else if (climbEnd >= 0) {
            break; // End of climb
        }
    }

    if (climbEnd < 0) return null; // No climb after descent

    // Calculate climb characteristics
    const climbDistance = distances[climbEnd] - distances[descentEnd];
    const climbDuration = climbDistance / currentSpeed;
    const avgClimbGradient =
        gradients.slice(descentEnd, climbEnd).reduce((a, b) => a + b, 0) / (climbEnd - descentEnd);

    // Check if recovery after climb
    const hasRecovery =
        climbEnd < gradients.length - 5 &&
        gradients.slice(climbEnd, climbEnd + 5).every(g => g < 1);

    return {
        type: FeatureType.VALLEY,
        startsIn: distances[descentEnd] / currentSpeed,
        duration: climbDuration,
        intensity: avgClimbGradient / 10, // Normalize 0-1
        hasRecoveryAfter: hasRecovery,
        confidence: 0.8,
    };
}
```

#### Short Climb with Recovery Detection

```typescript
function detectShortClimbWithRecovery(
    gradients: number[],
    distances: number[],
    currentSpeed: number
): TerrainFeature | null {
    // Find climb start
    let climbStart = -1;
    for (let i = 0; i < gradients.length; i++) {
        if (gradients[i] > 3) {
            // Significant climb
            climbStart = i;
            break;
        }
    }

    if (climbStart < 0) return null;

    // Calculate climb duration
    let climbEnd = climbStart;
    for (let i = climbStart; i < gradients.length; i++) {
        if (gradients[i] > 2) {
            climbEnd = i;
        } else {
            break;
        }
    }

    const climbDistance = distances[climbEnd] - distances[climbStart];
    const climbDuration = climbDistance / currentSpeed;

    // Only flag if short climb (<30s)
    if (climbDuration > 30) return null;

    // Check for recovery after
    const hasRecovery =
        climbEnd < gradients.length - 5 &&
        gradients.slice(climbEnd, climbEnd + 5).some(g => g < -1);

    if (!hasRecovery) return null;

    const avgGradient =
        gradients.slice(climbStart, climbEnd).reduce((a, b) => a + b, 0) / (climbEnd - climbStart);

    return {
        type: FeatureType.SHORT_CLIMB,
        startsIn: distances[climbStart] / currentSpeed,
        duration: climbDuration,
        intensity: avgGradient / 10,
        hasRecoveryAfter: true,
        confidence: 0.9,
    };
}
```

### Gradient Perception with Experience

```typescript
/**
 * Less experienced riders misread terrain
 * They tend to underestimate on approach, overestimate when climbing
 */
function perceivedGradient(
    actualGradient: number,
    experience: number,
    isCurrentlyClimbing: boolean
): number {
    // Error magnitude decreases with experience
    const maxError = (1 - experience) * 0.3; // Up to 30% error

    // Random component
    const randomNoise = (Math.random() - 0.5) * maxError;

    // Bias: underestimate on approach, overestimate when suffering
    const bias = isCurrentlyClimbing ? maxError * 0.2 : -maxError * 0.1;

    return actualGradient * (1 + randomNoise + bias);
}
```

### Awareness Levels

```
Real cyclist awareness model:

0-10s ahead:  Clear perception (current gradient, speed, power)
              - Can feel road through bike
              - See immediate terrain

10-30s ahead: Good awareness (can see/sense upcoming changes)
              - Visual cues from road ahead
              - Memory if ridden before

30-60s ahead: Vague sense (know if climb/descent coming, rough idea)
              - Limited visual range
              - General memory of route profile

60s+ ahead:   Only if route knowledge is high
              - Must have ridden route before
              - Detailed memory of key features
```

---

## Decision Heuristics

### Decision Framework

```typescript
interface PowerDecision {
    targetPower: number; // Target power in Watts
    confidence: number; // 0-1 how sure about this decision
    reasoning: DecisionReason; // Why this decision was made
    duration: number; // How long to maintain (seconds)
    allowEarlyExit: boolean; // Can bail if it feels too hard?
}

enum DecisionReason {
    MAINTAIN_STEADY = 'MAINTAIN_STEADY',
    PRE_CLIMB_SURGE = 'PRE_CLIMB_SURGE',
    CLIMB_SURVIVAL = 'CLIMB_SURVIVAL',
    RECOVERY_MODE = 'RECOVERY_MODE',
    TACTICAL_PUSH = 'TACTICAL_PUSH',
    MOMENTUM_PRESERVATION = 'MOMENTUM_PRESERVATION',
    COASTING = 'COASTING',
    REACTIVE_ADJUSTMENT = 'REACTIVE_ADJUSTMENT',
}
```

### Decision Priority Hierarchy

```
Priority Order (highest to lowest):

1. SURVIVAL - Energy critically low, must recover
2. REACTIVE - Unexpected gradient change, immediate response needed
3. TACTICAL - Exploit terrain features intelligently
4. STEADY - Default cruising behavior
5. RANDOM_VARIATION - Small noise for realism (±2-5%)
```

### Heuristic Rule Library

#### Rule 1: Steady State (Default)

```typescript
/**
 * Default behavior when nothing special is happening
 */
function evaluateSteadyState(
    optimalPower: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState
): PowerDecision {
    // Base power influenced by aggression
    const basePower = optimalPower * (0.92 + profile.aggression * 0.16);
    // Range: 92% (passive) to 108% (aggressive)

    // Add small random variations based on consistency
    const consistencyNoise = (1 - profile.paceConsistency) * 0.05;
    const noise = (Math.random() - 0.5) * 2 * consistencyNoise;

    const targetPower = basePower * (1 + noise);

    return {
        targetPower,
        confidence: 0.9,
        reasoning: DecisionReason.MAINTAIN_STEADY,
        duration: 10, // Re-evaluate in 10 seconds
        allowEarlyExit: false,
    };
}
```

#### Rule 2: Pre-Climb Surge (Tactical)

```typescript
/**
 * Push harder before a short climb when recovery is available after
 */
function evaluatePreClimbSurge(
    optimalPower: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState,
    shortClimb: TerrainFeature
): PowerDecision | null {
    // Prerequisites
    if (!shortClimb.hasRecoveryAfter) return null;
    if (shortClimb.startsIn > 20) return null; // Too far away
    if (energyState < EnergyState.GOOD) return null; // Too tired
    if (profile.tacticalAwareness < 0.5) return null; // Won't recognize opportunity

    // Calculate surge intensity based on personality
    const aggressionBonus = profile.aggression * 0.15;
    const riskBonus = profile.riskTolerance * 0.1;
    const surgePower = optimalPower * (1.1 + aggressionBonus + riskBonus);
    // Range: 110% to 135%

    // Energy state modulation
    const energyMultiplier =
        energyState === EnergyState.FRESH ? 1.0 : energyState === EnergyState.GOOD ? 0.9 : 0.8;

    const targetPower = surgePower * energyMultiplier;

    return {
        targetPower,
        confidence: profile.tacticalAwareness,
        reasoning: DecisionReason.PRE_CLIMB_SURGE,
        duration: Math.min(shortClimb.startsIn, 15),
        allowEarlyExit: profile.riskTolerance < 0.5, // Cautious can bail
    };
}
```

#### Rule 3: Climb Survival

```typescript
/**
 * When tired and climbing, just get through it
 */
function evaluateClimbSurvival(
    optimalPower: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState,
    currentGradient: number
): PowerDecision | null {
    // Only applies when climbing and energy is low
    if (currentGradient <= 4) return null;
    if (energyState > EnergyState.WORKING) return null;

    // Calculate survival power
    let survivalPower = optimalPower * (0.85 + profile.painTolerance * 0.15);
    // Range: 85% to 100%

    // Further reduction if very tired
    if (energyState === EnergyState.TIRED) {
        survivalPower *= 0.9;
    } else if (energyState === EnergyState.VERY_TIRED) {
        survivalPower *= 0.8;
    }

    return {
        targetPower: survivalPower,
        confidence: 1.0, // Very sure about survival mode
        reasoning: DecisionReason.CLIMB_SURVIVAL,
        duration: 30, // Reassess frequently
        allowEarlyExit: false, // No choice, must climb
    };
}
```

#### Rule 4: Valley Pattern (The Key Example)

```typescript
/**
 * Tactical decision for valley: descent → short climb → recovery
 */
function evaluateValleyPattern(
    optimalPower: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState,
    valley: TerrainFeature,
    currentGradient: number
): PowerDecision | null {
    // Only applies when in descent phase of valley
    if (currentGradient >= -2) return null;
    if (valley.startsIn > 30) return null; // Climb too far away
    if (profile.tacticalAwareness < 0.4) return null;

    // Decision factors
    const experienceConfidence = profile.experience;
    const willingToPush = energyState >= EnergyState.GOOD && profile.riskTolerance > 0.3;

    if (willingToPush) {
        // Push moderately to carry speed through climb
        const pushIntensity = 0.05 + profile.aggression * 0.1;
        // Range: 5% to 15% above optimal

        const targetPower = optimalPower * (1.0 + pushIntensity);

        return {
            targetPower,
            confidence: experienceConfidence * profile.tacticalAwareness,
            reasoning: DecisionReason.TACTICAL_PUSH,
            duration: valley.startsIn, // Until climb starts
            allowEarlyExit: true,
        };
    } else {
        // Conservative: maintain speed, focus on recovery
        return {
            targetPower: optimalPower * 0.95,
            confidence: 0.7,
            reasoning: DecisionReason.RECOVERY_MODE,
            duration: valley.startsIn,
            allowEarlyExit: false,
        };
    }
}
```

#### Rule 5: Recovery Opportunity

```typescript
/**
 * Back off during descents to recover energy
 */
function evaluateRecoveryOpportunity(
    optimalPower: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState,
    currentGradient: number
): PowerDecision | null {
    // Only on descents when tired and conservative
    if (currentGradient >= -3) return null;
    if (energyState > EnergyState.WORKING) return null;
    if (profile.conservatism < 0.5) return null;

    // Recovery intensity based on fatigue level
    const recoveryIntensity =
        energyState === EnergyState.TIRED ? 0.5 : energyState === EnergyState.WORKING ? 0.7 : 0.8;

    return {
        targetPower: optimalPower * recoveryIntensity,
        confidence: 0.9,
        reasoning: DecisionReason.RECOVERY_MODE,
        duration: 60, // Recover for at least a minute
        allowEarlyExit: true, // Can resume if feeling better
    };
}
```

#### Rule 6: Momentum Preservation

```typescript
/**
 * "I'm flying, let's carry this speed!"
 */
function evaluateMomentumPreservation(
    optimalPower: number,
    profile: CyclistBehaviorProfile,
    currentSpeed: number,
    optimalSpeed: number,
    shortClimbAhead: TerrainFeature | null
): PowerDecision | null {
    // Prerequisites
    if (currentSpeed <= optimalSpeed * 1.1) return null; // Not going fast enough
    if (!shortClimbAhead || shortClimbAhead.startsIn > 15) return null;
    if (profile.aggression < 0.5) return null;

    // Calculate momentum bonus
    const speedRatio = currentSpeed / optimalSpeed;
    const momentumBonus = Math.min(speedRatio - 1, 0.2); // Cap at +20%
    const aggressionBonus = profile.aggression * 0.1;

    const targetPower = optimalPower * (1.0 + momentumBonus + aggressionBonus);

    return {
        targetPower,
        confidence: profile.experience * 0.8,
        reasoning: DecisionReason.MOMENTUM_PRESERVATION,
        duration: shortClimbAhead.startsIn,
        allowEarlyExit: true, // Can bail if too hard
    };
}
```

#### Rule 7: Surprise Reaction

```typescript
/**
 * "Whoa, this is steeper/easier than expected!"
 */
function evaluateSurpriseReaction(
    optimalPower: number,
    profile: CyclistBehaviorProfile,
    perceivedGradient: number,
    actualGradient: number,
    timeAtCurrentGradient: number
): PowerDecision | null {
    // Only in first few seconds of gradient change
    if (timeAtCurrentGradient > 5) return null;

    const gradientError = Math.abs(perceivedGradient - actualGradient);
    if (gradientError < 2) return null; // Not surprising enough

    // Reaction delay based on reaction speed
    const reactionDelay = 2 + (1 - profile.reactionSpeed) * 4; // 2-6s

    if (actualGradient > perceivedGradient) {
        // Steeper than expected - emergency power boost
        return {
            targetPower: optimalPower * 1.15,
            confidence: 0.6, // Uncertain, reactive
            reasoning: DecisionReason.REACTIVE_ADJUSTMENT,
            duration: reactionDelay,
            allowEarlyExit: false,
        };
    } else {
        // Easier than expected - can back off
        return {
            targetPower: optimalPower * 0.95,
            confidence: 0.7,
            reasoning: DecisionReason.REACTIVE_ADJUSTMENT,
            duration: reactionDelay,
            allowEarlyExit: true,
        };
    }
}
```

#### Rule 8: Multiple Hard Efforts Penalty

```typescript
/**
 * Fatigue from repeated surges reduces willingness to push
 */
function applyConsecutiveEffortsPenalty(
    decision: PowerDecision,
    consecutiveHardEfforts: number,
    timeSinceHardEffort: number,
    energyState: EnergyState
): PowerDecision {
    // Only apply if multiple recent efforts
    if (consecutiveHardEfforts <= 3) return decision;
    if (timeSinceHardEffort > 180) return decision;

    // Fatigue multiplier
    const fatigueMultiplier = 0.95 - consecutiveHardEfforts * 0.03;
    decision.targetPower *= fatigueMultiplier;

    // Increase recovery desire
    if (decision.reasoning !== DecisionReason.RECOVERY_MODE && energyState < EnergyState.GOOD) {
        decision.targetPower *= 0.85;
        decision.reasoning = DecisionReason.RECOVERY_MODE;
        decision.confidence *= 0.9;
    }

    return decision;
}
```

### Decision Selection Process

```typescript
function selectPowerDecision(
  context: DecisionContext
): PowerDecision {
  const candidates: PowerDecision[] = [];

  // 1. Check SURVIVAL rules first (highest priority)
  if (context.energyState === EnergyState.BONKED) {
    return evaluateRecoveryOpportunity(...); // Forced recovery
  }

  // 2. Check REACTIVE rules (surprises, emergencies)
  const reactive = evaluateSurpriseReaction(...);
  if (reactive) return reactive;

  // 3. Evaluate all TACTICAL rules
  const preClimb = evaluatePreClimbSurge(...);
  if (preClimb) candidates.push(preClimb);

  const valley = evaluateValleyPattern(...);
  if (valley) candidates.push(valley);

  const momentum = evaluateMomentumPreservation(...);
  if (momentum) candidates.push(momentum);

  const recovery = evaluateRecoveryOpportunity(...);
  if (recovery) candidates.push(recovery);

  const survival = evaluateClimbSurvival(...);
  if (survival) candidates.push(survival);

  // 4. Score candidates
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      // Score = confidence * personality alignment
      const scoreA = a.confidence * getPersonalityAlignment(a, context.profile);
      const scoreB = b.confidence * getPersonalityAlignment(b, context.profile);
      return scoreB - scoreA;
    });

    let selected = candidates[0];

    // 5. Apply penalties
    selected = applyConsecutiveEffortsPenalty(...);

    return selected;
  }

  // 6. Fall back to STEADY state
  return evaluateSteadyState(...);
}

function getPersonalityAlignment(
  decision: PowerDecision,
  profile: CyclistBehaviorProfile
): number {
  // How well does this decision match personality?
  switch (decision.reasoning) {
    case DecisionReason.PRE_CLIMB_SURGE:
    case DecisionReason.TACTICAL_PUSH:
      return profile.tacticalAwareness;

    case DecisionReason.RECOVERY_MODE:
      return profile.conservatism;

    case DecisionReason.MOMENTUM_PRESERVATION:
      return profile.aggression;

    default:
      return 0.8;
  }
}
```

---

## Power Transition System

### Data Structures

```typescript
interface PowerTransitionState {
    currentPower: number; // Actual current power output
    targetPower: number; // Where we're trying to get to
    startTime: number; // When transition started (ms)
    reactionDelay: number; // Seconds before starting ramp
    rampRate: number; // Watts per second
    transitionType: TransitionType;
}

enum TransitionType {
    GRADUAL_INCREASE = 'GRADUAL_INCREASE', // Normal acceleration
    GRADUAL_DECREASE = 'GRADUAL_DECREASE', // Normal deceleration
    EMERGENCY_SURGE = 'EMERGENCY_SURGE', // Reactive power spike
    RECOVERY_COAST = 'RECOVERY_COAST', // Backing off quickly
    MICRO_ADJUSTMENT = 'MICRO_ADJUSTMENT', // Small tweaks (<10%)
}
```

### Reaction Delay Calculation

```typescript
function calculateReactionDelay(profile: CyclistBehaviorProfile, situation: SituationType): number {
    // Base delay from reaction speed
    const baseDelay = 2 + (1 - profile.reactionSpeed) * 6; // 2-8 seconds

    // Situation modifiers
    const situationModifiers = {
        STEEP_GRADIENT_CHANGE: 0.5, // Fast reaction to steep changes
        EXPECTED_CLIMB: 1.2, // Slower, anticipated changes
        TACTICAL_OPPORTUNITY: 1.0, // Normal reaction
        RECOVERY_DECISION: 1.5, // Slower to decide to recover
        EMERGENCY: 0.3, // Very fast reaction
    };

    // Experience reduces delay
    const experienceBonus = profile.experience * 2; // Up to -2s

    const totalDelay = baseDelay * situationModifiers[situation] - experienceBonus;

    return Math.max(0.5, totalDelay); // Minimum 0.5s
}

// Example calculations:
// Novice (exp=0.2, react=0.3) + Expected Climb:
//   (2 + 4.2) * 1.2 - 0.4 = 7.04s
//
// Racer (exp=0.8, react=0.8) + Emergency:
//   (2 + 1.2) * 0.3 - 1.6 = -0.64 → 0.5s (capped)
```

### Ramp Rate Calculation

```typescript
function calculateRampRate(
    profile: CyclistBehaviorProfile,
    currentPower: number,
    targetPower: number,
    energyState: EnergyState
): number {
    const powerDelta = Math.abs(targetPower - currentPower);
    const direction = targetPower > currentPower ? 'UP' : 'DOWN';

    // Base ramp rates (Watts per second)
    const baseRateUp = 30 + profile.reactionSpeed * 50; // 30-80 W/s
    const baseRateDown = 40 + profile.reactionSpeed * 60; // 40-100 W/s
    // Easier to reduce power than increase

    let rampRate = direction === 'UP' ? baseRateUp : baseRateDown;

    // Modifier 1: Energy state affects acceleration ability
    if (direction === 'UP') {
        const energyModifiers = {
            [EnergyState.FRESH]: 1.2,
            [EnergyState.GOOD]: 1.0,
            [EnergyState.WORKING]: 0.8,
            [EnergyState.TIRED]: 0.6,
            [EnergyState.VERY_TIRED]: 0.4,
            [EnergyState.BONKED]: 0.2,
        };
        rampRate *= energyModifiers[energyState];
    }

    // Modifier 2: Aggression affects willingness to surge hard
    if (direction === 'UP' && powerDelta > 50) {
        rampRate *= 0.8 + profile.aggression * 0.4; // 0.8x to 1.2x
    }

    // Modifier 3: Pain tolerance affects ability to sustain ramp
    if (direction === 'UP' && targetPower > currentPower * 1.15) {
        rampRate *= 0.7 + profile.painTolerance * 0.6; // 0.7x to 1.3x
    }

    // Modifier 4: Small adjustments are faster (within 10%)
    if (powerDelta < currentPower * 0.1) {
        rampRate *= 1.5; // 50% faster for micro-adjustments
    }

    // Modifier 5: Emergency situations boost ramp rate
    if (profile.reactionSpeed > 0.7 && powerDelta > 100) {
        rampRate *= 1.3; // Experienced riders can respond faster
    }

    return rampRate;
}

// Example calculations:
// Novice (react=0.3) increasing 50W when TIRED:
//   (30 + 15) * 0.6 = 27 W/s → ~1.85s to ramp
//
// Racer (react=0.8, aggr=0.7) surging 100W when GOOD:
//   (30 + 40) * 1.0 * 1.08 * 1.3 = 98.3 W/s → ~1.0s to ramp
```

### Power Transition Update

```typescript
function updatePowerTransition(
    state: PowerTransitionState,
    deltaTime: number, // milliseconds since last update
    profile: CyclistBehaviorProfile
): number {
    // 1. Check if still in reaction delay
    const timeElapsed = (Date.now() - state.startTime) / 1000; // to seconds
    if (timeElapsed < state.reactionDelay) {
        return state.currentPower; // No change yet
    }

    // 2. Calculate power change this frame
    const timeInRamp = timeElapsed - state.reactionDelay;
    const powerChange = state.rampRate * (deltaTime / 1000);

    // 3. Apply change with direction
    let newPower: number;
    if (state.targetPower > state.currentPower) {
        newPower = Math.min(state.currentPower + powerChange, state.targetPower);
    } else {
        newPower = Math.max(state.currentPower - powerChange, state.targetPower);
    }

    // 4. Add micro-variations (human shakiness)
    const consistency = profile.paceConsistency;
    const jitterPercent = (1 - consistency) * 3; // 0-3%
    const noise = (Math.random() - 0.5) * 2 * jitterPercent;
    newPower *= 1 + noise / 100;

    // 5. Check if reached target
    const tolerance = 2; // Within 2W is "close enough"
    if (Math.abs(newPower - state.targetPower) < tolerance) {
        return state.targetPower; // Snap to target
    }

    return newPower;
}
```

### Transition Type Constructors

```typescript
function createGradualTransition(
    current: number,
    target: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState
): PowerTransitionState {
    return {
        currentPower: current,
        targetPower: target,
        startTime: Date.now(),
        reactionDelay: calculateReactionDelay(profile, 'EXPECTED_CLIMB'),
        rampRate: calculateRampRate(profile, current, target, energyState),
        transitionType:
            target > current ? TransitionType.GRADUAL_INCREASE : TransitionType.GRADUAL_DECREASE,
    };
}

function createEmergencyTransition(
    current: number,
    target: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState
): PowerTransitionState {
    return {
        currentPower: current,
        targetPower: target,
        startTime: Date.now(),
        reactionDelay: calculateReactionDelay(profile, 'EMERGENCY'),
        rampRate: calculateRampRate(profile, current, target, energyState) * 1.5,
        transitionType: TransitionType.EMERGENCY_SURGE,
    };
}

function createTacticalSurge(
    current: number,
    target: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState,
    preparationTime: number // How long they knew it was coming
): PowerTransitionState {
    // More preparation = faster execution
    const prepBonus = Math.min(preparationTime / 15, 1.0); // 0-1 over 15s

    return {
        currentPower: current,
        targetPower: target,
        startTime: Date.now(),
        reactionDelay:
            calculateReactionDelay(profile, 'TACTICAL_OPPORTUNITY') * (1 - prepBonus * 0.5),
        rampRate: calculateRampRate(profile, current, target, energyState) * (1 + prepBonus * 0.3),
        transitionType: TransitionType.GRADUAL_INCREASE,
    };
}

function createRecoveryTransition(
    current: number,
    target: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState
): PowerTransitionState {
    return {
        currentPower: current,
        targetPower: target,
        startTime: Date.now(),
        reactionDelay: calculateReactionDelay(profile, 'RECOVERY_DECISION'),
        rampRate: calculateRampRate(profile, current, target, energyState) * 1.3,
        transitionType: TransitionType.RECOVERY_COAST,
    };
}

function createMicroAdjustment(
    current: number,
    target: number,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState
): PowerTransitionState {
    return {
        currentPower: current,
        targetPower: target,
        startTime: Date.now(),
        reactionDelay: 0.5, // Fast for small changes
        rampRate: calculateRampRate(profile, current, target, energyState),
        transitionType: TransitionType.MICRO_ADJUSTMENT,
    };
}
```

### Mid-Transition "Feel" Adjustments

```typescript
/**
 * Cyclists adjust their target mid-effort based on how it feels
 * "This is harder than I thought, I'm backing off"
 * "This feels easy, I can push more"
 */
function checkMidTransitionFeel(
    state: PowerTransitionState,
    profile: CyclistBehaviorProfile,
    energyState: EnergyState,
    timeInTransition: number
): PowerTransitionState | null {
    // Only check after a few seconds into the effort
    if (timeInTransition < 5) return null;

    // Check every 3-5 seconds
    const checkInterval = 3 + (1 - profile.experience) * 2;
    if (timeInTransition % checkInterval > 1) return null;

    // Scenario 1: Effort is harder than expected
    const isHardEffort = state.targetPower > state.currentPower * 1.1;
    const energyIsFading = energyState <= EnergyState.WORKING;
    const lowRiskTolerance = profile.riskTolerance < 0.5;

    if (isHardEffort && energyIsFading && lowRiskTolerance) {
        // "This is too hard, I'm backing off"
        const reducedTarget = state.currentPower + (state.targetPower - state.currentPower) * 0.7;

        return {
            ...state,
            targetPower: reducedTarget,
            reactionDelay: 0, // Immediate adjustment
            rampRate: state.rampRate * 0.5, // Slower now
        };
    }

    // Scenario 2: Effort is easier than expected
    const isEasyEffort = state.targetPower < state.currentPower * 0.9;
    const energyIsGood = energyState >= EnergyState.GOOD;
    const highAggression = profile.aggression > 0.6;

    if (isEasyEffort && energyIsGood && highAggression) {
        // "I feel good, let's push a bit more"
        const increasedTarget = state.targetPower * 0.95; // 5% less reduction

        return {
            ...state,
            targetPower: increasedTarget,
            reactionDelay: 0,
            rampRate: state.rampRate * 1.2,
        };
    }

    return null; // No adjustment needed
}
```

---

## Integration Strategy

### Path Extension Options

Since the current architecture has "path stops at current point", we need terrain context ahead. Three approaches:

#### Option 1: Sliding Window (Recommended)

**Pros:**

- Memory efficient
- Matches realistic "can't see too far ahead"
- Easy to implement with existing Path structure

**Cons:**

- Requires caching and invalidation logic
- Need to query future points from Path

**Implementation:**

```typescript
class TerrainAnalyzer {
    private cache: Map<number, TerrainWindow> = new Map();

    analyze(path: Path, currentIndex: number, profile: CyclistBehaviorProfile): TerrainWindow {
        // Check cache
        if (this.cache.has(currentIndex)) {
            return this.cache.get(currentIndex)!;
        }

        // Calculate look-ahead distance
        const lookAheadMeters = getLookAheadDistance(profile, currentSpeed);

        // Sample gradient profile ahead
        const futureGradients = this.sampleGradientsAhead(path, currentIndex, lookAheadMeters);

        // Build terrain window
        const window = this.buildTerrainWindow(futureGradients);

        // Cache result
        this.cache.set(currentIndex, window);

        // Invalidate old cache entries
        if (this.cache.size > 100) {
            const minIndex = currentIndex - 50;
            for (const key of this.cache.keys()) {
                if (key < minIndex) this.cache.delete(key);
            }
        }

        return window;
    }

    private sampleGradientsAhead(
        path: Path,
        startIndex: number,
        distanceMeters: number
    ): Array<{ gradient: number; distance: number }> {
        const samples: Array<{ gradient: number; distance: number }> = [];
        let distanceCovered = 0;
        let index = startIndex;

        while (distanceCovered < distanceMeters && index < path.length - 1) {
            const gradient = path.getGradient(index);
            const distance = path.getDistance(index);

            samples.push({ gradient, distance });

            distanceCovered += distance;
            index++;
        }

        return samples;
    }
}
```

#### Option 2: Extended Context Path

**Pros:**

- Simpler logic, direct access
- No caching complexity

**Cons:**

- Higher memory usage
- Need to maintain moving window

**Implementation:**

```typescript
interface ExtendedPath extends Path {
    contextRadius: number; // meters ±500m
    getCurrentContext(): Path; // Returns slice around current position
}
```

#### Option 3: Pre-Computed Features

**Pros:**

- Very fast lookups
- No runtime computation

**Cons:**

- Requires full route knowledge (less realistic for "first time")
- Higher initial computation cost

**Implementation:**

```typescript
interface RouteMetadata {
    features: TerrainFeature[];
    gradientProfile: number[];

    getFeaturesNear(position: number, range: number): TerrainFeature[];
}
```

**Recommendation:** Start with **Option 1 (Sliding Window)** for best balance of realism and efficiency.

### Integration with CyclistPowerProviderBase

```typescript
// Current base class (simplified)
abstract class CyclistPowerProviderBase {
    abstract getOptimalPower(course: Course, path: Path, pointIndex: number): number;
}

// New realistic implementation
class RealisticCyclistPowerProvider extends CyclistPowerProviderBase {
    private profile: CyclistBehaviorProfile;
    private energyState: EnergyStateData;
    private powerTransition: PowerTransitionState;
    private terrainAnalyzer: TerrainAnalyzer;
    private decisionEngine: DecisionEngine;
    private lastUpdateTime: number;

    constructor(profile: CyclistBehaviorProfile) {
        super();
        this.profile = profile;
        this.energyState = {
            state: EnergyState.FRESH,
            level: 100,
            timeInState: 0,
            timeSinceHardEffort: 0,
            consecutiveHardEfforts: 0,
        };
        this.terrainAnalyzer = new TerrainAnalyzer();
        this.decisionEngine = new DecisionEngine();
        this.lastUpdateTime = Date.now();
    }

    getOptimalPower(course: Course, path: Path, pointIndex: number): number {
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;

        // 1. Get current state
        const currentSpeed = path.getSpeed(pointIndex);
        const currentGradient = path.getGradient(pointIndex);
        const powerNeeded = -PowerComputer.INSTANCE.getNewPower(course, path, pointIndex, false);

        // 2. Analyze terrain ahead
        const terrainWindow = this.terrainAnalyzer.analyze(path, pointIndex, this.profile);

        // 3. Make power decision
        const decision = this.decisionEngine.evaluate({
            terrain: terrainWindow,
            energyState: this.energyState,
            profile: this.profile,
            powerNeeded,
            currentSpeed,
            currentGradient,
            currentPower: this.powerTransition?.currentPower || powerNeeded,
        });

        // 4. Update energy state
        this.energyState = this.updateEnergyState(
            this.powerTransition?.currentPower || powerNeeded,
            powerNeeded,
            deltaTime / 1000
        );

        // 5. Create or update power transition
        if (
            !this.powerTransition ||
            Math.abs(decision.targetPower - this.powerTransition.targetPower) > 5
        ) {
            this.powerTransition = this.createTransition(
                this.powerTransition?.currentPower || powerNeeded,
                decision.targetPower,
                decision.reasoning
            );
        }

        // 6. Check for mid-transition adjustments
        const timeInTransition = (now - this.powerTransition.startTime) / 1000;
        const adjustment = checkMidTransitionFeel(
            this.powerTransition,
            this.profile,
            this.energyState,
            timeInTransition
        );
        if (adjustment) {
            this.powerTransition = adjustment;
        }

        // 7. Update power transition
        const actualPower = updatePowerTransition(this.powerTransition, deltaTime, this.profile);

        this.powerTransition.currentPower = actualPower;

        return actualPower;
    }

    private updateEnergyState(
        currentPower: number,
        optimalPower: number,
        deltaTimeSeconds: number
    ): EnergyStateData {
        // Implementation of energy state machine transitions
        // See Energy State Machine section for details
        // ...
    }

    private createTransition(
        current: number,
        target: number,
        reasoning: DecisionReason
    ): PowerTransitionState {
        // Select appropriate transition type based on reasoning
        switch (reasoning) {
            case DecisionReason.REACTIVE_ADJUSTMENT:
                return createEmergencyTransition(current, target, this.profile, this.energyState);
            case DecisionReason.RECOVERY_MODE:
                return createRecoveryTransition(current, target, this.profile, this.energyState);
            case DecisionReason.PRE_CLIMB_SURGE:
            case DecisionReason.TACTICAL_PUSH:
                return createTacticalSurge(current, target, this.profile, this.energyState, 10);
            default:
                return createGradualTransition(current, target, this.profile, this.energyState);
        }
    }
}
```

### Usage Example

```typescript
// Create a cyclist with specific personality
const racerProfile: CyclistBehaviorProfile = {
    aggression: 0.7,
    experience: 0.8,
    riskTolerance: 0.7,
    conservatism: 0.3,
    painTolerance: 0.8,
    recoveryRate: 0.6,
    tacticalAwareness: 0.9,
    paceConsistency: 0.5,
    reactionSpeed: 0.8,
    optimism: 0.4,
    routeFamiliarity: 0.8, // Knows this route well
};

// Or use a preset
const casualProfile = PRESETS.CASUAL;

// Create power provider
const powerProvider = new RealisticCyclistPowerProvider(racerProfile);

// Use in VirtualizeService
const virtualizeService = new VirtualizeService();
virtualizeService.setCyclistPowerProvider(powerProvider);

// Run simulation
const results = virtualizeService.virtualize(course, path);
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal:** Basic energy and transition system working

1. **Energy State Machine**
    - Implement `EnergyStateData` structure
    - Build state transition logic
    - Add personality modifiers (pain tolerance, recovery rate)
    - Unit tests for state transitions

2. **Power Transition System**
    - Implement `PowerTransitionState` structure
    - Build ramp rate calculations
    - Add reaction delay logic
    - Unit tests for transitions

3. **Personality Structure**
    - Define `CyclistBehaviorProfile` interface
    - Create preset profiles
    - Validation and bounds checking

**Deliverable:** Can create cyclist with personality, track energy, smooth power changes

### Phase 2: Terrain Analysis (Week 2)

**Goal:** Look-ahead system with basic terrain classification

1. **Terrain Analyzer**
    - Implement sliding window cache
    - Build gradient sampling logic
    - Terrain classification (steep climb, descent, etc.)
    - Look-ahead distance calculation

2. **Basic Feature Detection**
    - Detect climbs vs descents
    - Identify recovery sections
    - Calculate feature timing and intensity

**Deliverable:** System can "see ahead" and classify upcoming terrain

### Phase 3: Basic Decision Making (Week 3)

**Goal:** Core heuristics working

1. **Decision Engine Structure**
    - Implement decision framework
    - Priority system
    - Personality alignment scoring

2. **Essential Heuristics (3-5 rules)**
    - Steady state (default)
    - Climb survival (when tired)
    - Recovery opportunity (descents)
    - Simple pre-climb surge
    - Reactive adjustment (surprises)

**Deliverable:** Cyclist makes basic but realistic decisions

### Phase 4: Advanced Features (Week 4)

**Goal:** Tactical behavior and polish

1. **Advanced Heuristics**
    - Valley pattern detection and handling
    - Momentum preservation
    - Multiple hard efforts penalty
    - Tactical surge timing

2. **Mid-Transition Adjustments**
    - "Feel" system
    - Early exit conditions
    - Dynamic target adjustment

3. **Route Familiarity**
    - Integrate route knowledge parameter
    - Adjust look-ahead based on familiarity
    - Gradient perception with experience

**Deliverable:** Full realistic behavior with personality variation

### Phase 5: Integration & Testing (Week 5)

**Goal:** Production-ready system

1. **Integration**
    - Full integration with `VirtualizeService`
    - Path extension strategy implementation
    - Performance optimization

2. **Comprehensive Testing**
    - Scenario-based tests (see Testing Strategy)
    - Personality profile validation
    - Edge case handling
    - Performance benchmarks

3. **Documentation & Examples**
    - API documentation
    - Usage examples
    - Personality tuning guide

**Deliverable:** Fully tested and documented system ready for use

---

## Testing Strategy

### Unit Tests

```typescript
describe('EnergyStateMachine', () => {
  it('should deplete energy when pushing hard', () => {
    const state = { state: EnergyState.FRESH, level: 100, ... };
    const profile = PRESETS.CASUAL;

    // Simulate 60s at 120% power
    const newState = updateEnergyState(state, optimalPower * 1.2, 60, profile);

    expect(newState.level).toBeLessThan(100);
    expect(newState.state).toBe(EnergyState.GOOD);
  });

  it('should recover energy during easy periods', () => {
    const state = { state: EnergyState.WORKING, level: 70, ... };
    const profile = PRESETS.RACER;

    // Simulate 180s at 60% power
    const newState = updateEnergyState(state, optimalPower * 0.6, 180, profile);

    expect(newState.level).toBeGreaterThan(70);
  });
});

describe('PowerTransition', () => {
  it('should respect reaction delay', () => {
    const transition = createGradualTransition(200, 300, PRESETS.NOVICE, EnergyState.GOOD);

    // Check power immediately (within reaction delay)
    const power1 = updatePowerTransition(transition, 1000, PRESETS.NOVICE);
    expect(power1).toBe(200); // No change yet

    // Check power after reaction delay
    const power2 = updatePowerTransition(transition, 5000, PRESETS.NOVICE);
    expect(power2).toBeGreaterThan(200); // Starting to ramp
  });

  it('should ramp at calculated rate', () => {
    const profile = PRESETS.RACER;
    const rampRate = calculateRampRate(profile, 200, 300, EnergyState.GOOD);

    expect(rampRate).toBeGreaterThan(50); // Fast reaction
    expect(rampRate).toBeLessThan(100);
  });
});

describe('TerrainAnalyzer', () => {
  it('should classify terrain correctly', () => {
    expect(classifyTerrain(8)).toBe(TerrainType.STEEP_CLIMB);
    expect(classifyTerrain(4)).toBe(TerrainType.MODERATE_CLIMB);
    expect(classifyTerrain(0)).toBe(TerrainType.FLAT);
    expect(classifyTerrain(-5)).toBe(TerrainType.DESCENT);
  });

  it('should adjust look-ahead by experience', () => {
    const novice = getLookAheadDistance(PRESETS.NOVICE, 10); // 10 m/s
    const racer = getLookAheadDistance(PRESETS.RACER, 10);

    expect(racer).toBeGreaterThan(novice * 2);
  });
});
```

### Scenario Tests

```typescript
const scenarios = [
    {
        name: 'Valley with short climb',
        description: 'Descent → 200m climb → false flat down',
        terrain: [
            { gradient: -5, distance: 100 },
            { gradient: -3, distance: 50 },
            { gradient: 5, distance: 200 },
            { gradient: -1, distance: 300 },
        ],
        profiles: {
            CASUAL: {
                expectedBehavior: 'Maintain steady power, minimal surge before climb',
                powerRange: [0.92, 1.05],
                surgeTiming: null,
            },
            RACER: {
                expectedBehavior: 'Tactical surge 15-20s before climb starts',
                powerRange: [1.0, 1.25],
                surgeTiming: { start: 15, duration: 20 },
            },
            AGGRESSIVE: {
                expectedBehavior: 'Maximum attack, carry speed through climb',
                powerRange: [1.1, 1.35],
                surgeTiming: { start: 20, duration: 30 },
            },
        },
    },

    {
        name: 'Unexpected steep gradient',
        description: 'Flat suddenly becomes 10% climb',
        terrain: [
            { gradient: 0, distance: 100 },
            { gradient: 10, distance: 200 },
        ],
        profiles: {
            NOVICE: {
                expectedBehavior: 'Slow reaction (4-6s), struggles, may not complete',
                reactionDelay: [4, 6],
                powerIncrease: 'gradual',
            },
            RACER: {
                expectedBehavior: 'Quick response (1-2s), maintains momentum',
                reactionDelay: [1, 2],
                powerIncrease: 'rapid',
            },
        },
    },

    {
        name: 'Long climb when tired',
        description: '3km at 6% when energy is WORKING',
        terrain: [{ gradient: 6, distance: 3000 }],
        initialEnergy: EnergyState.WORKING,
        profiles: {
            CASUAL: {
                expectedBehavior: 'Backs off to 85-90%, may need recovery stops',
                powerRange: [0.85, 0.9],
                energyAtEnd: EnergyState.TIRED,
            },
            ENDURANCE: {
                expectedBehavior: 'Steady 95-100%, maintains energy state',
                powerRange: [0.95, 1.0],
                energyAtEnd: EnergyState.WORKING,
            },
        },
    },

    {
        name: 'Multiple hard efforts',
        description: '4 short climbs with <30s recovery between',
        terrain: [
            { gradient: 7, distance: 100 },
            { gradient: 0, distance: 50 },
            { gradient: 7, distance: 100 },
            { gradient: 0, distance: 50 },
            { gradient: 7, distance: 100 },
            { gradient: 0, distance: 50 },
            { gradient: 7, distance: 100 },
        ],
        profiles: {
            AGGRESSIVE: {
                expectedBehavior: 'First 2 efforts strong, then fatigue penalty kicks in',
                effort1Power: [1.2, 1.3],
                effort4Power: [1.0, 1.1], // Reduced due to fatigue
                consecutiveEfforts: 4,
            },
        },
    },
];

// Test runner
describe('Scenario Tests', () => {
    scenarios.forEach(scenario => {
        describe(scenario.name, () => {
            Object.entries(scenario.profiles).forEach(([profileName, expected]) => {
                it(`should behave correctly for ${profileName}`, () => {
                    const profile = PRESETS[profileName];
                    const powerProvider = new RealisticCyclistPowerProvider(profile);

                    // Run simulation through scenario terrain
                    const results = runScenario(powerProvider, scenario);

                    // Validate against expected behavior
                    validateResults(results, expected);
                });
            });
        });
    });
});
```

### Integration Tests

```typescript
describe('Full Integration', () => {
    it('should complete realistic ride simulation', () => {
        const gpxData = loadGPXFile('test-route.gpx');
        const course = createCourseFromGPX(gpxData);

        const racerProfile = PRESETS.RACER;
        const powerProvider = new RealisticCyclistPowerProvider(racerProfile);

        const virtualizeService = new VirtualizeService();
        virtualizeService.setCyclistPowerProvider(powerProvider);

        const results = virtualizeService.virtualize(course);

        // Validate results
        expect(results).toBeDefined();
        expect(results.totalTime).toBeGreaterThan(0);
        expect(results.path.length).toBeGreaterThan(0);

        // Check that power varies realistically
        const powers = results.path.points.map(p => p.power);
        const avgPower = average(powers);
        const stdDev = standardDeviation(powers);

        // Racer should have moderate variability (not perfectly smooth)
        expect(stdDev / avgPower).toBeGreaterThan(0.1);
        expect(stdDev / avgPower).toBeLessThan(0.3);
    });

    it('should respect personality differences', () => {
        const course = createTestCourse(); // Standard test course

        const results = {};
        for (const [name, profile] of Object.entries(PRESETS)) {
            const powerProvider = new RealisticCyclistPowerProvider(profile);
            results[name] = runSimulation(course, powerProvider);
        }

        // Aggressive should be faster but more variable
        expect(results.AGGRESSIVE.time).toBeLessThan(results.CASUAL.time);
        expect(results.AGGRESSIVE.powerVariability).toBeGreaterThan(
            results.TIME_TRIALIST.powerVariability
        );

        // Endurance should be smoothest
        expect(results.ENDURANCE.powerVariability).toBeLessThan(results.RACER.powerVariability);
    });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
    it('should handle long routes efficiently', () => {
        const longCourse = createCourse(1000); // 1000 points (~100km)
        const powerProvider = new RealisticCyclistPowerProvider(PRESETS.RACER);

        const startTime = Date.now();
        const results = runSimulation(longCourse, powerProvider);
        const duration = Date.now() - startTime;

        // Should complete in reasonable time (<5s for 1000 points)
        expect(duration).toBeLessThan(5000);
    });

    it('should cache terrain analysis effectively', () => {
        const analyzer = new TerrainAnalyzer();
        const path = createTestPath(100);

        // First analysis
        const start1 = Date.now();
        analyzer.analyze(path, 0, PRESETS.RACER);
        const time1 = Date.now() - start1;

        // Second analysis (should hit cache)
        const start2 = Date.now();
        analyzer.analyze(path, 0, PRESETS.RACER);
        const time2 = Date.now() - start2;

        expect(time2).toBeLessThan(time1 * 0.1); // >10x faster from cache
    });
});
```

---

## Appendix: Key Formulas Reference

### Energy Depletion

```
depletionRate = baseRate * energyMultiplier * personalityMultiplier

where:
  baseRate = f(powerRatio):
    if power > 110%: -3 to -6% per minute (depending on state)
    if power > 100%: -1.5 to -3% per minute

  energyMultiplier = f(currentState):
    FRESH/GOOD: 1.0
    WORKING: 1.2
    TIRED: 1.5
    VERY_TIRED: 2.0

  personalityMultiplier = 1.3 - painTolerance * 0.6
    Range: 0.7 (high tolerance) to 1.3 (low tolerance)
```

### Energy Recovery

```
recoveryRate = baseRate * personalityMultiplier

where:
  baseRate = f(powerRatio, currentState):
    if power < 80% and GOOD: +2% per minute
    if power < 70% and WORKING: +1.5% per minute
    if power < 60% and TIRED: +1% per minute
    if power < 50% and VERY_TIRED: +0.5% per minute
    if power < 40% and BONKED: +0.3% per minute

  personalityMultiplier = 0.6 + recoveryRate * 0.8
    Range: 0.6 (slow recovery) to 1.4 (fast recovery)
```

### Look-Ahead Distance

```
lookAheadDistance = currentSpeed * lookAheadTime

where:
  lookAheadTime = baseTime + awarenessBonus + familiarityBonus

  baseTime = 15 + experience * 45  (15-60 seconds)
  awarenessBonus = tacticalAwareness * 15  (0-15 seconds)
  familiarityBonus = routeFamiliarity * 30  (0-30 seconds)
```

### Reaction Delay

```
reactionDelay = (baseDelay * situationModifier) - experienceBonus

where:
  baseDelay = 2 + (1 - reactionSpeed) * 6  (2-8 seconds)

  situationModifier:
    STEEP_GRADIENT_CHANGE: 0.5
    EXPECTED_CLIMB: 1.2
    TACTICAL_OPPORTUNITY: 1.0
    RECOVERY_DECISION: 1.5
    EMERGENCY: 0.3

  experienceBonus = experience * 2  (0-2 seconds)

  minimum = 0.5 seconds
```

### Ramp Rate

```
rampRate = baseRate * energyMod * aggressionMod * painMod * sizeMod * emergencyMod

where:
  baseRate (UP) = 30 + reactionSpeed * 50  (30-80 W/s)
  baseRate (DOWN) = 40 + reactionSpeed * 60  (40-100 W/s)

  energyMod (UP only):
    FRESH: 1.2
    GOOD: 1.0
    WORKING: 0.8
    TIRED: 0.6
    VERY_TIRED: 0.4
    BONKED: 0.2

  aggressionMod (UP, if Δ > 50W):
    0.8 + aggression * 0.4  (0.8-1.2)

  painMod (UP, if target > current * 1.15):
    0.7 + painTolerance * 0.6  (0.7-1.3)

  sizeMod (if Δ < 10%):
    1.5  (faster for small changes)

  emergencyMod (if reactionSpeed > 0.7 and Δ > 100W):
    1.3
```

---

## Document Metadata

- **Created**: 2025-10-15
- **Version**: 1.0
- **Purpose**: Implementation specification for realistic virtual cyclist behavior
- **Audience**: Development team implementing the feature
- **Related Files**:
    - `/src/physics/power/cyclist/CyclistPowerProviderBase.ts` (integration point)
    - `/src/physics/VirtualizeService.ts` (usage)
    - `/src/types/models/Cyclist.ts` (existing cyclist model)

---

## Next Steps

When ready to implement:

1. Review this document thoroughly
2. Discuss any questions or clarifications needed
3. Set up development branch
4. Follow implementation roadmap Phase 1
5. Iterate with testing and feedback

Good luck with the implementation!
