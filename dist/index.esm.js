const zt = 9.8, fe = 0.5555555555555556, te = 1, Ce = 6378137, ue = 0.0066943799901378, de = Ce * 2 * Math.PI, ve = 4e-3, Se = 0.05, xe = 0.07, Le = 0.7, _e = 0.976, De = 80, Ie = 280, be = 0.6, Pe = 35, Xt = Pe * Math.PI / 180, Oe = 100, We = 0.7, Fe = 0.5, Ge = 1.225, O = class {
};
O.ERROR = 0, O.WARN = 1, O.INFO = 2, O.DEBUG = 3, O.TRACE = 4;
let E = O;
const Ue = {
  warn: E.WARN
}, me = {
  0: "ERROR",
  1: "WARN",
  2: "INFO",
  3: "DEBUG",
  4: "TRACE"
}, ge = {
  0: console.error,
  1: console.error,
  2: console.log,
  3: console.log,
  4: console.log
};
class Be {
  constructor(e) {
    this.namespace = e, this.level = Ue.warn;
  }
  shouldLog(e) {
    return e <= this.level;
  }
  doLog(e, t, ...s) {
    const i = `[${this.namespace}:${me[e]}]`;
    typeof t == "string" ? ge[e](`${i} ${t}`, ...s) : ge[e](i, t, ...s);
  }
  log(e, t, ...s) {
    this.shouldLog(e) && this.doLog(e, t, ...s);
  }
  /**
   * Log debug information (verbose output for development)
   * Supports printf-style formatting: logger.debug('Value: %s, Count: %d', value, count)
   */
  trace(e, ...t) {
  }
  /**
   * Log debug information (verbose output for development)
   * Supports printf-style formatting: logger.debug('Value: %s, Count: %d', value, count)
   */
  debug(e, ...t) {
  }
  /**
   * Log general information
   * Supports printf-style formatting: logger.info('User %s logged in', username)
   */
  info(e, ...t) {
  }
  /**
   * Log warnings
   * Supports printf-style formatting: logger.warn('Timeout after %dms', timeout)
   */
  warn(e, ...t) {
    this.log(E.WARN, e, ...t);
  }
  /**
   * Log errors
   * Supports printf-style formatting: logger.error('Failed to load %s: %o', file, error)
   */
  error(e, ...t) {
    this.log(E.ERROR, e, ...t);
  }
  getTimeLabel(e, t) {
    return `[${this.namespace}:${me[e]}] ${t}`;
  }
  doTime(e, t) {
    console.time(this.getTimeLabel(e, t));
  }
  doTimeEnd(e, t) {
    console.timeEnd(this.getTimeLabel(e, t));
  }
  /**
   * Log with timing information
   * Useful for performance debugging
   */
  timeLevel(e, t) {
  }
  /**
   * End timing and log duration
   */
  timeEndLevel(e, t) {
  }
  /**
   * Log with timing information
   * Useful for performance debugging
   */
  time(e) {
    this.doTime(E.INFO, e);
  }
  /**
   * End timing and log duration
   */
  timeEnd(e) {
    this.doTimeEnd(E.INFO, e);
  }
  logDir(e, t, s, i) {
    this.doLog(e, "DIR %s", t), console.dir(s, i);
  }
  /**
   * Display an interactive list of object properties
   * Useful for exploring complex objects in development
   * @param obj - The object to inspect
   * @param options - Optional display options
   */
  dirLevel(e, t, s, i) {
  }
  /**
   * Display an interactive list of object properties
   * Useful for exploring complex objects in development
   * @param obj - The object to inspect
   * @param options - Optional display options
   */
  dir(e, t, s) {
    this.logDir(E.INFO, e, t, s);
  }
  /**
   * Clear the console
   */
  clear() {
    console.clear();
  }
}
const _ = (a) => new Be(a), C = _("tile/cache/ReentrantLock");
class ke {
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  constructor(e) {
    this.locks = /* @__PURE__ */ new Map(), this.loadingCount = 0, this.waitQueue = [], this.maxConcurrent = e;
  }
  // ========================================================================
  // PUBLIC API
  // ========================================================================
  /**
   * Acquire lock for key with deduplication and concurrency limiting
   * @param key - Unique identifier for the operation
   * @param fn - Function to execute if not already running
   * @returns Promise resolving to the operation result
   */
  async acquire(e, t) {
    if (C.debug(
      "%s: Lock acquire requested (active: %d/%d, queued: %d)",
      e,
      this.loadingCount,
      this.maxConcurrent,
      this.waitQueue.length
    ), this.locks.has(e))
      return C.debug(
        "%s: Lock deduplication - already loading, returning existing promise",
        e
      ), this.locks.get(e);
    if (await this.acquireLoadingSlot(e), this.locks.has(e))
      return C.debug(
        "%s: Lock race condition - already loading after slot acquired, releasing slot",
        e
      ), this.releaseLoadingSlot(e), this.locks.get(e);
    C.debug("%s: Lock creating new promise", e);
    const s = (async () => {
      try {
        C.debug("%s: Promise executing function", e);
        const i = await t();
        return C.debug("%s: Promise resolved successfully", e), i;
      } catch (i) {
        throw C.error("%s: Promise rejected - %o", e, i), i;
      } finally {
        C.debug("%s: Promise cleanup - removing lock and releasing slot", e), this.locks.delete(e), this.releaseLoadingSlot(e);
      }
    })();
    return this.locks.set(e, s), C.debug("%s: Lock registered promise (total locks: %d)", e, this.locks.size), s;
  }
  // ========================================================================
  // PRIVATE - SEMAPHORE OPERATIONS
  // ========================================================================
  /**
   * Acquire a loading slot (semaphore acquire)
   */
  async acquireLoadingSlot(e) {
    if (this.loadingCount < this.maxConcurrent) {
      this.loadingCount++, C.debug(
        "%s: Semaphore acquired slot immediately (%d/%d active, %d queued)",
        e,
        this.loadingCount,
        this.maxConcurrent,
        this.waitQueue.length
      );
      return;
    }
    return C.debug(
      "%s: Semaphore waiting for slot (%d/%d active, %d queued)",
      e,
      this.loadingCount,
      this.maxConcurrent,
      this.waitQueue.length
    ), C.timeLevel(E.DEBUG, e), new Promise((t) => {
      this.waitQueue.push(() => {
        C.timeEndLevel(E.DEBUG, e), this.loadingCount++, C.debug(
          "%s: Semaphore acquired slot after waiting (%d/%d active, %d queued)",
          e,
          this.loadingCount,
          this.maxConcurrent,
          this.waitQueue.length
        ), t();
      });
    });
  }
  /**
   * Release a loading slot (semaphore release)
   */
  releaseLoadingSlot(e) {
    if (this.waitQueue.length > 0) {
      C.debug(
        "%s: Semaphore: releasing slot to waiting request (%d/%d active, %d queued)",
        e,
        this.loadingCount,
        this.maxConcurrent,
        this.waitQueue.length
      );
      const t = this.waitQueue.shift();
      t && t();
    } else
      this.loadingCount--, C.debug(
        "%s: Semaphore: released slot (%d/%d active, %d queued)",
        e,
        this.loadingCount,
        this.maxConcurrent,
        this.waitQueue.length
      );
  }
}
const S = _("tile/cache/Cache");
class ze {
  // ========================================================================
  // CONSTRUCTOR & VALIDATION
  // ========================================================================
  constructor(e, t, s, i) {
    if (this.head = null, this.tail = null, e <= 0)
      throw new Error("Cache size must be greater than 0");
    this.maxSize = e, this.keyMapper = t, this.valueBuilder = s, this.cleanupFn = i, this.cache = /* @__PURE__ */ new Map(), this.lruOrder = /* @__PURE__ */ new Map(), this.lock = new ke(e);
  }
  // ========================================================================
  // PUBLIC API - CACHE OPERATIONS
  // ========================================================================
  /**
   * Get item from cache or build if not present
   * @param k - Key to retrieve
   * @returns Promise resolving to cached or newly built value
   */
  async get(e) {
    const t = this.keyMapper(e), s = this.cache.get(t);
    return s ? (this.moveToFront(t), s) : (S.debug("%s miss", t), this.lock.acquire(t, async () => {
      const i = this.cache.get(t);
      if (i)
        return S.debug("%s Missed at first but now OK", t), this.moveToFront(t), i;
      S.info("%s loading", t), S.timeLevel(E.INFO, t);
      const n = await this.valueBuilder(e);
      return S.info("%s loaded", t), S.timeEndLevel(E.INFO, t), this.set(t, n), n;
    }));
  }
  /**
   * Clear all cached items
   */
  clear() {
    if (S.debug("clear"), this.cleanupFn)
      for (const e of this.cache.values())
        this.cleanupFn(e);
    this.cache.clear(), this.lruOrder.clear(), this.head = null, this.tail = null;
  }
  // ========================================================================
  // PROTECTED API - INSPECTION METHODS
  // ========================================================================
  /**
   * Check if item exists in cache
   * @param k - Key to check
   * @returns True if key exists in cache
   */
  has(e) {
    const t = this.keyMapper(e);
    return this.cache.has(t);
  }
  /**
   * Get all cached keys
   * @returns Array of all cached keys
   */
  getKeys() {
    return Array.from(this.cache.keys());
  }
  /**
   * Get the least recently used keys in order
   * @param count - Maximum number of keys to return
   * @returns Array of LRU keys from least to most recently used
   */
  getLRUKeys(e = 10) {
    const t = [];
    let s = this.tail;
    for (; s && t.length < e; )
      t.push(s), s = this.lruOrder.get(s)?.prev || null;
    return t;
  }
  // ========================================================================
  // PRIVATE - CACHE STORAGE OPERATIONS
  // ========================================================================
  /**
   * Store item in cache with automatic eviction
   */
  set(e, t) {
    this.cache.size >= this.maxSize && this.evictLeastRecentlyUsed(), this.cache.set(e, t), this.addToFront(e);
  }
  /**
   * Remove item from cache with cleanup
   */
  delete(e) {
    if (S.debug("%s delete", e), !this.cache.has(e))
      return !1;
    const t = this.cache.get(e);
    return this.cache.delete(e), this.removeFromLRU(e), t && this.cleanupFn && this.cleanupFn(t), !0;
  }
  // ========================================================================
  // PRIVATE - LRU EVICTION OPERATIONS
  // ========================================================================
  /**
   * Remove the least recently used item to make space
   */
  evictLeastRecentlyUsed() {
    if (!this.tail)
      return;
    const e = this.tail;
    this.delete(e);
  }
  // ========================================================================
  // PRIVATE - LRU LINKED LIST OPERATIONS
  // ========================================================================
  /**
   * Add a key to the front of the LRU list (most recently used)
   */
  addToFront(e) {
    const t = { prev: null, next: this.head };
    if (this.lruOrder.set(e, t), this.head) {
      const s = this.lruOrder.get(this.head);
      s.prev = e;
    } else
      this.tail = e;
    this.head = e;
  }
  /**
   * Move an existing key to the front of the LRU list
   */
  moveToFront(e) {
    this.head !== e && (this.removeFromLRU(e), this.addToFront(e));
  }
  /**
   * Remove a key from the LRU doubly-linked list
   */
  removeFromLRU(e) {
    const t = this.lruOrder.get(e);
    if (t) {
      if (t.prev) {
        const s = this.lruOrder.get(t.prev);
        s.next = t.next;
      } else
        this.head = t.next;
      if (t.next) {
        const s = this.lruOrder.get(t.next);
        s.prev = t.prev;
      } else
        this.tail = t.prev;
      this.lruOrder.delete(e);
    }
  }
}
const B = _("tile/fetcher/TileLoader");
class Xe {
  constructor(e, t) {
    this.tileUrlTemplate = e, this.tileFetcher = t;
  }
  // ========================================================================
  // PUBLIC API
  // ========================================================================
  async loadTile(e) {
    const t = `${e.z}/${e.x}/${e.y}`, s = this.getTileUrl(e), i = `fetch-${t}`;
    B.timeLevel(E.DEBUG, i);
    try {
      const n = await this.tileFetcher.fetchTile(s);
      return B.timeEndLevel(E.DEBUG, i), n;
    } catch (n) {
      throw B.timeEndLevel(E.DEBUG, i), n instanceof Error ? new Error(`Failed to fetch tile from ${s}: ${n.message}`) : new Error(`Failed to fetch tile from ${s}: Unknown error`);
    }
  }
  // ========================================================================
  // PRIVATE
  // ========================================================================
  getTileUrl(e) {
    const t = `fetch-${`${e.z}/${e.x}/${e.y}`}`;
    return B.timeLevel(E.DEBUG, t), this.tileUrlTemplate.replace("{z}", e.z.toString()).replace("{x}", e.x.toString()).replace("{y}", e.y.toString());
  }
}
class $e {
  constructor(e, t) {
    this.tileUrlTemplate = e, this.cacheSize = t;
  }
  async getTile(e) {
    return await (await this.checkCache()).get(e);
  }
  async checkCache() {
    if (this.cache)
      return this.cache;
    {
      let e;
      {
        const { BrowserTileFetcher: n } = await Promise.resolve().then(() => rt);
        e = new n();
      }
      const t = (n) => n.close(), s = new Xe(this.tileUrlTemplate, e), i = new ze(
        this.cacheSize,
        (n) => `${n.z}/${n.x}/${n.y}`,
        (n) => s.loadTile(n),
        t
      );
      return this.cache = i, i;
    }
  }
}
const R = 256;
function Ve(a) {
  return a * Math.PI / 180;
}
function qe(a) {
  return a >= -85.0511 && a <= 85.0511;
}
function He(a) {
  return a >= -180 && a <= 180;
}
function Ke(a) {
  return Number.isInteger(a) && a >= 0 && a <= 15;
}
function k(a) {
  let { x: e, y: t } = a;
  const s = a.tile;
  let i = s.x, n = s.y;
  const r = s.z;
  e < 0 && (e += R, i -= 1), e >= R && (e -= R, i += 1), t < 0 && (t += R, n -= 1), t >= R && (t -= R, n += 1);
  const o = Math.pow(2, r) - 1;
  return i = Math.max(0, Math.min(o, i)), n = Math.max(0, Math.min(o, n)), { tile: { z: r, x: i, y: n }, x: e, y: t };
}
function Ae(a, e) {
  if (!qe(a.latitude))
    throw new Error(
      `Invalid latitude: ${a.latitude}. Must be between -85.0511 and 85.0511`
    );
  if (!He(a.longitude))
    throw new Error(`Invalid longitude: ${a.longitude}. Must be between -180 and 180`);
  if (!Ke(e))
    throw new Error(`Invalid zoom level: ${e}. Must be between 0 and 15`);
  const t = Ve(a.latitude), s = Math.pow(2, e), i = (a.longitude + 180) / 360 * s, n = (1 - Math.log(Math.tan(t) + 1 / Math.cos(t)) / Math.PI) / 2 * s;
  let r = Math.floor(i), o = Math.floor(n);
  const l = s - 1;
  return r = Math.max(0, Math.min(l, r)), o = Math.max(0, Math.min(l, o)), {
    x: r,
    y: o,
    xFloat: i,
    yFloat: n,
    z: e
  };
}
function Ye(a, e) {
  const t = Ae(a, e);
  return {
    x: t.x,
    y: t.y,
    z: t.z
  };
}
function pe(a, e) {
  const t = Ae(a, e), s = Math.floor((t.xFloat - t.x) * R), i = Math.floor((t.yFloat - t.y) * R);
  return {
    tile: {
      z: e,
      x: t.x,
      y: t.y
    },
    x: Math.max(0, Math.min(R - 1, s)),
    y: Math.max(0, Math.min(R - 1, i))
  };
}
class Qe {
  constructor(e) {
    this.tileManager = e;
  }
  // ========================================================================
  // PUBLIC API - ELEVATION CALCULATIONS
  // ========================================================================
  async getElevation(e, t, s = !0) {
    try {
      if (s)
        return await this.getInterpolatedElevationInternal(e, t);
      {
        const i = pe(e, t);
        return await this.getElevationFromPixel(i);
      }
    } catch (i) {
      throw i instanceof Error ? new Error(`Failed to get elevation: ${i.message}`) : new Error("Failed to get elevation: Unknown error");
    }
  }
  // ========================================================================
  // PRIVATE - HELPER METHODS
  // ========================================================================
  async getInterpolatedElevationInternal(e, t) {
    const s = pe(e, t), i = {
      tile: s.tile,
      x: s.x,
      y: s.y
    }, n = Math.floor(i.x), r = Math.floor(i.y), o = n + 1, l = r + 1, c = i.x - n, d = i.y - r, u = await this.getElevationFromPixel(
      k({ tile: i.tile, x: n, y: r })
    ), g = await this.getElevationFromPixel(
      k({ tile: i.tile, x: o, y: r })
    ), m = await this.getElevationFromPixel(
      k({ tile: i.tile, x: n, y: l })
    ), f = await this.getElevationFromPixel(
      k({ tile: i.tile, x: o, y: l })
    ), P = u * (1 - c) + g * c, A = m * (1 - c) + f * c;
    return P * (1 - d) + A * d;
  }
  /**
   * Get elevation for a specific pixel (internal helper)
   */
  async getElevationFromPixel(e) {
    const t = (await this.tileManager.getTile(e.tile)).getRGBFromImageData(e);
    return this.decodeElevation(t);
  }
  /**
   * Decode elevation from RGB values using Terrarium encoding
   * Formula: elevation = (red * 256 + green + blue / 256) - 32768
   * @param rgb - RGB color values from terrain tile pixel
   * @returns Elevation in meters, rounded to 2 decimal places
   */
  decodeElevation(e) {
    const t = e.red * 256 + e.green + e.blue / 256 - 32768;
    return Math.round(t * 100) / 100;
  }
}
function z(a) {
  return { ...a, elevation: a.elevation ?? 0 };
}
class D {
  constructor(e, t, s) {
    this.x = e, this.y = t, this.z = s;
  }
  /**
   * Calculate Euclidean distance between two vectors
   */
  distanceTo(e) {
    const t = this.x - e.x, s = this.y - e.y, i = this.z - e.z;
    return Math.hypot(t, s, i);
  }
  /**
   * Subtract two vectors
   */
  subtract(e) {
    return new D(this.x - e.x, this.y - e.y, this.z - e.z);
  }
  /**
   * Add two vectors
   */
  add(e) {
    return new D(this.x + e.x, this.y + e.y, this.z + e.z);
  }
  /**
   * Multiply vector by scalar
   */
  multiply(e) {
    return new D(this.x * e, this.y * e, this.z * e);
  }
  /**
   * Calculate dot product with another vector
   */
  dot(e) {
    return this.x * e.x + this.y * e.y + this.z * e.z;
  }
  /**
   * Calculate cross product with another vector
   */
  cross(e) {
    return new D(
      this.y * e.z - this.z * e.y,
      this.z * e.x - this.x * e.z,
      this.x * e.y - this.y * e.x
    );
  }
  /**
   * Calculate the magnitude (length) of the vector
   */
  magnitude() {
    return Math.hypot(this.x, this.y, this.z);
  }
  /**
   * Normalize the vector to unit length
   */
  normalize() {
    const e = this.magnitude();
    return e === 0 ? new D(0, 0, 0) : this.multiply(1 / e);
  }
  /**
   * Calculate perpendicular distance from this point to a line segment defined by two points
   * Uses the formula: ||(p-a) × (p-b)|| / ||b-a||
   * where p is this point, a and b are the line segment endpoints
   */
  distanceToSegment(e, t) {
    const s = t.subtract(e), i = s.magnitude();
    if (i === 0)
      return this.distanceTo(e);
    const n = this.subtract(e).dot(s) / (i * i), r = Math.max(0, Math.min(1, n)), o = e.add(s.multiply(r));
    return this.distanceTo(o);
  }
}
const V = {
  /** Semi-major axis in meters (WGS84 ellipsoid) */
  SEMI_MAJOR_AXIS: 6378137,
  /** Mean radius in meters (used for distance calculations) */
  MEAN_RADIUS: 6371e3,
  /** First eccentricity squared (WGS84 ellipsoid) */
  FIRST_ECCENTRICITY_SQUARED: 0.00669437999014
}, X = {
  /** Degrees to radians conversion factor */
  DEG_TO_RAD: Math.PI / 180
}, se = {
  /** Minimum points needed for smoothing operations */
  MIN_SMOOTHING_POINTS: 3,
  /** Minimum segment distance in meters for path processing */
  MIN_SEGMENT_DISTANCE: 1
};
class j {
  /**
   * Convert WGS84 coordinates to ECEF coordinates with optional elevation exaggeration
   * @param coordinates - Geographic coordinates with elevation
   * @param zExaggeration - Elevation exaggeration factor (default: 3)
   * @returns ECEF coordinates as Vector3D
   */
  static toEcef(e, t = 3) {
    const s = e.latitude * Math.PI / 180, i = e.longitude * Math.PI / 180, n = t * (e.elevation || 0), r = Math.sin(s), o = V.SEMI_MAJOR_AXIS / Math.sqrt(1 - V.FIRST_ECCENTRICITY_SQUARED * r * r), l = Math.cos(s), c = Math.cos(i), d = Math.sin(i), u = (o + n) * l * c, g = (o + n) * l * d, m = (o * (1 - V.FIRST_ECCENTRICITY_SQUARED) + n) * r;
    return new D(u, g, m);
  }
  /**
   * Convert multiple coordinates to ECEF vectors
   * @param coordinates - Array of geographic coordinates with elevation
   * @param zExaggeration - Elevation exaggeration factor (default: 3)
   * @returns Array of ECEF coordinates as Vector3D
   */
  static convertBatch(e, t = 3) {
    return e.map((s) => this.toEcef(s, t));
  }
}
const U = _("utils/DouglasPeucker");
class je {
  /**
   * Simplify a path using the Douglas-Peucker algorithm in 3D space
   * @param points - Array of coordinates with elevation
   * @param tolerance - Maximum allowed distance from simplified line in meters
   * @param zExaggeration - Elevation exaggeration factor for ECEF conversion (default: 3)
   * @returns Simplified array of coordinates
   */
  static simplify(e, t, s = 3) {
    if (U.info("simplify %s", e.length), e.length <= 2)
      return U.warn("too small"), [...e];
    U.timeLevel(E.INFO, "simplify");
    const i = e.length - 1, n = [];
    n.push(e[0]);
    const r = this.simplifyRecursive(
      e,
      0,
      i,
      t,
      s
    );
    return n.push(...r), n.push(e[i]), U.timeEndLevel(E.INFO, "simplify"), U.debug("simplified -> %s", n.length), n;
  }
  /**
   * Recursive step of the Douglas-Peucker algorithm
   * @param points - Array of all points
   * @param firstIndex - Index of first point in current segment
   * @param lastIndex - Index of last point in current segment
   * @param tolerance - Maximum allowed distance in meters
   * @param zExaggeration - Elevation exaggeration factor
   * @returns Array of points to include in simplified path
   */
  static simplifyRecursive(e, t, s, i, n) {
    let r = 0, o = -1;
    const l = [], c = j.toEcef(e[t], n), d = j.toEcef(e[s], n);
    for (let u = t + 1; u < s; u++) {
      const g = j.toEcef(e[u], n).distanceToSegment(c, d);
      g > r && (r = g, o = u);
    }
    if (r > i && o !== -1) {
      if (o - t > 1) {
        const u = this.simplifyRecursive(
          e,
          t,
          o,
          i,
          n
        );
        l.push(...u);
      }
      if (l.push(e[o]), s - o > 1) {
        const u = this.simplifyRecursive(
          e,
          o,
          s,
          i,
          n
        );
        l.push(...u);
      }
    }
    return l;
  }
}
class L {
  /**
   * Calculate great circle distance between two geographic coordinates using Haversine formula
   * @param coord1 - First coordinate
   * @param coord2 - Second coordinate
   * @returns Distance in meters
   */
  static haversine(e, t) {
    const s = e.latitude * X.DEG_TO_RAD, i = t.latitude * X.DEG_TO_RAD, n = (t.latitude - e.latitude) * X.DEG_TO_RAD, r = (t.longitude - e.longitude) * X.DEG_TO_RAD, o = Math.sin(n / 2) * Math.sin(n / 2) + Math.cos(s) * Math.cos(i) * Math.sin(r / 2) * Math.sin(r / 2), l = 2 * Math.atan2(Math.sqrt(o), Math.sqrt(1 - o));
    return V.MEAN_RADIUS * l;
  }
  /**
   * Calculate Euclidean distance between two 3D points
   * @param point1 - First 3D point
   * @param point2 - Second 3D point
   * @returns Distance in meters
   */
  static euclidean3D(e, t) {
    const s = e.x - t.x, i = e.y - t.y, n = e.z - t.z;
    return Math.sqrt(s * s + i * i + n * n);
  }
  /**
   * Calculate perpendicular distance from a point to a line segment in 3D space
   * @param point - Point to measure from
   * @param segmentStart - Start point of line segment
   * @param segmentEnd - End point of line segment
   * @returns Perpendicular distance in meters
   */
  static pointToSegment3D(e, t, s) {
    const i = s.subtract(t), n = e.subtract(t), r = i.dot(i);
    if (r === 0)
      return L.euclidean3D(e, t);
    const o = Math.max(0, Math.min(1, n.dot(i) / r)), l = t.add(i.multiply(o));
    return L.euclidean3D(e, l);
  }
  /**
   * Calculate cumulative distances along a path of coordinates
   * @param points - Array of coordinates
   * @returns Array of cumulative distances in meters
   */
  static cumulativeDistances(e) {
    const t = [0];
    for (let s = 1; s < e.length; s++) {
      const i = L.haversine(e[s - 1], e[s]);
      t.push(t[s - 1] + i);
    }
    return t;
  }
  /**
   * Calculate total distance along a path of coordinates
   * @param points - Array of coordinates
   * @returns Total distance in meters
   */
  static totalPathDistance(e) {
    if (e.length < 2)
      return 0;
    let t = 0;
    for (let s = 1; s < e.length; s++)
      t += L.haversine(e[s - 1], e[s]);
    return t;
  }
}
const $ = _("utils/ElevationSmoother");
class Ze {
  /**
   * Apply distance-based smoothing to elevation data
   * @param points - Array of coordinates with elevation
   * @param windowSize - Smoothing window in meters (default: 50)
   * @returns Smoothed elevation data
   */
  static smooth(e, t = 50) {
    if ($.debug("smooth %s", e.length), e.length < se.MIN_SMOOTHING_POINTS)
      return $.debug("too small"), e;
    if (t <= 0)
      throw new Error(`Invalid window size: ${t}. Must be positive`);
    $.timeLevel(E.INFO, "smooth");
    const s = L.cumulativeDistances(e), i = [];
    for (let n = 0; n < e.length; n++) {
      const r = this.computeSmoothedValue(n, e, s, t);
      i.push({
        ...e[n],
        elevation: r
      });
    }
    return $.timeEndLevel(E.INFO, "smooth"), i;
  }
  /**
   * Compute smoothed elevation value for a single point
   * @param index - Index of point to smooth
   * @param points - All points
   * @param distances - Cumulative distances
   * @param windowSize - Smoothing window in meters
   * @returns Smoothed elevation value
   */
  static computeSmoothedValue(e, t, s, i) {
    const n = s[e];
    let r = e;
    for (; r > 0 && n - s[r - 1] <= i; )
      r--;
    let o = e;
    for (; o < t.length - 1 && s[o + 1] - n <= i; )
      o++;
    let l = 0, c = 0;
    for (let d = r; d <= o; d++) {
      const u = 1 - Math.abs(s[d] - n) / i;
      l += u, c += t[d].elevation * u;
    }
    return l > 0 ? c / l : t[e].elevation;
  }
}
class q {
  constructor(e) {
    this.source = e;
  }
  static from(e) {
    async function* t() {
      for (const s of e)
        yield s;
    }
    return new q(t());
  }
  mapAsync(e, t = 1) {
    const s = this.source;
    async function* i() {
      const n = [];
      for await (const r of s) {
        const o = e(r);
        n.push(o), n.length >= t && (yield await n.shift());
      }
      for (; n.length > 0; )
        yield await n.shift();
    }
    return new q(i());
  }
  async countProcessed() {
    let e = 0;
    for await (const t of this.source)
      e++;
    return e;
  }
}
const p = _("calculator/BatchCalculator");
class Je {
  constructor(e) {
    this.elevationCalculator = e;
  }
  async setElevations(e, t, s) {
    const i = {}, n = /* @__PURE__ */ new Map(), r = (l) => `${l.z}/${l.x}/${l.y}`;
    for (const l of e) {
      const c = Ye(l, t), d = r(c);
      let u = i[d];
      u || (u = [], i[d] = u, n.set(d, c)), u.push(l);
    }
    const o = Array.from(n.values());
    await q.from(o).mapAsync(async (l) => {
      const c = r(l), d = i[c];
      for (const u of d)
        u.elevation = await this.elevationCalculator.getElevation(
          u,
          t,
          s
        );
      return l;
    }, 10).countProcessed();
  }
  /**
   * Get elevations along a path defined by multiple coordinates
   * @param path - Array of coordinates defining the path
   * @param zoomLevel - Tile zoom level (0-15)
   * @param step - Distance between elevation points in meters
   * @param interpolation - Use bilinear interpolation for smoother results
   * @param smoothingOptions - Optional distance-based smoothing options
   * @param filterOptions - Optional filtering options using Douglas-Peucker algorithm
   */
  async getElevationsAlong(e, t, s, i, n, r) {
    const o = "path-elevations";
    if (p.timeLevel(E.INFO, o), p.info(
      "Path processing started - waypoints: %d, step: %dm, zoom: %d, interpolation: %s",
      e.length,
      s,
      t,
      i
    ), e.length < 2)
      throw p.error("Path validation failed - insufficient waypoints: %d", e.length), new Error("Path must contain at least 2 coordinates");
    if (s <= 1)
      throw p.error("Path validation failed - step too small: %dm", s), new Error(`Step is too small: ${s} meters`);
    p.debug("Generating coordinates along path");
    const l = "coordinate-generation";
    p.timeLevel(E.DEBUG, l);
    let c = Array.from(this.generateCoordinatesAlong(e, s));
    if (p.timeEndLevel(E.DEBUG, l), p.debug("Generated %d coordinates along path", c.length), p.debug("Fetching elevations for generated coordinates"), await this.setElevations(c, t, i), p.debug("Combined coordinates with elevations - points: %d", c.length), n?.enabled === !0 && c.length >= 3) {
      const d = n.windowSize ?? 50, u = c.length;
      p.debug("Applying elevation smoothing - windowSize: %dm", d);
      const g = "smoothing";
      p.timeLevel(E.DEBUG, g), c = Ze.smooth(c, d), p.timeEndLevel(E.DEBUG, g), p.debug(
        "Smoothing completed - points: %d → %d",
        u,
        c.length
      );
    } else n?.enabled === !0 && p.debug(
      "Smoothing skipped - insufficient points: %d (minimum: 3)",
      c.length
    );
    if (r?.enabled === !0 && c.length > 2) {
      const d = r?.tolerance ?? 10, u = r?.zExaggeration ?? 3, g = c.length;
      p.debug(
        "Applying Douglas-Peucker filtering - tolerance: %d, zExaggeration: %d",
        d,
        u
      );
      const m = "filtering";
      p.timeLevel(E.DEBUG, m);
      const f = je.simplify(c, d, u);
      return p.timeEndLevel(E.DEBUG, m), p.debug(
        "Filtering completed - points: %d → %d (%f % reduction)",
        g,
        f.length,
        ((g - f.length) / g * 100).toFixed(1)
      ), p.timeEndLevel(E.INFO, o), p.info(
        "Path processing completed - waypoints: %d, final points: %d, smoothed: %s, filtered: %s",
        e.length,
        f.length,
        n?.enabled,
        r?.enabled
      ), f;
    } else r?.enabled === !0 && p.debug(
      "Filtering skipped - insufficient points: %d (minimum: 3)",
      c.length
    );
    return p.timeEndLevel(E.INFO, o), p.info(
      "Path processing completed - waypoints: %d, final points: %d, smoothed: %s, filtered: %s",
      e.length,
      c.length,
      n?.enabled,
      r?.enabled
    ), c;
  }
  /**
   * Generate coordinates along a path with multiple waypoints
   * @param path - Array of coordinates defining the path
   * @param step - Distance between points in meters
   */
  *generateCoordinatesAlong(e, t) {
    if (e.length < 2) {
      p.debug("Path generation skipped - insufficient waypoints: %d", e.length);
      return;
    }
    p.debug("Generating coordinates - waypoints: %d, step: %dm", e.length, t), yield z(e[0]);
    let s = 1, i = 0;
    for (let n = 0; n < e.length - 1; n++) {
      const r = L.haversine(e[n], e[n + 1]);
      if (r < se.MIN_SEGMENT_DISTANCE) {
        i++, p.debug(
          "Segment %d skipped - distance too short: %.2fm (minimum: %.2fm)",
          n + 1,
          r,
          se.MIN_SEGMENT_DISTANCE
        );
        continue;
      }
      p.debug("Processing segment %d - distance: %.2fm", n + 1, r);
      let o = !0, l = 0;
      for (const c of this.generateCoordinatesBetween(e[n], e[n + 1], t)) {
        if (o) {
          o = !1;
          continue;
        }
        yield c, s++, l++;
      }
      p.debug("Segment %d completed - generated: %d points", n + 1, l);
    }
    i > 0 ? p.debug(
      "Path generation completed - generated: %d points, skipped segments: %d",
      s,
      i
    ) : p.debug("Path generation completed - generated: %d points", s);
  }
  /**
   * Generate coordinates between two points at regular intervals
   * @param coordinate1 - Start coordinate
   * @param coordinate2 - End coordinate
   * @param step - Distance between points in meters
   */
  *generateCoordinatesBetween(e, t, s) {
    const i = L.haversine(e, t);
    if (yield z(e), i <= s) {
      yield z(t);
      return;
    }
    const n = Math.floor(i / s), r = t.latitude - e.latitude, o = t.longitude - e.longitude;
    for (let l = 1; l <= n; l++) {
      const c = l * s / i;
      yield {
        latitude: e.latitude + r * c,
        longitude: e.longitude + o * c,
        elevation: 0
      };
    }
    yield z(t);
  }
}
const et = _("ElevationProvider");
class tt {
  // ============================================================================
  // CONSTRUCTOR & CONFIGURATION
  // ============================================================================
  constructor(e = {}) {
    this.config = {
      zoomLevel: e.zoomLevel ?? 12,
      cacheSize: e.cacheSize ?? 100,
      tileUrlTemplate: e.tileUrlTemplate ?? "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
    }, et.dir("Config :", this.config), this.validateConfig(), this.tileManager = new $e(this.config.tileUrlTemplate, this.config.cacheSize), this.calculator = new Qe(this.tileManager), this.batchCalculator = new Je(this.calculator);
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Get attribution information for elevation data
   */
  static getAttribution() {
    return {
      text: "Elevation data from multiple sources including SRTM, GMTED, NED and ETOPO1. Data processing by Mapzen/Tilezen.",
      url: "https://github.com/tilezen/joerd"
    };
  }
  // ============================================================================
  // PUBLIC API - SINGLE COORDINATE METHODS
  // ============================================================================
  /**
   * Get elevation at specific coordinates
   * @param latitude - Latitude in decimal degrees
   * @param longitude - Longitude in decimal degrees
   * @param options - Optional parameters
   */
  async getElevation(e, t, s) {
    const i = s?.interpolation ?? !0, n = { latitude: e, longitude: t };
    return await this.calculator.getElevation(n, this.config.zoomLevel, i);
  }
  // ============================================================================
  // PUBLIC API - BULK COORDINATE METHODS
  // ============================================================================
  /**
   * Get elevations for multiple coordinates from an interable
   * @param coordinates - Iteratable of coordinates
   * @param options - Optional parameters
   */
  async setElevations(e, t) {
    const s = t?.interpolation ?? !0;
    await this.batchCalculator.setElevations(e, this.config.zoomLevel, s);
  }
  /**
   * Get elevations along a path defined by multiple coordinates
   * @param path - Array of coordinates defining the path
   * @param options - Optional parameters
   */
  async getElevationsAlong(e, t) {
    const s = t?.step ?? 10, i = t?.interpolation ?? !0, n = t?.smoothingOptions, r = t?.filterOptions;
    return this.batchCalculator.getElevationsAlong(
      e,
      this.config.zoomLevel,
      s,
      i,
      n,
      r
    );
  }
  // ============================================================================
  // PRIVATE - VALIDATION
  // ============================================================================
  validateConfig() {
    const { zoomLevel: e, cacheSize: t } = this.config;
    if (!Number.isInteger(e) || e < 0 || e > 15)
      throw new Error(
        `Invalid zoom level: ${e}. Must be an integer between 0 and 15`
      );
    if (!Number.isInteger(t) || t <= 0)
      throw new Error(`Invalid cache size: ${t}. Must be a positive integer`);
  }
}
const v = _("tile/fetcher/CanvasPool");
class st {
  constructor(e) {
    this.available = [], this.idleSize = 5, this.idleTimeout = 3e4, this.idleTimer = null, this.totalCreated = 0, this.totalAcquired = 0, this.totalReleased = 0, this.builder = e;
  }
  /**
   * Acquire a canvas from the pool (creates new if none available)
   */
  acquire() {
    this.totalAcquired++;
    let e = this.available.pop();
    return e ? v.debug(
      "Canvas acquired from pool (pool size: %d → %d, total acquired: %d)",
      this.available.length + 1,
      this.available.length,
      this.totalAcquired
    ) : (e = this.builder(), this.totalCreated++, v.debug(
      "Canvas created - new canvas (total created: %d, pool size: %d)",
      this.totalCreated,
      this.available.length
    )), this._resetIdleTimer(), e;
  }
  /**
   * Return a canvas to the pool for reuse
   */
  release(e) {
    e ? (this.totalReleased++, this.available.push(e), v.debug(
      "Canvas released to pool (pool size: %d → %d, total released: %d)",
      this.available.length - 1,
      this.available.length,
      this.totalReleased
    ), this._resetIdleTimer()) : v.warn("Canvas release attempted with null/undefined canvas");
  }
  /**
   * Reset the idle timer for automatic cleanup
   */
  _resetIdleTimer() {
    this.idleTimer ? (clearTimeout(this.idleTimer), v.debug("Idle timer reset - previous timer cleared")) : v.debug("Idle timer started - %d ms until auto-trim", this.idleTimeout), this.idleTimer = setTimeout(() => this._trim(), this.idleTimeout);
  }
  /**
   * Trim excess canvases to prevent memory buildup
   */
  _trim() {
    const e = this.available.length;
    let t = 0;
    if (e > this.idleSize) {
      for (v.debug(
        "Auto-trim triggered - pool size %d exceeds idle limit %d",
        e,
        this.idleSize
      ); this.available.length > this.idleSize; )
        this.available.pop(), t++;
      v.info(
        "Canvas pool trimmed - removed %d canvases (pool size: %d → %d)",
        t,
        e,
        this.available.length
      );
    } else
      v.debug(
        "Auto-trim skipped - pool size %d within idle limit %d",
        e,
        this.idleSize
      );
    this.idleTimer = null;
  }
}
class it {
  constructor(e, t) {
    this.data = e, this.bitmap = t;
  }
  close() {
    this.bitmap.close();
  }
  /**
   * Extract RGB values from ImageData at specific pixel position
   * @param imageData - Image data from terrain tile
   * @param position - Pixel coordinates within the tile
   * @returns RGB color values for elevation decoding
   */
  getRGBFromImageData(e) {
    const t = this.data;
    if (e.x < 0 || e.x >= t.width)
      throw new Error(
        `Invalid x position: ${e.x}. Must be between 0 and ${t.width - 1}`
      );
    if (e.y < 0 || e.y >= t.height)
      throw new Error(
        `Invalid y position: ${e.y}. Must be between 0 and ${t.height - 1}`
      );
    const s = (e.y * t.width + e.x) * 4;
    return {
      red: t.data[s],
      green: t.data[s + 1],
      blue: t.data[s + 2]
      // Alpha channel (index + 3) is ignored for Terrarium encoding
    };
  }
}
class nt {
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  constructor() {
    this.canvasPool = new st(() => document.createElement("canvas"));
  }
  /**
   * Fetch a tile image and return both ImageData and ImageBitmap for memory management
   * @param url - The URL of the tile to fetch
   * @param tileKey - The tile identifier for logging
   * @returns Promise<Tile> - Object containing ImageData and ImageBitmap
   */
  async fetchTile(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(`HTTP ${t.status}: ${t.statusText}`);
    const s = await t.blob(), i = await createImageBitmap(s), n = this.canvasPool.acquire();
    try {
      n.width = i.width, n.height = i.height;
      const r = n.getContext("2d", { willReadFrequently: !0 });
      if (!r)
        throw new Error("Failed to get 2D canvas context");
      r.drawImage(i, 0, 0);
      const o = r.getImageData(0, 0, i.width, i.height);
      return new it(o, i);
    } finally {
      this.canvasPool.release(n);
    }
  }
}
const rt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BrowserTileFetcher: nt
}, Symbol.toStringTag, { value: "Module" }));
var h = /* @__PURE__ */ ((a) => (a[a.LAT = 0] = "LAT", a[a.LON = 1] = "LON", a[a.ELE = 2] = "ELE", a[a.BEARING = 3] = "BEARING", a[a.DIST = 4] = "DIST", a[a.RADIUS = 5] = "RADIUS", a[a.TIME = 6] = "TIME", a[a.ELAPSED = 7] = "ELAPSED", a[a.POWER = 8] = "POWER", a[a.P_CYCLIST_RAW = 9] = "P_CYCLIST_RAW", a[a.P_CYCLIST_WHEEL = 10] = "P_CYCLIST_WHEEL", a[a.P_CYCLIST_OPTIMAL_POWER = 11] = "P_CYCLIST_OPTIMAL_POWER", a[a.P_CYCLIST_POWER_NEEDED = 12] = "P_CYCLIST_POWER_NEEDED", a[a.P_AERO = 13] = "P_AERO", a[a.P_GRAVITY = 14] = "P_GRAVITY", a[a.P_ROLLING_RESISTANCE = 15] = "P_ROLLING_RESISTANCE", a[a.P_WHEEL_BEARINGS = 16] = "P_WHEEL_BEARINGS", a[a.P_POWER_FROM_ACC = 17] = "P_POWER_FROM_ACC", a[a.P_POWER_WHEEL_FROM_ACC = 18] = "P_POWER_WHEEL_FROM_ACC", a[a.AERO_COEF = 19] = "AERO_COEF", a[a.GRADE = 20] = "GRADE", a[a.SPEED = 21] = "SPEED", a[a.SPEED_MAX = 22] = "SPEED_MAX", a[a.SPEED_MAX_INCLINE = 23] = "SPEED_MAX_INCLINE", a[a.VIRT_SPEED_CURRENT = 24] = "VIRT_SPEED_CURRENT", a[a.TEMPERATURE = 25] = "TEMPERATURE", a[a.WIND_SPEED = 26] = "WIND_SPEED", a[a.WIND_DIRECTION = 27] = "WIND_DIRECTION", a[a.WIND_BEARING = 28] = "WIND_BEARING", a[a.WIND_ALPHA = 29] = "WIND_ALPHA", a[a.HEART_RATE = 30] = "HEART_RATE", a[a.CADENCE = 31] = "CADENCE", a))(h || {}), at = /* @__PURE__ */ ((a) => (a.lat = "lat", a.lon = "lon", a.ele = "ele", a.bearing = "bearing", a.dist = "dist", a.radius = "radius", a.time = "time", a.elapsed = "elapsed", a.power = "power", a.pCyclistRaw = "pCyclistRaw", a.pCyclistWheel = "pCyclistWheel", a.pCyclistOptimalPower = "pCyclistOptimalPower", a.pCyclistPowerNeeded = "pCyclistPowerNeeded", a.pAero = "pAero", a.pGravity = "pGravity", a.pRollingResistance = "pRollingResistance", a.pWheelBearings = "pWheelBearings", a.pPowerFromAcc = "pPowerFromAcc", a.pPowerWheelFromAcc = "pPowerWheelFromAcc", a.aeroCoef = "aeroCoef", a.grade = "grade", a.speed = "speed", a.speedMax = "speedMax", a.speedMaxIncline = "speedMaxIncline", a.virtSpeedCurrent = "virtSpeedCurrent", a.temperature = "temperature", a.windSpeed = "windSpeed", a.windDirection = "windDirection", a.windBearing = "windBearing", a.windAlpha = "windAlpha", a.heartRate = "heartRate", a.cadence = "cadence", a))(at || {});
const Vt = {
  // Spatial & Navigation (6 properties)
  lat: 0,
  // Latitude (radians)
  lon: 1,
  // Longitude (radians)
  ele: 2,
  // Elevation (meters)
  bearing: 3,
  // Direction bearing (radians)
  dist: 4,
  // Distance (meters)
  radius: 5,
  // Turn radius (meters)
  // Temporal (2 properties)
  time: 6,
  // Timestamp (ms since epoch)
  elapsed: 7,
  // Elapsed duration (ms)
  // Physics & Power (13 properties)
  power: 8,
  // Total power (watts)
  pCyclistRaw: 9,
  // Raw cyclist power
  pCyclistWheel: 10,
  // Cyclist wheel power
  pCyclistOptimalPower: 11,
  // Optimal power
  pCyclistPowerNeeded: 12,
  // Power needed
  pAero: 13,
  // Aerodynamic power
  pGravity: 14,
  // Gravitational power
  pRollingResistance: 15,
  // Rolling resistance power
  pWheelBearings: 16,
  // Wheel bearings power
  pPowerFromAcc: 17,
  // Power from acceleration
  pPowerWheelFromAcc: 18,
  // Wheel power from acceleration
  aeroCoef: 19,
  // Aerodynamic coefficient
  grade: 20,
  // Road grade/slope (%)
  // Speed & Motion (4 properties)
  speed: 21,
  // Current speed (m/s)
  speedMax: 22,
  // Maximum speed (m/s)
  speedMaxIncline: 23,
  // Max speed on incline (m/s)
  virtSpeedCurrent: 24,
  // Virtual current speed (m/s)
  // Environmental (5 properties)
  temperature: 25,
  // Temperature (celsius)
  windSpeed: 26,
  // Wind speed (m/s)
  windDirection: 27,
  // Wind direction (radians)
  windBearing: 28,
  // Wind bearing (radians)
  windAlpha: 29,
  // Wind angle (radians)
  // Physiological (2 properties)
  heartRate: 30,
  // Heart rate (bpm)
  cadence: 31
  /* CADENCE */
  // Pedaling cadence (rpm)
}, Z = 32, Ne = {
  // Spatial & Navigation
  lat: NaN,
  lon: NaN,
  ele: NaN,
  bearing: NaN,
  dist: NaN,
  radius: NaN,
  // Temporal
  time: NaN,
  elapsed: NaN,
  // Physics & Power
  power: NaN,
  pCyclistRaw: NaN,
  pCyclistWheel: NaN,
  pCyclistOptimalPower: NaN,
  pCyclistPowerNeeded: NaN,
  pAero: NaN,
  pGravity: NaN,
  pRollingResistance: NaN,
  pWheelBearings: NaN,
  pPowerFromAcc: NaN,
  pPowerWheelFromAcc: NaN,
  aeroCoef: NaN,
  grade: NaN,
  // Speed & Motion
  speed: NaN,
  speedMax: NaN,
  speedMaxIncline: NaN,
  virtSpeedCurrent: NaN,
  // Environmental
  temperature: NaN,
  windSpeed: NaN,
  windDirection: NaN,
  windBearing: NaN,
  windAlpha: NaN,
  // Physiological
  heartRate: NaN,
  cadence: NaN
};
class ot {
  constructor(e) {
    this.name = e, this.CHUNK_SIZE = 1e3, this.INITIAL_CHUNKS = 2, this.chunks = [], this.pointCount = 0, this.ensureCapacity(this.INITIAL_CHUNKS * this.CHUNK_SIZE);
  }
  /**
   * Gets the total number of points stored.
   */
  get length() {
    return this.pointCount;
  }
  /**
   * Gets the total number of points stored.
   */
  getPointCount() {
    return this.pointCount;
  }
  /**
   * Gets the current capacity (total points that can be stored without reallocation).
   */
  get capacity() {
    return this.chunks.length * this.CHUNK_SIZE;
  }
  /**
   * Gets memory usage statistics.
   */
  getMemoryInfo() {
    const e = this.chunks.length * this.CHUNK_SIZE * Z * 8;
    return {
      chunksCount: this.chunks.length,
      pointsCapacity: this.capacity,
      usedPoints: this.pointCount,
      memoryMB: e / (1024 * 1024)
    };
  }
  /**
   * Ensures there is capacity for at least the specified number of points.
   */
  ensureCapacity(e) {
    const t = Math.ceil(e / this.CHUNK_SIZE);
    for (; this.chunks.length < t; )
      this.chunks.push(new Float64Array(this.CHUNK_SIZE * Z));
  }
  /**
   * Calculates the chunk index and field offset for a given point and field.
   */
  getOffset(e, t) {
    if (e < 0 || e >= this.pointCount)
      throw new Error(`Point index ${e} out of bounds [0, ${this.pointCount})`);
    const s = Math.floor(e / this.CHUNK_SIZE), n = e % this.CHUNK_SIZE * Z + t;
    return { chunkIndex: s, fieldOffset: n };
  }
  /**
   * Gets a field value for a specific point.
   */
  getField(e, t) {
    const { chunkIndex: s, fieldOffset: i } = this.getOffset(e, t);
    return this.chunks[s][i];
  }
  /**
   * Sets a field value for a specific point.
   */
  setField(e, t, s) {
    const { chunkIndex: i, fieldOffset: n } = this.getOffset(e, t);
    this.chunks[i][n] = s;
  }
  /**
   * Clears all data and resets to initial state.
   */
  clear() {
    this.pointCount = 0, this.chunks.length > this.INITIAL_CHUNKS && (this.chunks.length = this.INITIAL_CHUNKS);
    for (const e of this.chunks)
      e.fill(0);
  }
}
const H = (a) => a * Math.PI / 180, F = (a) => a * 180 / Math.PI, I = class I {
};
I.ERROR = 0, I.WARN = 1, I.INFO = 2, I.DEBUG = 3, I.TRACE = 4;
let N = I;
const lt = {
  error: N.ERROR,
  warn: N.WARN,
  info: N.INFO,
  debug: N.DEBUG,
  trace: N.TRACE
}, Ee = {
  0: "ERROR",
  1: "WARN",
  2: "INFO",
  3: "DEBUG",
  4: "TRACE"
}, we = {
  0: console.error,
  1: console.error,
  2: console.log,
  3: console.log,
  4: console.log
};
class ct {
  constructor(e) {
    this.namespace = e, this.level = lt.warn;
  }
  shouldLog(e) {
    return e <= this.level;
  }
  doLog(e, t, ...s) {
    const i = `[${this.namespace}:${Ee[e]}]`;
    typeof t == "string" ? we[e](`${i} ${t}`, ...s) : we[e](i, t, ...s);
  }
  log(e, t, ...s) {
    this.shouldLog(e) && this.doLog(e, t, ...s);
  }
  /**
   * Log debug information (verbose output for development)
   * Supports printf-style formatting: logger.debug('Value: %s, Count: %d', value, count)
   */
  trace(e, ...t) {
  }
  /**
   * Log debug information (verbose output for development)
   * Supports printf-style formatting: logger.debug('Value: %s, Count: %d', value, count)
   */
  debug(e, ...t) {
  }
  /**
   * Log general information
   * Supports printf-style formatting: logger.info('User %s logged in', username)
   */
  info(e, ...t) {
  }
  /**
   * Log warnings
   * Supports printf-style formatting: logger.warn('Timeout after %dms', timeout)
   */
  warn(e, ...t) {
    this.log(N.WARN, e, ...t);
  }
  /**
   * Log errors
   * Supports printf-style formatting: logger.error('Failed to load %s: %o', file, error)
   */
  error(e, ...t) {
    this.log(N.ERROR, e, ...t);
  }
  getTimeLabel(e, t) {
    return `[${this.namespace}:${Ee[e]}] ${t}`;
  }
  doTime(e, t) {
    console.time(this.getTimeLabel(e, t));
  }
  doTimeEnd(e, t) {
    console.timeEnd(this.getTimeLabel(e, t));
  }
  /**
   * Log with timing information
   * Useful for performance debugging
   */
  timeLevel(e, t) {
  }
  /**
   * End timing and log duration
   */
  timeEndLevel(e, t) {
  }
  /**
   * Log with timing information
   * Useful for performance debugging
   */
  time(e) {
    this.doTime(N.INFO, e);
  }
  /**
   * End timing and log duration
   */
  timeEnd(e) {
    this.doTimeEnd(N.INFO, e);
  }
  logDir(e, t, s, i) {
    this.doLog(e, "DIR %s", t), console.dir(s, i);
  }
  /**
   * Display an interactive list of object properties
   * Useful for exploring complex objects in development
   * @param obj - The object to inspect
   * @param options - Optional display options
   */
  dirLevel(e, t, s, i) {
  }
  /**
   * Display an interactive list of object properties
   * Useful for exploring complex objects in development
   * @param obj - The object to inspect
   * @param options - Optional display options
   */
  dir(e, t, s) {
    this.logDir(N.INFO, e, t, s);
  }
  /**
   * Clear the console
   */
  clear() {
    console.clear();
  }
}
const Re = (a) => new ct(a);
class M {
  constructor(e, t, s) {
    this.x = e, this.y = t, this.z = s;
  }
  /**
   * Calculate Euclidean distance between two vectors
   */
  distanceTo(e) {
    const t = this.x - e.x, s = this.y - e.y, i = this.z - e.z;
    return Math.hypot(t, s, i);
  }
  /**
   * Subtract two vectors
   */
  subtract(e) {
    return new M(this.x - e.x, this.y - e.y, this.z - e.z);
  }
  /**
   * Add two vectors
   */
  add(e) {
    return new M(this.x + e.x, this.y + e.y, this.z + e.z);
  }
  /**
   * Multiply vector by scalar
   */
  multiply(e) {
    return new M(this.x * e, this.y * e, this.z * e);
  }
  /**
   * Calculate dot product with another vector
   */
  dot(e) {
    return this.x * e.x + this.y * e.y + this.z * e.z;
  }
  /**
   * Calculate cross product with another vector
   */
  cross(e) {
    return new M(
      this.y * e.z - this.z * e.y,
      this.z * e.x - this.x * e.z,
      this.x * e.y - this.y * e.x
    );
  }
  /**
   * Calculate the magnitude (length) of the vector
   */
  magnitude() {
    return Math.hypot(this.x, this.y, this.z);
  }
  /**
   * Normalize the vector to unit length
   */
  normalize() {
    const e = this.magnitude();
    return e === 0 ? new M(0, 0, 0) : this.multiply(1 / e);
  }
  /**
   * Calculate perpendicular distance from this point to a line segment defined by two points
   * Uses the formula: ||(p-a) × (p-b)|| / ||b-a||
   * where p is this point, a and b are the line segment endpoints
   */
  distanceToSegment(e, t) {
    const s = t.subtract(e), i = s.magnitude();
    if (i === 0)
      return this.distanceTo(e);
    const r = this.subtract(e).dot(s) / (i * i), o = Math.max(0, Math.min(1, r)), l = e.add(s.multiply(o));
    return this.distanceTo(l);
  }
}
class ht extends ot {
  // === Spatial & Navigation Accessors ===
  getLatitude(e) {
    return super.getField(e, h.LAT);
  }
  getLatitudeDeg(e) {
    return F(super.getField(e, h.LAT));
  }
  setLatitude(e, t) {
    super.setField(e, h.LAT, t);
  }
  getLongitude(e) {
    return super.getField(e, h.LON);
  }
  getLongitudeDeg(e) {
    return F(super.getField(e, h.LON));
  }
  setLongitude(e, t) {
    super.setField(e, h.LON, t);
  }
  getElevation(e) {
    return super.getField(e, h.ELE);
  }
  setElevation(e, t) {
    super.setField(e, h.ELE, t);
  }
  getBearing(e) {
    return super.getField(e, h.BEARING);
  }
  setBearing(e, t) {
    super.setField(e, h.BEARING, t);
  }
  getDistance(e) {
    return super.getField(e, h.DIST);
  }
  setDistance(e, t) {
    super.setField(e, h.DIST, t);
  }
  getRadius(e) {
    return super.getField(e, h.RADIUS);
  }
  setRadius(e, t) {
    super.setField(e, h.RADIUS, t);
  }
  // === Temporal Accessors ===
  getTime(e) {
    return super.getField(e, h.TIME);
  }
  setTime(e, t) {
    const s = t instanceof Date ? t.getTime() : t;
    super.setField(e, h.TIME, s);
  }
  getTimeAsDate(e) {
    return new Date(this.getTime(e));
  }
  getElapsed(e) {
    return super.getField(e, h.ELAPSED);
  }
  setElapsed(e, t) {
    super.setField(e, h.ELAPSED, t);
  }
  // === Physics & Power Accessors ===
  getPower(e) {
    return super.getField(e, h.POWER);
  }
  setPower(e, t) {
    super.setField(e, h.POWER, t);
  }
  getPCyclistRaw(e) {
    return super.getField(e, h.P_CYCLIST_RAW);
  }
  setPCyclistRaw(e, t) {
    super.setField(e, h.P_CYCLIST_RAW, t);
  }
  getPCyclistWheel(e) {
    return super.getField(e, h.P_CYCLIST_WHEEL);
  }
  setPCyclistWheel(e, t) {
    super.setField(e, h.P_CYCLIST_WHEEL, t);
  }
  getPCyclistOptimalPower(e) {
    return super.getField(e, h.P_CYCLIST_OPTIMAL_POWER);
  }
  setPCyclistOptimalPower(e, t) {
    super.setField(e, h.P_CYCLIST_OPTIMAL_POWER, t);
  }
  getPCyclistPowerNeeded(e) {
    return super.getField(e, h.P_CYCLIST_POWER_NEEDED);
  }
  setPCyclistPowerNeeded(e, t) {
    super.setField(e, h.P_CYCLIST_POWER_NEEDED, t);
  }
  getPAero(e) {
    return super.getField(e, h.P_AERO);
  }
  setPAero(e, t) {
    super.setField(e, h.P_AERO, t);
  }
  getPGravity(e) {
    return super.getField(e, h.P_GRAVITY);
  }
  setPGravity(e, t) {
    super.setField(e, h.P_GRAVITY, t);
  }
  getPRollingResistance(e) {
    return super.getField(e, h.P_ROLLING_RESISTANCE);
  }
  setPRollingResistance(e, t) {
    super.setField(e, h.P_ROLLING_RESISTANCE, t);
  }
  getPWheelBearings(e) {
    return super.getField(e, h.P_WHEEL_BEARINGS);
  }
  setPWheelBearings(e, t) {
    super.setField(e, h.P_WHEEL_BEARINGS, t);
  }
  getPPowerFromAcc(e) {
    return super.getField(e, h.P_POWER_FROM_ACC);
  }
  setPPowerFromAcc(e, t) {
    super.setField(e, h.P_POWER_FROM_ACC, t);
  }
  getPPowerWheelFromAcc(e) {
    return super.getField(e, h.P_POWER_WHEEL_FROM_ACC);
  }
  setPPowerWheelFromAcc(e, t) {
    super.setField(e, h.P_POWER_WHEEL_FROM_ACC, t);
  }
  getAeroCoef(e) {
    return super.getField(e, h.AERO_COEF);
  }
  setAeroCoef(e, t) {
    super.setField(e, h.AERO_COEF, t);
  }
  getGrade(e) {
    return super.getField(e, h.GRADE);
  }
  setGrade(e, t) {
    super.setField(e, h.GRADE, t);
  }
  // === Speed & Motion Accessors ===
  getSpeed(e) {
    return super.getField(e, h.SPEED);
  }
  setSpeed(e, t) {
    super.setField(e, h.SPEED, t);
  }
  getSpeedMax(e) {
    return super.getField(e, h.SPEED_MAX);
  }
  setSpeedMax(e, t) {
    super.setField(e, h.SPEED_MAX, t);
  }
  getSpeedMaxIncline(e) {
    return super.getField(e, h.SPEED_MAX_INCLINE);
  }
  setSpeedMaxIncline(e, t) {
    super.setField(e, h.SPEED_MAX_INCLINE, t);
  }
  getVirtSpeedCurrent(e) {
    return super.getField(e, h.VIRT_SPEED_CURRENT);
  }
  setVirtSpeedCurrent(e, t) {
    super.setField(e, h.VIRT_SPEED_CURRENT, t);
  }
  // === Environmental Accessors ===
  getTemperature(e) {
    return super.getField(e, h.TEMPERATURE);
  }
  setTemperature(e, t) {
    super.setField(e, h.TEMPERATURE, t);
  }
  getWindSpeed(e) {
    return super.getField(e, h.WIND_SPEED);
  }
  setWindSpeed(e, t) {
    super.setField(e, h.WIND_SPEED, t);
  }
  getWindDirection(e) {
    return super.getField(e, h.WIND_DIRECTION);
  }
  setWindDirection(e, t) {
    super.setField(e, h.WIND_DIRECTION, t);
  }
  getWindBearing(e) {
    return super.getField(e, h.WIND_BEARING);
  }
  setWindBearing(e, t) {
    super.setField(e, h.WIND_BEARING, t);
  }
  getWindAlpha(e) {
    return super.getField(e, h.WIND_ALPHA);
  }
  setWindAlpha(e, t) {
    super.setField(e, h.WIND_ALPHA, t);
  }
  // === Physiological Accessors ===
  getHeartRate(e) {
    return super.getField(e, h.HEART_RATE);
  }
  setHeartRate(e, t) {
    super.setField(e, h.HEART_RATE, t);
  }
  getCadence(e) {
    return super.getField(e, h.CADENCE);
  }
  setCadence(e, t) {
    super.setField(e, h.CADENCE, t);
  }
  /**
   * Adds a new point with the provided data.
   * @param data Complete point data with all 32 properties
   * @returns The index of the newly added point
   */
  addPoint(e) {
    const t = this.pointCount;
    return this.ensureCapacity(t + 1), this.pointCount++, this.setLatitude(t, e.lat), this.setLongitude(t, e.lon), this.setElevation(t, e.ele), this.setBearing(t, e.bearing), this.setDistance(t, e.dist), this.setRadius(t, e.radius), this.setTime(t, e.time), this.setElapsed(t, e.elapsed), this.setPower(t, e.power), this.setPCyclistRaw(t, e.pCyclistRaw), this.setPCyclistWheel(t, e.pCyclistWheel), this.setPCyclistOptimalPower(t, e.pCyclistOptimalPower), this.setPCyclistPowerNeeded(t, e.pCyclistPowerNeeded), this.setPAero(t, e.pAero), this.setPGravity(t, e.pGravity), this.setPRollingResistance(t, e.pRollingResistance), this.setPWheelBearings(t, e.pWheelBearings), this.setPPowerFromAcc(t, e.pPowerFromAcc), this.setPPowerWheelFromAcc(t, e.pPowerWheelFromAcc), this.setAeroCoef(t, e.aeroCoef), this.setGrade(t, e.grade), this.setSpeed(t, e.speed), this.setSpeedMax(t, e.speedMax), this.setSpeedMaxIncline(t, e.speedMaxIncline), this.setVirtSpeedCurrent(t, e.virtSpeedCurrent), this.setTemperature(t, e.temperature), this.setWindSpeed(t, e.windSpeed), this.setWindDirection(t, e.windDirection), this.setWindBearing(t, e.windBearing), this.setWindAlpha(t, e.windAlpha), this.setHeartRate(t, e.heartRate), this.setCadence(t, e.cadence), t;
  }
  /**
   * Gets all data for a specific point.
   */
  getPointData(e) {
    return {
      // Spatial & Navigation
      lat: this.getLatitude(e),
      lon: this.getLongitude(e),
      ele: this.getElevation(e),
      bearing: this.getBearing(e),
      dist: this.getDistance(e),
      radius: this.getRadius(e),
      // Temporal
      time: this.getTime(e),
      elapsed: this.getElapsed(e),
      // Physics & Power
      power: this.getPower(e),
      pCyclistRaw: this.getPCyclistRaw(e),
      pCyclistWheel: this.getPCyclistWheel(e),
      pCyclistOptimalPower: this.getPCyclistOptimalPower(e),
      pCyclistPowerNeeded: this.getPCyclistPowerNeeded(e),
      pAero: this.getPAero(e),
      pGravity: this.getPGravity(e),
      pRollingResistance: this.getPRollingResistance(e),
      pWheelBearings: this.getPWheelBearings(e),
      pPowerFromAcc: this.getPPowerFromAcc(e),
      pPowerWheelFromAcc: this.getPPowerWheelFromAcc(e),
      aeroCoef: this.getAeroCoef(e),
      grade: this.getGrade(e),
      // Speed & Motion
      speed: this.getSpeed(e),
      speedMax: this.getSpeedMax(e),
      speedMaxIncline: this.getSpeedMaxIncline(e),
      virtSpeedCurrent: this.getVirtSpeedCurrent(e),
      // Environmental
      temperature: this.getTemperature(e),
      windSpeed: this.getWindSpeed(e),
      windDirection: this.getWindDirection(e),
      windBearing: this.getWindBearing(e),
      windAlpha: this.getWindAlpha(e),
      // Physiological
      heartRate: this.getHeartRate(e),
      cadence: this.getCadence(e)
    };
  }
  // Helper function for strict NaN handling
  interpolateValue(e, t, s) {
    return isNaN(e) || isNaN(t) ? NaN : e + (t - e) * s;
  }
  /**
   * Interpolates a new point between two existing points.
   *
   * Uses linear interpolation for all numeric fields:
   * - result = p1 + (p2 - p1) × coef
   *
   * **NaN Handling (STRICT):**
   * - If either p1 or p2 value is NaN, result is NaN
   * - This ensures data integrity for incomplete GPS data
   *
   * @param index1 Index of first point
   * @param index2 Index of second point
   * @param coef Interpolation coefficient (0 = p1, 1 = p2, 0.5 = midpoint)
   * @returns Interpolated point
   */
  interpolatePoint(e, t, s) {
    const i = this.getPointData(e), n = this.getPointData(t);
    return {
      // Spatial & Navigation
      lat: this.interpolateValue(i.lat, n.lat, s),
      lon: this.interpolateValue(i.lon, n.lon, s),
      ele: this.interpolateValue(i.ele, n.ele, s),
      bearing: this.interpolateValue(i.bearing, n.bearing, s),
      dist: this.interpolateValue(i.dist, n.dist, s),
      radius: this.interpolateValue(i.radius, n.radius, s),
      // Temporal
      time: this.interpolateValue(i.time, n.time, s),
      elapsed: this.interpolateValue(i.elapsed, n.elapsed, s),
      // Physics & Power
      power: this.interpolateValue(i.power, n.power, s),
      pCyclistRaw: this.interpolateValue(i.pCyclistRaw, n.pCyclistRaw, s),
      pCyclistWheel: this.interpolateValue(i.pCyclistWheel, n.pCyclistWheel, s),
      pCyclistOptimalPower: this.interpolateValue(
        i.pCyclistOptimalPower,
        n.pCyclistOptimalPower,
        s
      ),
      pCyclistPowerNeeded: this.interpolateValue(
        i.pCyclistPowerNeeded,
        n.pCyclistPowerNeeded,
        s
      ),
      pAero: this.interpolateValue(i.pAero, n.pAero, s),
      pGravity: this.interpolateValue(i.pGravity, n.pGravity, s),
      pRollingResistance: this.interpolateValue(
        i.pRollingResistance,
        n.pRollingResistance,
        s
      ),
      pWheelBearings: this.interpolateValue(i.pWheelBearings, n.pWheelBearings, s),
      pPowerFromAcc: this.interpolateValue(i.pPowerFromAcc, n.pPowerFromAcc, s),
      pPowerWheelFromAcc: this.interpolateValue(
        i.pPowerWheelFromAcc,
        n.pPowerWheelFromAcc,
        s
      ),
      aeroCoef: this.interpolateValue(i.aeroCoef, n.aeroCoef, s),
      grade: this.interpolateValue(i.grade, n.grade, s),
      // Speed & Motion
      speed: this.interpolateValue(i.speed, n.speed, s),
      speedMax: this.interpolateValue(i.speedMax, n.speedMax, s),
      speedMaxIncline: this.interpolateValue(i.speedMaxIncline, n.speedMaxIncline, s),
      virtSpeedCurrent: this.interpolateValue(i.virtSpeedCurrent, n.virtSpeedCurrent, s),
      // Environmental
      temperature: this.interpolateValue(i.temperature, n.temperature, s),
      windSpeed: this.interpolateValue(i.windSpeed, n.windSpeed, s),
      windDirection: this.interpolateValue(i.windDirection, n.windDirection, s),
      windBearing: this.interpolateValue(i.windBearing, n.windBearing, s),
      windAlpha: this.interpolateValue(i.windAlpha, n.windAlpha, s),
      // Physiological
      heartRate: this.interpolateValue(i.heartRate, n.heartRate, s),
      cadence: this.interpolateValue(i.cadence, n.cadence, s)
    };
  }
}
class G extends ht {
  constructor() {
    super(...arguments), this.totalDistance = 0, this.timeStart = 0, this.minElevation = Number.MAX_VALUE, this.maxElevation = -Number.MAX_VALUE, this.totalElevationGain = 0, this.totalElevationLoss = 0, this.minLat = Number.MAX_VALUE, this.maxLat = -Number.MAX_VALUE, this.minLon = Number.MAX_VALUE, this.maxLon = -Number.MAX_VALUE;
  }
  /**
   * Clears all data and resets to initial state.
   */
  clear() {
    super.clear(), this.totalDistance = 0, this.timeStart = 0, this.minElevation = Number.MAX_VALUE, this.maxElevation = -Number.MAX_VALUE, this.totalElevationGain = 0, this.totalElevationLoss = 0, this.minLat = Number.MAX_VALUE, this.maxLat = -Number.MAX_VALUE, this.minLon = Number.MAX_VALUE, this.maxLon = -Number.MAX_VALUE;
  }
  /**
   * Creates an iterator for efficient point traversal.
   */
  *[Symbol.iterator]() {
    for (let e = 0; e < this.pointCount; e++)
      yield this.getPointData(e);
  }
  /**
   * Creates an iterator for accessing raw coordinate data efficiently.
   * Useful for integrating with existing Coordinates-based code.
   */
  *coordinatesIterator() {
    for (let e = 0; e < this.pointCount; e++)
      yield {
        latitude: F(this.getLatitude(e)),
        longitude: F(this.getLongitude(e)),
        elevation: this.getElevation(e)
      };
  }
  /**
   * Gets data for a range of points.
   */
  getPointRange(e, t) {
    if (e < 0 || e >= this.pointCount)
      throw new Error(`Start index ${e} out of bounds [0, ${this.pointCount})`);
    if (e + t > this.pointCount)
      throw new Error(
        `Range [${e}, ${e + t}) exceeds point count ${this.pointCount}`
      );
    const s = [];
    for (let i = 0; i < t; i++)
      s.push(this.getPointData(e + i));
    return s;
  }
  /**
   * Get total distance of the track.
   * @returns Total distance in meters
   */
  getTotalDistance() {
    return this.totalDistance;
  }
  /**
   * Get minimum elevation in the track.
   * @returns Minimum elevation in meters
   */
  getMinElevation() {
    return this.minElevation === Number.MAX_VALUE ? 0 : this.minElevation;
  }
  /**
   * Get maximum elevation in the track.
   * @returns Maximum elevation in meters
   */
  getMaxElevation() {
    return this.maxElevation === -Number.MAX_VALUE ? 0 : this.maxElevation;
  }
  /**
   * Get total elevation gain.
   * @returns Total elevation gain in meters
   */
  getTotalElevationGain() {
    return this.totalElevationGain;
  }
  /**
   * Get total elevation loss.
   * @returns Total elevation loss in meters (negative value)
   */
  getTotalElevationLoss() {
    return this.totalElevationLoss;
  }
  /**
   * Get geographic bounds of the track.
   * @returns Bounding box with min/max latitude and longitude
   */
  getBounds() {
    return {
      minLat: this.minLat === Number.MAX_VALUE ? 0 : this.minLat,
      maxLat: this.maxLat === -Number.MAX_VALUE ? 0 : this.maxLat,
      minLon: this.minLon === Number.MAX_VALUE ? 0 : this.minLon,
      maxLon: this.maxLon === -Number.MAX_VALUE ? 0 : this.maxLon
    };
  }
  /**
   * Get all cumulative distances as an array for efficient binary search.
   * This is used by VirtualizeService for GPS waypoint alignment.
   *
   * @returns Array of cumulative distances for all points
   */
  getAllDistances() {
    const e = new Float64Array(this.pointCount);
    for (let t = 0; t < this.pointCount; t++)
      e[t] = this.getDistance(t);
    return e;
  }
  /**
   * Compute derived arrays and statistics from GPS track data.
   * Calculates distances, elevations, grades, speeds, and bearings.
   * Based on Java computeDerivedData() method from gpx2web project.
   */
  computeDerivedData() {
    if (this.totalDistance = 0, this.timeStart = 0, this.minElevation = Number.MAX_VALUE, this.maxElevation = -Number.MAX_VALUE, this.totalElevationGain = 0, this.totalElevationLoss = 0, this.minLat = Number.MAX_VALUE, this.maxLat = -Number.MAX_VALUE, this.minLon = Number.MAX_VALUE, this.maxLon = -Number.MAX_VALUE, this.pointCount !== 0) {
      this.timeStart = this.getTime(0);
      for (let e = 0; e < this.pointCount; e++) {
        const t = this.getLatitude(e), s = this.getLongitude(e), i = this.getElevation(e);
        if (this.minLat = Math.min(this.minLat, t), this.maxLat = Math.max(this.maxLat, t), this.minLon = Math.min(this.minLon, s), this.maxLon = Math.max(this.maxLon, s), this.minElevation = Math.min(this.minElevation, i), this.maxElevation = Math.max(this.maxElevation, i), e > 0) {
          const n = this.getLatitude(e - 1), r = this.getLongitude(e - 1), o = this.getElevation(e - 1), l = this.distanceTo(n, r, t, s);
          this.totalDistance += l;
          const c = i - o;
          c > 0 ? this.totalElevationGain += c : this.totalElevationLoss += c;
        }
        this.setDistance(e, this.totalDistance);
      }
      for (let e = 0; e < this.pointCount; e++) {
        const t = this.getDistance(e), s = this.getElevation(e), i = this.getTime(e);
        this.setElapsed(e, (i - this.timeStart) / 1e3);
        let n = e + 1;
        for (; n < this.pointCount && Math.abs(this.getDistance(n) - t) < 1e-3; )
          n++;
        n = Math.min(this.pointCount - 1, n);
        const r = this.getDistance(n) - t;
        if (r > 0) {
          const l = (this.getElevation(n) - s) / r;
          this.setGrade(e, l);
          const c = this.getTime(n) - i;
          if (c > 0) {
            const b = r * 1e3 / c;
            this.setSpeed(e, b);
          }
          const d = this.getLatitude(e), u = this.getLongitude(e), g = this.getLatitude(n), m = this.getLongitude(n), f = this.project(d, u), P = this.project(g, m), A = P.y - f.y, T = P.x - f.x, y = Math.atan2(-A, T);
          this.setBearing(e, y);
        } else
          this.setGrade(e, 0), this.setBearing(e, 0);
      }
    }
  }
  /**
   * Calculate distance between two points using Haversine formula.
   * @param lat1 Latitude of first point (radians)
   * @param lon1 Longitude of first point (radians)
   * @param lat2 Latitude of second point (radians)
   * @param lon2 Longitude of second point (radians)
   * @returns Distance in meters
   */
  distanceTo(e, t, s, i) {
    const r = e, o = s, l = s - e, c = i - t, d = Math.sin(l / 2) * Math.sin(l / 2) + Math.cos(r) * Math.cos(o) * Math.sin(c / 2) * Math.sin(c / 2);
    return 6371e3 * (2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d)));
  }
  /**
   * Simple coordinate projection to Cartesian coordinates for bearing calculation.
   * @param lat Latitude in radians
   * @param lon Longitude in radians
   * @returns Projected x,y coordinates
   */
  project(e, t) {
    return {
      x: t * Math.cos(e),
      y: e
    };
  }
}
const ut = new tt();
class dt {
  static async fixElevation(e) {
    const t = Array.from(e.coordinatesIterator()), s = await ut.getElevationsAlong(t, {
      filterOptions: {
        enabled: !1
      },
      smoothingOptions: {
        enabled: !0,
        windowSize: 150
      }
    }), i = new G(e.name);
    for (let n = 0; n < s.length; n++) {
      const r = s[n];
      i.addPoint({
        ...Ne,
        lat: H(r.latitude),
        lon: H(r.longitude),
        ele: r.elevation
      });
    }
    return i.computeDerivedData(), i;
  }
}
class mt {
  constructor() {
  }
  /**
   * Compute maximum safe speeds for all points in the course.
   *
   * @param course Course containing path, cyclist, and bike parameters
   */
  static computeMaxSpeeds(e) {
    this.firstPass(e), this.secondPass(e), e.path.computeDerivedData();
  }
  /**
   * First pass: Calculate maximum cornering speeds based on lean angle physics.
   * Works forward through the path, computing speeds limited by turning radius.
   *
   * Formula: v_max = √(g × radius × tan(max_lean_angle))
   *
   * @param course Course to process
   */
  static firstPass(e) {
    const t = e.path, s = e.cyclist, i = t.getPointCount();
    for (let n = 0; n < i; n++)
      n === 0 ? t.setSpeedMax(n, s.getMaxSpeedMs()) : n === i - 1 ? t.setSpeedMax(n, 2) : this.computeMaxSpeedByIncline(e, n - 1, n, n + 1), t.setSpeedMaxIncline(n, t.getSpeedMax(n));
  }
  /**
   * Second pass: Apply braking constraints working backwards through the path.
   * Ensures that the cyclist can brake safely from any speed to the required
   * speed at the next point.
   *
   * @param course Course to process
   */
  static secondPass(e) {
    const s = e.path.getPointCount();
    for (let i = s - 1; i > 0; i--)
      this.computeMaxSpeedByBraking(e, i - 1, i);
  }
  /**
   * Compute maximum cornering speed for a point based on the turning radius
   * defined by three consecutive points (previous, current, next).
   *
   * Uses bicycle dynamics: v_max = √(g × radius × tan(max_lean_angle))
   *
   * @param course Course containing cyclist parameters
   * @param prevIndex Index of previous point
   * @param currentIndex Index of current point
   * @param nextIndex Index of next point
   */
  static computeMaxSpeedByIncline(e, t, s, i) {
    const n = e.path, r = e.cyclist, o = this.transform(n, t, s), l = new M(0, 0, 0), c = this.transform(n, i, s), d = this.getCircleCenter(o, l, c);
    if (d === null) {
      n.setSpeedMax(s, r.getMaxSpeedMs());
      return;
    }
    const u = d.subtract(l);
    let g = Math.hypot(u.x, u.y);
    g = g + 2, n.setRadius(s, g);
    const m = Math.sqrt(9.8 * g * r.getTanMaxAngle());
    n.setSpeedMax(s, Math.min(r.getMaxSpeedMs(), m));
  }
  /**
   * Apply braking constraint between two consecutive points.
   * Ensures that the cyclist can brake from the previous point's speed
   * to the current point's required speed within the available distance.
   *
   * Uses kinematic equation: v₀² = v_f² + 2 × a × distance
   *
   * @param course Course containing cyclist parameters
   * @param prevIndex Index of previous point
   * @param currentIndex Index of current point
   */
  static computeMaxSpeedByBraking(e, t, s) {
    const i = e.path, n = e.cyclist, r = i.getSpeedMax(t), o = i.getSpeedMax(s), l = -n.getMaxBrakeMS2();
    if (o >= r)
      return;
    const c = i.getDistance(s) - i.getDistance(t);
    if ((o * o - r * r) / (2 * l) <= c)
      return;
    const u = Math.sqrt(o * o - 2 * l * c);
    i.setSpeedMax(t, u);
  }
  /**
   * Find the center of a circle passing through three points.
   * Used to determine the turning radius for cornering speed calculations.
   *
   * Solves the system of linear equations to find the circumcenter.
   * Returns null if points are collinear (infinite radius).
   *
   * @param a First point (Vector3D)
   * @param b Second point (Vector3D)
   * @param c Third point (Vector3D)
   * @returns Circle center as Vector3D, or null if points are collinear
   */
  static getCircleCenter(e, t, s) {
    const i = e.x, n = e.y, r = t.x, o = t.y, l = s.x, c = s.y, d = r - i, u = o - n, g = l - i, m = c - n, f = d * (i + r) + u * (n + o), P = g * (i + l) + m * (n + c), A = 2 * (d * (c - o) - u * (l - r));
    if (Math.abs(A) < 1e-3)
      return null;
    const T = (m * f - u * P) / A, y = (d * P - g * f) / A;
    return new M(T, y, 0);
  }
  /**
   * Transform GPS coordinates to local Cartesian coordinates relative to a reference point.
   * Uses equirectangular projection for small distances (appropriate for cycling routes).
   *
   * Formula:
   * - x = (lon_diff / 360°) × circumference × cos(ref_lat)
   * - y = (lat_diff / 360°) × circumference
   *
   * @param path Path containing GPS coordinates
   * @param pointIndex Index of point to transform
   * @param refIndex Index of reference point (origin)
   * @returns Local Cartesian coordinates as Vector3D
   */
  static transform(e, t, s) {
    const i = e.getLongitude(t) - e.getLongitude(s), n = e.getLatitude(t) - e.getLatitude(s), r = i * de * Math.cos(e.getLatitude(s)) / (2 * Math.PI), o = n * de / (2 * Math.PI);
    return new M(r, o, 0);
  }
}
class gt {
  /**
   * Calculates the constant aerodynamic coefficient.
   *
   * @param course The course configuration containing cyclist and environmental parameters
   * @param path The path containing point data
   * @param pointIndex The index of the current point
   * @returns Aerodynamic coefficient in kg/m
   */
  getAeroCoef(e, t, s) {
    const i = e.rhoProvider.getRho(e, t, s);
    return e.cyclist.cd * e.cyclist.a * i / 2;
  }
}
const pt = new gt();
class Et {
  /**
   * Calculates the aerodynamic drag power at a specific location.
   *
   * For no wind conditions, uses the standard cubic relationship.
   * With wind, applies Isvan's advanced model that accounts for:
   * - Wind angle relative to direction of travel
   * - Combined velocity effects
   * - Turbulence factor (mu = 1.2)
   *
   * @param course The course configuration with aero and wind providers
   * @param path The path containing point data
   * @param pointIndex The index of the current point
   * @returns Aerodynamic drag power in watts (negative for resistance)
   */
  getPowerW(e, t, s) {
    const i = e.aeroProvider.getAeroCoef(e, t, s);
    t.setField(s, h.AERO_COEF, i);
    const n = e.windProvider.getWind(e, t, s);
    let r;
    if (n.windSpeed === 0) {
      const o = t.getSpeed(s);
      r = -i * o * o * o;
    } else
      r = this.computePAirWithWind(t, s, i, n);
    return t.setField(s, h.P_AERO, r), r;
  }
  /**
   * Computes aerodynamic power with wind effects using Isvan's model.
   *
   * This advanced model accounts for:
   * - Wind speed and direction
   * - Cyclist bearing (direction of travel)
   * - Combined velocity vector effects
   * - Turbulence coefficient (mu = 1.2)
   *
   * The model is more accurate than simple vector addition because it
   * accounts for the complex aerodynamic interactions when wind and
   * cyclist motion combine at various angles.
   *
   * Reference: Isvan, O. (2011). "Power Optimization for the Propulsion
   * of Lightweight Vehicles." Section on aerodynamic power with wind.
   *
   * @param path The path containing point data
   * @param pointIndex The index of the current point
   * @param aeroCoef The aerodynamic coefficient
   * @param wind The wind conditions
   * @returns Aerodynamic power in watts (negative for resistance)
   */
  computePAirWithWind(e, t, s, i) {
    const n = e.getSpeed(t), r = e.getBearing(t);
    e.setField(t, h.WIND_SPEED, i.windSpeed), e.setField(t, h.WIND_DIRECTION, i.windDirection);
    const o = Math.PI / 2 - i.windDirection;
    e.setField(t, h.WIND_BEARING, o);
    const l = o - r;
    e.setField(t, h.WIND_ALPHA, l);
    const c = i.windSpeed, d = n + c * Math.cos(l), u = d * d, g = n * n + c * c + 2 * n * c * Math.cos(l), m = u / g, P = m + 1.2 * (1 - m);
    return -s * P * Math.sqrt(g) * d * n;
  }
}
const wt = new Et();
class ft {
  getRho(e, t, s) {
    return Ge;
  }
}
const qt = new ft();
class Ct {
  getRho(e, t, s) {
    const i = t.getTemperature(s), n = isNaN(i) ? 15 : i, r = t.getElevation(s), o = isNaN(r) ? 0 : r, l = 101325, c = 288.15, d = 9.80665, u = 65e-4, g = 287.05, m = n + 273.15;
    return l * Math.pow(1 - u * o / c, d / (g * u)) / (g * m);
  }
}
const Pt = new Ct();
class At {
  /**
   * Creates a constant wind provider with the specified wind conditions.
   *
   * @param wind The wind conditions to use throughout the route
   */
  constructor(e) {
    this.wind = { ...e };
  }
  /**
   * Returns the constant wind conditions.
   *
   * @param _course The course configuration (unused)
   * @param _path The path containing point data (unused)
   * @param _pointIndex The index of the current point (unused)
   * @returns The constant wind conditions
   */
  getWind(e, t, s) {
    return this.wind;
  }
}
class Nt extends At {
  /**
   * Creates a wind provider with zero wind speed.
   */
  constructor() {
    super({ windSpeed: 0, windDirection: 0 });
  }
}
const Rt = new Nt(), x = class x {
  /**
   * Constructs the base provider with randomly generated harmonics.
   *
   * Generates 20 harmonic components with:
   * - Frequency: 1.0 to 10.0 rad/s
   * - Phase: 0 to π radians
   * - Amplitude: 0 to 0.01 (1% max variation)
   *
   * Uses crypto.getRandomValues() for secure random generation
   * (compatible with both browser and Node.js environments).
   */
  constructor(e) {
    if (this.useHarmonics = e, this.harmonics = [], e) {
      const t = new Uint32Array(60);
      for (let s = 0; s < t.length; s++)
        t[s] = Math.floor(Math.random() * 4294967295);
      for (let s = 0; s < 20; s++) {
        const i = 1 + t[s * 3] / 4294967295 * 9, n = t[s * 3 + 1] / 4294967295 * Math.PI, r = t[s * 3 + 2] / 4294967295 * 0.01;
        this.harmonics.push({ freq: i, d: n, amp: r });
      }
    }
  }
  /**
   * Calculates the cyclist's power output with harmonics and speed adjustments.
   *
   * Process:
   * 1. Get optimal power from subclass
   * 2. Apply harmonic variations (if enabled)
   * 3. Calculate optimal speed for this power
   * 4. Adjust power based on current vs optimal speed
   *
   * @param course Course configuration
   * @param path Path containing point data
   * @param pointIndex Index of current point
   * @returns Adjusted cyclist power in watts
   */
  getPowerW(e, t, s) {
    let i = this.getOptimalPower(e, t, s);
    if (this.useHarmonics) {
      const r = t.getTime(s) / 1e4;
      for (const o of this.harmonics)
        i += o.amp * i * Math.cos(o.freq * r - o.d);
    }
    return t.setField(s, h.P_CYCLIST_OPTIMAL_POWER, i), i;
  }
  getRealOptimalPower(e, t, s, i) {
    const n = -Y.INSTANCE.getNewPower(e, t, s, !1);
    t.setField(s, h.P_CYCLIST_POWER_NEEDED, n);
    const r = i * (1 - x.TOLERANCE), o = i * (1 + x.TOLERANCE);
    if (r <= n && n <= o)
      return i;
    if (n < r)
      return i * x.MAX_MULTIPLIER - n / r * i * (x.MAX_MULTIPLIER - 1);
    {
      const l = n - o, c = Math.min(1, Math.max(0, l / o));
      return i - c * i;
    }
  }
};
x.TOLERANCE = 0.05, x.MAX_MULTIPLIER = 3;
let K = x;
class Mt {
  /**
   * Calculates the wheel power from muscular power with drivetrain efficiency.
   *
   * Gets the cyclist's muscular power output and applies drivetrain
   * efficiency to calculate the actual power delivered to the wheel.
   *
   * @param course Course configuration with cyclist power provider and bike efficiency
   * @param path Path containing point data
   * @param pointIndex Index of current point
   * @returns Wheel power in watts (positive value, propulsive)
   */
  getPowerW(e, t, s) {
    let i = e.cyclistPowerProvider.getPowerW(e, t, s);
    return t.setField(s, h.P_CYCLIST_RAW, i), i = i * e.bike.efficiency, t.setField(s, h.P_CYCLIST_WHEEL, i), i;
  }
}
const Tt = new Mt();
class yt extends K {
  constructor(e, t) {
    super(t), this.power = e;
  }
  /**
   * Returns the constant power from cyclist configuration.
   *
   * @param course Course configuration with cyclist power setting
   * @param _path Path containing point data (unused)
   * @param _pointIndex Index of current point (unused)
   * @returns Cyclist's configured power output in watts
   */
  getOptimalPower(e, t, s) {
    return this.power;
  }
}
class Ht extends K {
  /**
   * Creates a power provider with time-based fatigue.
   *
   * @param duration Duration in seconds after which power stabilizes at 50%
   *                 Typical values: 3600 (1hr), 7200 (2hr), 10800 (3hr)
   */
  constructor(e, t, s) {
    super(t), this.power = e, this.duration = s;
  }
  /**
   * Returns power adjusted for elapsed time fatigue.
   *
   * Applies fatigue factor to the base constant power:
   * - Power decreases linearly with time
   * - Minimum power is 50% of base power
   * - Fatigue stabilizes after specified duration
   *
   * @param course Course configuration
   * @param path Path containing point data
   * @param pointIndex Index of current point
   * @returns Fatigue-adjusted power in watts
   */
  getOptimalPower(e, t, s) {
    const i = this.power, n = t.getElapsed(s) / 1e3, r = Math.max(0.5, 1 - 0.6 * n / this.duration);
    return i * r;
  }
}
class vt {
  /**
   * Returns the power value stored in the point data.
   *
   * This is the raw power measurement without any modifications.
   *
   * @param _course Course configuration (unused)
   * @param path Path containing point data
   * @param pointIndex Index of current point
   * @returns Power from point data in watts
   */
  getPowerW(e, t, s) {
    return t.getPower(s);
  }
}
const Kt = new vt();
class St {
  /**
   * Calculates the gravitational power at a specific location.
   *
   * Gravitational power is the most significant resistance factor on climbs
   * and can provide significant assistance on descents. For a typical 80kg
   * cyclist+bike system:
   * - 5% grade at 5 m/s (18 km/h): ~196W resistance
   * - 10% grade at 5 m/s: ~392W resistance
   *
   * @param course The course configuration containing cyclist mass
   * @param path The path containing point data
   * @param pointIndex The index of the current point
   * @returns Gravitational power in watts (negative=climbing, positive=descending)
   */
  getPowerW(e, t, s) {
    const i = e.cyclist.mKg, n = t.getGrade(s), r = t.getSpeed(s), o = Math.sin(Math.atan(n)), l = -i * 9.8 * r * o;
    return t.setField(s, h.P_GRAVITY, l), l;
  }
}
const xt = new St();
class Lt {
  /**
   * Calculates the rolling resistance power at a specific location.
   *
   * Rolling resistance is always negative (resistive force) and increases
   * linearly with speed. The cosine term slightly reduces resistance on
   * steep grades due to reduced normal force.
   *
   * @param course The course configuration containing cyclist and bike parameters
   * @param location The current point with speed and grade information
   * @returns Rolling resistance power in watts (always negative or zero)
   */
  getPowerW(e, t, s) {
    const i = e.cyclist.mKg, n = e.bike.crr, r = t.getGrade(s), o = t.getSpeed(s), c = -Math.cos(Math.atan(r)) * i * 9.8 * o * n;
    return t.setField(s, h.P_ROLLING_RESISTANCE, c), c;
  }
}
const _t = new Lt();
class Dt {
  /**
   * Calculates the wheel bearings friction power at a specific location.
   *
   * Bearings friction is always negative (resistive force) and increases
   * with the square of speed due to the linear speed term multiplied by
   * the speed-dependent friction coefficient.
   *
   * At typical cycling speeds (5-15 m/s), this represents 5-20 watts of
   * power loss, which is small compared to aerodynamic drag but still
   * measurable.
   *
   * @param course The course configuration (not used for bearings calculation)
   * @param path The path containing point data
   * @param pointIndex The index of the current point
   * @returns Wheel bearings friction power in watts (always negative or zero)
   */
  getPowerW(e, t, s) {
    const i = t.getSpeed(s), n = -i * (91 + 8.7 * i) / 1e3;
    return t.setField(s, h.P_WHEEL_BEARINGS, n), n;
  }
}
const It = new Dt(), Q = class Q {
  constructor() {
  }
  /**
   * Calculates the net power at a specific point.
   *
   * Sums power from all providers to get the total power balance.
   * Can optionally exclude cyclist power to calculate only resistances.
   *
   * @param course Course configuration
   * @param path Path containing point data
   * @param pointIndex Index of current point
   * @param withCyclist If true, include cyclist power; if false, only resistances
   * @returns Net power in watts (sum of all powers)
   */
  getNewPower(e, t, s, i) {
    let n = 0;
    return n += It.getPowerW(e, t, s), n += _t.getPowerW(e, t, s), n += wt.getPowerW(e, t, s), n += xt.getPowerW(e, t, s), i && (n += Tt.getPowerW(e, t, s)), n;
  }
  /**
   * Calculates distance traveled given power, mass, speed, and time step.
   *
   * Uses energy conservation to determine new speed, then calculates
   * distance using the trapezoidal rule (average of old and new speeds).
   *
   * Physics:
   * 1. Power × time = change in kinetic energy
   * 2. Solve for new speed: v₂ = √(2ΔtP/M_eq + v₁²)
   * 3. Distance: Δx = (v₁ + v₂) × Δt / 2
   *
   * Enforces minimum speed constraint to avoid numerical instability.
   *
   * @param pSum Net power in watts
   * @param equivalentMass Equivalent mass including rotational inertia (kg)
   * @param currentSpeed Current speed in m/s
   * @param dt Time step in seconds
   * @returns Distance traveled in meters
   */
  getDx(e, t, s, i) {
    return (Math.max(
      Math.sqrt(i * e / (0.5 * t) + s * s),
      fe
    ) + s) * i / 2;
  }
  /**
   * Calculates the time step needed to travel a specific distance.
   *
   * Uses binary search to find the time step that produces the target
   * distance given current power balance and speed.
   *
   * This is used for GPS waypoint alignment, where we know the distance
   * between points and need to find the corresponding time step.
   *
   * Search range: -0.1 to DT+0.1 seconds
   * Convergence: dx / 10,000,000 (very tight tolerance)
   *
   * @param pSum Net power in watts
   * @param equivalentMass Equivalent mass including rotational inertia (kg)
   * @param currentSpeed Current speed in m/s
   * @param dx Target distance in meters
   * @returns Time step in seconds
   */
  getDt(e, t, s, i) {
    let n = -0.1, r = te + 0.1;
    for (; r - n >= i / 1e7; ) {
      const o = (n + r) / 2;
      this.getDx(e, t, s, o) < i ? n = o : r = o;
    }
    return (n + r) / 2;
  }
  /**
   * Computes cyclist power from measured speed change between two points.
   *
   * This is the inverse problem: given speed change, calculate the power
   * that must have been applied. Used for analyzing recorded rides with
   * speed data but no power meter.
   *
   * Process:
   * 1. Calculate resistance powers at point 1
   * 2. Calculate total power from speed change
   * 3. Cyclist power = total power - resistance powers
   * 4. Adjust for drivetrain efficiency
   *
   * @param course Course configuration
   * @param path Path containing point data
   * @param equivalentMass Equivalent mass including rotational inertia (kg)
   * @param pointIndex1 Index of first point
   * @param pointIndex2 Index of second point
   * @returns Estimated cyclist muscular power in watts
   */
  computeCyclistPower(e, t, s, i, n) {
    const r = this.getNewPower(e, t, i, !1), o = t.getSpeed(i), l = t.getSpeed(n), c = this.getDtBetweenPoints(t, i, n), d = this.getTotPower(s, o, l, c);
    t.setField(i, h.P_POWER_FROM_ACC, d);
    let u = d - r;
    return t.setField(i, h.P_POWER_WHEEL_FROM_ACC, u), u = Math.max(0, u), u = u / e.bike.efficiency, u;
  }
  /**
   * Calculates total power from speed change using kinetic energy formula.
   *
   * P = ΔKE / Δt = 0.5 × M_eq × (v₂² - v₁²) / Δt
   *
   * @param equivalentMass Equivalent mass including rotational inertia (kg)
   * @param s1 Initial speed in m/s
   * @param s2 Final speed in m/s
   * @param dt Time step in seconds
   * @returns Power in watts
   */
  getTotPower(e, t, s, i) {
    return 0.5 * e * (s * s - t * t) / i;
  }
  /**
   * Calculates time difference between two points in seconds.
   *
   * @param path Path containing point data
   * @param pointIndex1 Index of first point
   * @param pointIndex2 Index of second point
   * @returns Time difference in seconds
   */
  getDtBetweenPoints(e, t, s) {
    const i = e.getTime(t);
    return (e.getTime(s) - i) / 1e3;
  }
  /**
   * Calculates the equivalent mass accounting for rotational inertia.
   *
   * Wheels have rotational inertia that effectively increases the mass
   * that must be accelerated. The equivalent mass formula is:
   *
   * M_eq = m + I_total / r²
   *
   * Where:
   * - m: total system mass (cyclist + bike)
   * - I_total: sum of wheel rotational inertias
   * - r: wheel radius
   *
   * This accounts for the fact that accelerating the wheels requires
   * energy for both linear and rotational motion.
   *
   * Typical values:
   * - System mass: 80 kg
   * - Wheel inertia: 0.12 kg⋅m² total
   * - Wheel radius: 0.7 m
   * - Equivalent mass: ~80.25 kg (~0.3% increase)
   *
   * @param course Course configuration with cyclist and bike parameters
   * @returns Equivalent mass in kg
   */
  getEquivalentMass(e) {
    const t = e.cyclist.mKg, s = e.bike.inertiaFront, i = e.bike.inertiaRear, n = e.bike.wheelRadius, r = s + i;
    return t + r / (n * n);
  }
};
Q.INSTANCE = new Q();
let Y = Q;
const bt = Re("physics/VirtualService"), oe = class oe {
  /**
   * Virtualizes a GPS track using physics-based simulation.
   *
   * Transforms a static GPS route into a realistic cycling simulation with:
   * - Accurate time predictions based on power and terrain
   * - Speed profiles that respect physics and max speed limits
   * - Power estimates from speed changes
   *
   * The original path points are replaced with simulated points that have
   * physically consistent speeds, times, and power values.
   *
   * @param course Course configuration with path, cyclist, and bike parameters
   */
  static virtualizeTrack(e) {
    const t = this.powerComputer.getEquivalentMass(e), s = new G(e.path.name), i = e.path, n = i.getAllDistances(), r = n.length, o = i.getTotalDistance();
    let l = i.getPointData(0), c = 0, d = fe, u = (/* @__PURE__ */ new Date()).getTime();
    const g = u;
    for (s.addPoint({
      ...l,
      dist: c,
      time: u,
      elapsed: 0,
      speed: d
    }); c < o; ) {
      const m = this.getIndex(n, r, c), f = this.powerComputer.getNewPower(e, s, s.length - 1, !0), P = this.powerComputer.getDx(f, t, d, te), A = this.getNextIndex(n, r, c, P);
      let T, y;
      if (m !== A)
        T = i.getDistance(A) - c, y = this.powerComputer.getDt(f, t, d, T), l = i.getPointData(A), c = i.getDistance(A);
      else {
        T = P, y = te;
        const ce = c + P, he = i.getDistance(m), Te = i.getDistance(m + 1), ye = (ce - he) / (Te - he);
        l = i.interpolatePoint(m, m + 1, ye), c = ce;
      }
      let b = 2 * (T / y) - d;
      const le = l.speedMax;
      if (b > le && (b = le, y = 2 * T / (d + b)), d = b, u += y * 1e3, s.addPoint({
        ...l,
        dist: c,
        time: u,
        elapsed: u - g,
        speed: d
      }), s.length > 1e5) {
        bt.warn("VirtualizeService: Simulation exceeded 10x original points, stopping");
        break;
      }
    }
    for (let m = 0; m < s.length - 1; m++) {
      const f = this.powerComputer.computeCyclistPower(
        e,
        s,
        t,
        m,
        m + 1
      );
      s.setPower(m, f);
    }
    return s.computeDerivedData(), s;
  }
  /**
   * Binary search to find the next waypoint index after traveling distance dx.
   *
   * @param dists Array of cumulative distances
   * @param distsLength Length of dists array
   * @param dist Current distance
   * @param dx Distance to travel
   * @returns Index of next waypoint, or current index if not crossing
   */
  static getNextIndex(e, t, s, i) {
    const n = this.getIndex(e, t, s), r = this.getIndex(e, t, s + i);
    return n !== r ? n + 1 : n;
  }
  /**
   * Binary search to find the waypoint index at or before the given distance.
   *
   * @param dists Array of cumulative distances
   * @param distsLength Length of dists array
   * @param dist Target distance
   * @returns Index of waypoint at or before dist, or -1 if not found
   */
  static getIndex(e, t, s) {
    let i = 0, n = t - 1;
    for (; i <= n; ) {
      const r = i + Math.floor((n - i) / 2);
      if (e[r] <= s && (r === t - 1 || s < e[r + 1]))
        return r;
      e[r] < s ? i = r + 1 : n = r - 1;
    }
    return -1;
  }
};
oe.powerComputer = Y.INSTANCE;
let ie = oe;
class J {
  /**
   * Convert WGS84 coordinates to ECEF coordinates with optional elevation exaggeration
   * @param coordinates - Geographic coordinates with elevation
   * @param zExaggeration - Elevation exaggeration factor (default: 3)
   * @returns ECEF coordinates as Vector3D
   */
  static toEcef(e, t = 3) {
    const s = e.lat, i = e.lon, n = isNaN(e.ele) ? 0 : e.ele, r = t * n, o = Math.sin(s), l = Ce / Math.sqrt(1 - ue * o * o), c = Math.cos(s), d = Math.cos(i), u = Math.sin(i), g = (l + r) * c * d, m = (l + r) * c * u, f = (l * (1 - ue) + r) * o;
    return new M(g, m, f);
  }
}
class Ot {
  /**
   * Simplify a path using the Douglas-Peucker algorithm in 3D space
   * @param points - Array of coordinates with elevation
   * @param tolerance - Maximum allowed distance from simplified line in meters
   * @param zExaggeration - Elevation exaggeration factor for ECEF conversion (default: 3)
   * @returns Simplified array of coordinates
   */
  static simplify(e, t, s = 3) {
    if (e.getPointCount() <= 2)
      return e;
    const i = e.getPointCount() - 1, n = new G(e.name);
    n.addPoint(e.getPointData(0));
    const r = this.simplifyRecursive(
      e,
      0,
      i,
      t,
      s
    );
    for (const o of r)
      n.addPoint(o);
    return n.addPoint(e.getPointData(i)), n.computeDerivedData(), n;
  }
  /**
   * Recursive step of the Douglas-Peucker algorithm
   * @param points - Array of all points
   * @param firstIndex - Index of first point in current segment
   * @param lastIndex - Index of last point in current segment
   * @param tolerance - Maximum allowed distance in meters
   * @param zExaggeration - Elevation exaggeration factor
   * @returns Array of points to include in simplified path
   */
  static simplifyRecursive(e, t, s, i, n) {
    let r = 0, o = -1;
    const l = [], c = J.toEcef(e.getPointData(t), n), d = J.toEcef(e.getPointData(s), n);
    for (let u = t + 1; u < s; u++) {
      const m = J.toEcef(e.getPointData(u), n).distanceToSegment(c, d);
      m > r && (r = m, o = u);
    }
    if (r > i && o !== -1) {
      if (o - t > 1) {
        const u = this.simplifyRecursive(
          e,
          t,
          o,
          i,
          n
        );
        l.push(...u);
      }
      if (l.push(e.getPointData(o)), s - o > 1) {
        const u = this.simplifyRecursive(
          e,
          o,
          s,
          i,
          n
        );
        l.push(...u);
      }
    }
    return l;
  }
}
class Wt {
  constructor() {
  }
  /**
   * Resamples a single path to ensure one point per second.
   *
   * Creates a new path with interpolated points at exact epoch second boundaries.
   *
   * @param path The path to resample
   * @returns A new path with one point per second
   */
  static computeOnePointPerSecond(e) {
    const t = e.getPointCount();
    if (t === 0)
      return new G(e.name);
    const s = /* @__PURE__ */ new Map();
    for (let i = 0; i < t; i++) {
      const n = e.getTime(i), r = Math.floor(n / 1e3), o = n % 1e3;
      if (i === 0 && o !== 0 && this.addPointToMap(s, r, { type: "copy", index: i }), i === t - 1)
        o !== 0 && this.addPointToMap(s, r + 1, { type: "copy", index: i });
      else {
        const l = e.getTime(i + 1), c = Math.floor(l / 1e3);
        if (r !== c) {
          const d = l - n, u = o === 0 ? r : r + 1, g = c;
          for (let m = u; m <= g; m++) {
            const A = (m * 1e3 - n) / d;
            this.addPointToMap(s, m, {
              type: "interpolate",
              index1: i,
              index2: i + 1,
              coef: A
            });
          }
        }
      }
    }
    return this.createResampledPath(e, s);
  }
  /**
   * Resamples all tracks in a Paths object (modified in-place).
   *
   * @param paths The paths object containing tracks to resample
   */
  static computeOnePointPerSecondForPaths(e) {
    e.tracks = e.tracks.map((t) => this.computeOnePointPerSecond(t));
  }
  /**
   * Adds a point specification to the map.
   */
  static addPointToMap(e, t, s) {
    e.set(t, s);
  }
  /**
   * Creates a new path with resampled points.
   */
  static createResampledPath(e, t) {
    const s = new G(e.name), i = Array.from(t.keys()).sort((n, r) => n - r);
    for (const n of i) {
      const r = t.get(n), o = n * 1e3;
      if (r.type === "copy") {
        const c = { ...e.getPointData(r.index), time: o };
        s.addPoint(c);
      } else {
        const c = { ...e.interpolatePoint(
          r.index1,
          r.index2,
          r.coef
        ), time: o };
        s.addPoint(c);
      }
    }
    return s.computeDerivedData(), s;
  }
}
const Ft = () => ({
  crr: ve,
  inertiaFront: Se,
  inertiaRear: xe,
  wheelRadius: Le,
  efficiency: _e
});
class re {
  /**
   * Create a new Bike instance.
   *
   * @param crr Rolling resistance coefficient (dimensionless)
   * @param inertiaFront Front wheel rotational inertia (kg⋅m²)
   * @param inertiaRear Rear wheel rotational inertia (kg⋅m²)
   * @param wheelRadius Wheel radius (meters)
   * @param efficiency Drivetrain efficiency (0-1, dimensionless)
   */
  constructor(e, t, s, i, n) {
    this.crr = e, this.inertiaFront = t, this.inertiaRear = s, this.wheelRadius = i, this.efficiency = n;
  }
  static getBike(e) {
    return new re(
      e.crr,
      e.inertiaFront,
      e.inertiaRear,
      e.wheelRadius,
      e.efficiency
    );
  }
  /**
   * Create a bike with default parameters validated from cycling research.
   *
   * Default configuration represents:
   * - Modern road bike with high-performance tires (Crr = 0.004)
   * - Lightweight racing wheels with typical rotational inertia
   * - Standard 700c wheel size (radius = 0.7m)
   * - High-efficiency modern drivetrain (97.6% efficiency)
   *
   * @returns Bike instance with scientifically validated defaults
   */
  static getDefault() {
    return this.getBike(Ft());
  }
  /**
   * Get total rotational inertia of both wheels.
   * Used in physics calculations for acceleration resistance
   * due to wheel rotation.
   *
   * Formula: I_total = I_front + I_rear
   *
   * @returns Total rotational inertia (kg⋅m²)
   */
  getTotalInertia() {
    return this.inertiaFront + this.inertiaRear;
  }
  /**
   * Get wheel diameter.
   * Useful for gear ratio calculations and general specifications.
   *
   * Formula: diameter = 2 × radius
   *
   * @returns Wheel diameter (meters)
   */
  getWheelDiameter() {
    return 2 * this.wheelRadius;
  }
  /**
   * Get wheel circumference.
   * Used in speed and distance calculations from wheel rotations.
   *
   * Formula: circumference = 2π × radius
   *
   * @returns Wheel circumference (meters)
   */
  getWheelCircumference() {
    return 2 * Math.PI * this.wheelRadius;
  }
  /**
   * Calculate equivalent mass from rotational inertia.
   * Represents the additional linear mass equivalent of rotating wheels
   * for simplified physics calculations.
   *
   * Formula: m_equiv = I_total / r²
   * Where I_total is total rotational inertia and r is wheel radius
   *
   * @returns Equivalent mass from wheel rotation (kg)
   */
  getEquivalentMass() {
    return this.getTotalInertia() / (this.wheelRadius * this.wheelRadius);
  }
  /**
   * Calculate power loss due to drivetrain inefficiency.
   * Determines how much input power is lost in the drivetrain.
   *
   * Formula: loss_factor = 1 - efficiency
   *
   * @returns Power loss factor (0-1, dimensionless)
   */
  getPowerLossFactor() {
    return 1 - this.efficiency;
  }
  /**
   * Calculate effective power delivered to the wheel.
   * Accounts for drivetrain losses in power transmission.
   *
   * Formula: P_wheel = P_input × efficiency
   *
   * @param inputPower Input power from cyclist (watts)
   * @returns Effective power at wheel (watts)
   */
  getWheelPower(e) {
    return e * this.efficiency;
  }
  /**
   * Calculate rolling resistance force at given speed.
   * Force opposing motion due to tire deformation and road interaction.
   *
   * Formula: F_rolling = crr × N
   * Where N is the normal force (weight × cos(grade))
   * For level ground: F_rolling = crr × mass × g
   *
   * @param normalForce Normal force on tires (Newtons)
   * @returns Rolling resistance force (Newtons)
   */
  getRollingResistanceForce(e) {
    return this.crr * e;
  }
  /**
   * Get a string representation of the bike configuration.
   *
   * @returns Human-readable string describing the bike
   */
  toString() {
    return `Bike {
            wheelSize: ${(this.getWheelDiameter() * 1e3).toFixed(0)}mm (${this.getWheelCircumference().toFixed(2)}m circumference),
            crr: ${this.crr.toFixed(4)},
            totalInertia: ${this.getTotalInertia().toFixed(3)}kg⋅m² (${this.getEquivalentMass().toFixed(1)}kg equiv),
            efficiency: ${(this.efficiency * 100).toFixed(1)}% (${(this.getPowerLossFactor() * 100).toFixed(1)}% loss)
        }`;
  }
}
const Gt = () => ({
  mKg: De,
  maxBrakeG: be,
  cd: We,
  a: Fe,
  maxAngleDeg: Pe,
  maxSpeedKmH: Oe
});
class ae {
  /**
   * Create a new Cyclist instance.
   *
   * @param mKg Total mass of cyclist + bike system (kg)
   * @param maxBrakeG Maximum braking deceleration (g-force units)
   * @param cd Aerodynamic drag coefficient (dimensionless)
   * @param a Frontal area for aerodynamic calculations (m²)
   * @param maxAngleDeg Maximum lean angle for cornering (degrees)
   * @param maxSpeedKmH Maximum speed capability (km/h)
   */
  constructor(e, t, s, i, n, r) {
    this.mKg = e, this.maxBrakeG = t, this.cd = s, this.a = i, this.maxAngleDeg = n, this.maxSpeedKmH = r;
  }
  static getCyclist(e) {
    return new ae(
      e.mKg,
      e.maxBrakeG,
      e.cd,
      e.a,
      e.maxAngleDeg,
      e.maxSpeedKmH
    );
  }
  /**
   * Create a cyclist with default parameters validated from cycling research.
   *
   * Default configuration represents:
   * - 80kg total system mass (recreational cyclist + road bike)
   * - 280W sustainable power output (~3.5 W/kg FTP)
   * - Conservative braking and handling limits for safety
   * - Typical aerodynamic parameters for recreational cycling position
   *
   * @returns Cyclist instance with scientifically validated defaults
   */
  static getDefault() {
    return this.getCyclist(Gt());
  }
  /**
   * Get the tangent of the maximum lean angle.
   * Used in cornering physics calculations for determining maximum
   * lateral acceleration without losing traction.
   *
   * Formula: tan(θ) where θ is the maximum lean angle
   *
   * @returns Tangent of maximum lean angle (dimensionless)
   */
  getTanMaxAngle() {
    return Math.tan(this.maxAngleDeg * Math.PI / 180);
  }
  /**
   * Get the maximum lean angle in radians.
   * Provides direct radian access for physics calculations.
   *
   * @returns Maximum lean angle in radians
   */
  getMaxAngleRad() {
    return this.maxAngleDeg * Math.PI / 180;
  }
  /**
   * Get maximum braking deceleration in SI units.
   * Converts from g-force units to meters per second squared
   * for use in physics calculations.
   *
   * Formula: a_max = maxBrakeG × g
   * Where g = 9.8 m/s² (standard gravitational acceleration)
   *
   * @returns Maximum braking deceleration (m/s²)
   */
  getMaxBrakeMS2() {
    return this.maxBrakeG * 9.8;
  }
  /**
   * Get maximum speed in SI units.
   * Converts from km/h to meters per second for physics calculations.
   *
   * Formula: v_ms = v_kmh / 3.6
   *
   * @returns Maximum speed (m/s)
   */
  getMaxSpeedMs() {
    return this.maxSpeedKmH / 3.6;
  }
  /**
   * Calculate aerodynamic drag area (CdA).
   * Combined aerodynamic parameter used in drag force calculations.
   *
   * Formula: CdA = cd × a
   *
   * @returns Aerodynamic drag area (m²)
   */
  getAerodynamicDragArea() {
    return this.cd * this.a;
  }
  /**
   * Get a string representation of the cyclist configuration.
   *
   * @returns Human-readable string describing the cyclist
   */
  toString() {
    return `Cyclist {
            mass: ${this.mKg}kg,
            CdA: ${this.getAerodynamicDragArea().toFixed(3)}m²,
            maxBrake: ${this.maxBrakeG}g (${this.getMaxBrakeMS2().toFixed(1)} m/s²),
            maxLean: ${this.maxAngleDeg}°,
            maxSpeed: ${this.maxSpeedKmH}km/h (${this.getMaxSpeedMs().toFixed(1)} m/s)
        }`;
  }
}
const ee = Re("enhancer/Enhancer");
class Yt {
  static getDefaultCourse(e) {
    return {
      path: e,
      bike: re.getDefault(),
      cyclist: ae.getDefault(),
      rhoProvider: Pt,
      aeroProvider: pt,
      windProvider: Rt,
      cyclistPowerProvider: new yt(Ie, !1)
    };
  }
  static async enhanceCourseDefault(e) {
    return this.enhanceCourse(this.getDefaultCourse(e));
  }
  static async enhanceCourse(e, t) {
    ee.timeLevel(N.INFO, "enhance"), ee.info(e);
    const s = {
      fixElevation: t?.fixElevation ?? !0,
      computeMaxSpeeds: t?.computeMaxSpeeds ?? !0,
      virtualizeTrack: t?.virtualizeTrack ?? !0,
      computeOnePointPerSecond: t?.computeOnePointPerSecond ?? !0,
      simplifyPath: {
        enable: t?.simplifyPath?.enable ?? !0,
        tolerance: t?.simplifyPath?.tolerance ?? 10,
        zExaggeration: t?.simplifyPath?.zExaggeration ?? 3
      }
    };
    let i = e.path;
    s.fixElevation && (i = await dt.fixElevation(i));
    const n = { ...e, path: i };
    return (s.computeMaxSpeeds || s.virtualizeTrack) && mt.computeMaxSpeeds(n), s.virtualizeTrack && (i = ie.virtualizeTrack(n)), s.computeOnePointPerSecond && (i = Wt.computeOnePointPerSecond(i)), s.simplifyPath.enable && (i = Ot.simplify(
      i,
      s.simplifyPath.tolerance,
      s.simplifyPath.zExaggeration
    )), ee.timeEndLevel(N.INFO, "enhance"), i;
  }
}
const w = {
  GPX: "http://www.topografix.com/GPX/1/1",
  GARMIN_TPX: "http://www.garmin.com/xmlschemas/TrackPointExtension/v1",
  GARMIN_GPX: "http://www.garmin.com/xmlschemas/GpxExtensions/v3",
  CLUETRUST: "http://www.cluetrust.com/XML/GPXDATA/1/0",
  W3C_XSI: "http://www.w3.org/2001/XMLSchema-instance"
}, W = {
  [w.GPX]: "",
  [w.GARMIN_TPX]: "gpxtpx",
  [w.GARMIN_GPX]: "gpxx",
  [w.CLUETRUST]: "gpxdata",
  [w.W3C_XSI]: "xsi"
}, Ut = {
  heartRate: [
    { namespace: w.GARMIN_TPX, localName: "hr", dataType: "number" },
    { namespace: "", localName: "heartrate", dataType: "number" },
    { namespace: "", localName: "hr", dataType: "number" }
  ],
  cadence: [
    { namespace: w.GARMIN_TPX, localName: "cad", dataType: "number" },
    { namespace: w.CLUETRUST, localName: "cadence", dataType: "number" },
    { namespace: "", localName: "cadence", dataType: "number" }
  ],
  temperature: [
    { namespace: w.GARMIN_TPX, localName: "atemp", dataType: "number" },
    { namespace: w.CLUETRUST, localName: "temp", dataType: "number" },
    { namespace: "", localName: "temperature", dataType: "number" }
  ],
  power: [{ namespace: "", localName: "power", dataType: "number" }],
  speed: [{ namespace: w.CLUETRUST, localName: "speed", dataType: "number" }],
  distance: [
    { namespace: w.CLUETRUST, localName: "distance", dataType: "number" }
  ],
  seaLevelPressure: [
    {
      namespace: w.CLUETRUST,
      localName: "seaLevelPressure",
      dataType: "number"
    }
  ],
  verticalSpeed: [
    { namespace: w.CLUETRUST, localName: "verticalSpeed", dataType: "number" }
  ]
};
class Bt {
  constructor(e) {
    this.namespaceResolver = e;
  }
  /**
   * Parse all extensions from an extensions element
   */
  parseExtensions(e, t) {
    this.parseHeartRate(e, t), this.parseCadence(e, t), this.parseTemperature(e, t), this.parsePower(e, t), this.parseGarminTrackPointExtension(e, t);
  }
  /**
   * Parse heart rate from various formats:
   * - ns3:hr / gpxtpx:hr (Garmin)
   * - heartrate (Amazfit)
   * - hr (generic)
   */
  parseHeartRate(e, t) {
    const s = this.findExtensionValue("heartRate", e);
    s !== null && (t.heartRate = Math.round(s));
  }
  /**
   * Parse cadence from various formats:
   * - ns3:cad / gpxtpx:cad (Garmin)
   * - gpxdata:cadence (Cluetrust/Movescount)
   * - cadence (generic)
   */
  parseCadence(e, t) {
    const s = this.findExtensionValue("cadence", e);
    s !== null && (t.cadence = Math.round(s));
  }
  /**
   * Parse temperature from various formats:
   * - gpxtpx:atemp (Garmin ambient temperature)
   * - gpxdata:temp (Cluetrust)
   * - temperature (generic)
   */
  parseTemperature(e, t) {
    const s = this.findExtensionValue("temperature", e);
    s !== null && (t.temperature = s);
  }
  /**
   * Parse power from custom power extensions
   * - power (custom format used in sample.gpx)
   */
  parsePower(e, t) {
    const s = this.findExtensionValue("power", e);
    s !== null && (t.power = Math.round(s));
  }
  /**
   * Generic method to find extension values using the field mapping
   */
  findExtensionValue(e, t) {
    const s = Ut[e];
    for (const i of s) {
      let n;
      if (i.namespace ? n = this.namespaceResolver.findElementByNamespace(
        t,
        i.localName,
        i.namespace
      ) : n = t.querySelector(i.localName), n && n.textContent) {
        const r = parseFloat(n.textContent.trim());
        if (!isNaN(r))
          return r;
      }
    }
    return null;
  }
  /**
   * Utility method to parse nested Garmin TrackPointExtension elements
   * (currently not used but kept for future enhancement)
   */
  parseGarminTrackPointExtension(e, t) {
    const s = this.namespaceResolver.findElementByNamespace(
      e,
      "TrackPointExtension",
      w.GARMIN_TPX
    );
    if (!s)
      return;
    const i = this.namespaceResolver.findElementByNamespace(
      s,
      "hr",
      w.GARMIN_TPX
    );
    if (i && i.textContent) {
      const o = parseInt(i.textContent.trim(), 10);
      isNaN(o) || (t.heartRate = o);
    }
    const n = this.namespaceResolver.findElementByNamespace(
      s,
      "cad",
      w.GARMIN_TPX
    );
    if (n && n.textContent) {
      const o = parseInt(n.textContent.trim(), 10);
      isNaN(o) || (t.cadence = o);
    }
    const r = this.namespaceResolver.findElementByNamespace(
      s,
      "atemp",
      w.GARMIN_TPX
    );
    if (r && r.textContent) {
      const o = parseFloat(r.textContent.trim());
      isNaN(o) || (t.temperature = o);
    }
  }
}
class kt {
  constructor(e) {
    this.prefixToNamespace = /* @__PURE__ */ new Map(), this.namespaceToPrefix = /* @__PURE__ */ new Map(), this.extractNamespaces(e.documentElement);
  }
  /**
   * Extract all namespace declarations from the XML document.
   * Builds bidirectional mapping between prefixes and namespace URIs.
   */
  extractNamespaces(e) {
    const t = e.attributes;
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
      if (i.name === "xmlns")
        this.registerNamespace("", i.value);
      else if (i.name.startsWith("xmlns:")) {
        const n = i.name.substring(6);
        this.registerNamespace(n, i.value);
      }
    }
  }
  /**
   * Register a namespace prefix and URI mapping
   */
  registerNamespace(e, t) {
    if (this.prefixToNamespace.set(e, t), !this.namespaceToPrefix.has(t)) {
      const s = W[t];
      this.namespaceToPrefix.set(t, s || e);
    }
  }
  /**
   * Get namespace URI for a given prefix
   */
  getNamespaceUri(e) {
    return this.prefixToNamespace.get(e) || null;
  }
  /**
   * Check if a namespace URI is registered in this document
   */
  hasNamespace(e) {
    return this.namespaceToPrefix.has(e);
  }
  /**
   * Find elements with a specific local name in a specific namespace.
   * This works regardless of the prefix used in the document.
   *
   * @param parent Parent element to search within
   * @param localName Local name of the element (without prefix)
   * @param namespaceUri Target namespace URI
   * @returns First matching element or null
   */
  findElementByNamespace(e, t, s) {
    if (!this.hasNamespace(s))
      return null;
    const i = e.children;
    for (let n = 0; n < i.length; n++) {
      const r = i[n];
      if (this.elementMatches(r, t, s))
        return r;
    }
    return null;
  }
  /**
   * Check if an element matches the given local name and namespace
   */
  elementMatches(e, t, s) {
    const i = e.tagName, n = i.indexOf(":");
    return n === -1 ? i.toLowerCase() === t.toLowerCase() ? this.getElementNamespace(e) === s : !1 : i.substring(n + 1).toLowerCase() === t.toLowerCase() ? this.getElementNamespace(e) === s : !1;
  }
  /**
   * Get the namespace URI for an element based on its prefix
   */
  getElementNamespace(e) {
    const t = e.tagName, s = t.indexOf(":");
    if (s === -1)
      return this.getNamespaceUri("");
    {
      const i = t.substring(0, s);
      return this.getNamespaceUri(i);
    }
  }
}
class Me {
  /**
   * Parse GPX XML content into structured data
   */
  parse(e) {
    const s = new DOMParser().parseFromString(e, "text/xml"), i = s.querySelector("parsererror");
    if (i)
      throw new Error(`XML parsing error: ${i.textContent}`);
    this.namespaceResolver = new kt(s), this.extensionParser = new Bt(this.namespaceResolver);
    const n = s.documentElement;
    if (!n || n.tagName !== "gpx")
      throw new Error("Invalid GPX file: missing gpx root element");
    const r = {
      name: "noname",
      tracks: []
    }, o = n.querySelector("metadata");
    if (o) {
      const c = o.querySelector("name");
      c?.textContent && (r.name = c.textContent.trim());
    }
    const l = n.querySelectorAll("trk");
    for (let c = 0; c < l.length; c++) {
      const d = this.parseTrack(l[c]);
      r.tracks.push(d);
    }
    return r;
  }
  /**
   * Parse a GPX track element
   */
  parseTrack(e) {
    const t = new G("noname"), s = e.querySelector("name");
    s?.textContent && (t.name = s.textContent.trim());
    const i = e.querySelectorAll("trkseg");
    for (let n = 0; n < i.length; n++)
      this.parseTrackSegment(t, i[n]);
    return t.computeDerivedData(), t;
  }
  /**
   * Parse a GPX track segment element
   */
  parseTrackSegment(e, t) {
    const s = t.querySelectorAll("trkpt");
    for (let i = 0; i < s.length; i++) {
      const n = this.parseTrackPoint(s[i]);
      e.addPoint(n);
    }
  }
  /**
   * Parse a GPX track point element
   */
  parseTrackPoint(e) {
    const t = { ...Ne }, s = e.getAttribute("lat"), i = e.getAttribute("lon");
    if (!s || !i)
      throw new Error("Invalid track point: missing lat or lon attribute");
    const n = parseFloat(s), r = parseFloat(i);
    if (isNaN(n) || isNaN(r))
      throw new Error("Invalid track point: lat or lon is not a valid number");
    t.lat = H(n), t.lon = H(r);
    const o = e.querySelector("ele");
    if (o?.textContent) {
      const d = parseFloat(o.textContent.trim());
      isNaN(d) || (t.ele = d);
    }
    const l = e.querySelector("time");
    if (l?.textContent)
      try {
        t.time = new Date(l.textContent.trim()).getTime();
      } catch {
      }
    const c = e.querySelector("extensions");
    return c && this.extensionParser.parseExtensions(c, t), { ...t };
  }
  /**
   * Static method to quickly parse GPX content
   */
  static parse(e) {
    return new Me().parse(e);
  }
}
class ne {
  /**
   * Convert Path object to GPX XML string
   */
  writeFromPath(e) {
    return this.write({ name: e.name, tracks: [e] });
  }
  /**
   * Convert GPXData to GPX XML string
   */
  write(e) {
    const t = this.createDocument(), s = this.createGPXElement(t), i = this.createMetadataElement(t, e);
    s.appendChild(i);
    for (const o of e.tracks) {
      const l = this.createTrackElement(t, o);
      s.appendChild(l);
    }
    t.appendChild(s);
    let r = new XMLSerializer().serializeToString(t);
    return r.startsWith("<?xml") || (r = `<?xml version="1.0" encoding="UTF-8"?>
` + r), r = this.formatXML(r), r;
  }
  /**
   * Create XML document
   */
  createDocument() {
    return document.implementation.createDocument("", "", null);
  }
  /**
   * Create GPX root element with proper namespaces
   */
  createGPXElement(e) {
    const t = e.createElement("gpx");
    return t.setAttribute("version", "1.1"), t.setAttribute("creator", "@glandais/virtual-cyclist"), t.setAttribute("xmlns", w.GPX), t.setAttribute("xmlns:xsi", w.W3C_XSI), t.setAttribute(
      `xmlns:${W[w.GARMIN_TPX]}`,
      w.GARMIN_TPX
    ), t.setAttribute(
      "xsi:schemaLocation",
      `${w.GPX} http://www.topografix.com/GPX/1/1/gpx.xsd`
    ), t;
  }
  /**
   * Create metadata element
   */
  createMetadataElement(e, t) {
    const s = e.createElement("metadata");
    if (t.name) {
      const i = e.createElement("name");
      i.textContent = t.name, s.appendChild(i);
    }
    return s;
  }
  /**
   * Create track element
   */
  createTrackElement(e, t) {
    const s = e.createElement("trk");
    if (t.name) {
      const n = e.createElement("name");
      n.textContent = t.name, s.appendChild(n);
    }
    const i = e.createElement("trkseg");
    for (const n of t) {
      const r = this.createTrackPointElement(e, n);
      i.appendChild(r);
    }
    return s.appendChild(i), s;
  }
  /**
   * Create track point element with extensions
   */
  createTrackPointElement(e, t) {
    const s = e.createElement("trkpt");
    if (s.setAttribute("lat", F(t.lat).toString()), s.setAttribute("lon", F(t.lon).toString()), !isNaN(t.ele)) {
      const n = e.createElement("ele");
      n.textContent = t.ele.toString(), s.appendChild(n);
    }
    if (!isNaN(t.time)) {
      const n = e.createElement("time");
      n.textContent = new Date(t.time).toISOString(), s.appendChild(n);
    }
    const i = this.createExtensionsElement(e, t);
    return i.hasChildNodes() && s.appendChild(i), s;
  }
  /**
   * Create extensions element with proper namespace handling
   */
  createExtensionsElement(e, t) {
    const s = e.createElement("extensions"), i = e.createElement(
      `${W[w.GARMIN_TPX]}:TrackPointExtension`
    );
    if (!isNaN(t.heartRate)) {
      const n = e.createElement(
        `${W[w.GARMIN_TPX]}:hr`
      );
      n.textContent = Math.round(t.heartRate).toString(), i.appendChild(n);
    }
    if (!isNaN(t.cadence)) {
      const n = e.createElement(
        `${W[w.GARMIN_TPX]}:cad`
      );
      n.textContent = Math.round(t.cadence).toString(), i.appendChild(n);
    }
    if (!isNaN(t.temperature)) {
      const n = e.createElement(
        `${W[w.GARMIN_TPX]}:atemp`
      );
      n.textContent = t.temperature.toString(), i.appendChild(n);
    }
    if (i.hasChildNodes() && s.appendChild(i), !isNaN(t.power)) {
      const n = e.createElement("power");
      n.textContent = Math.round(t.power).toString(), s.appendChild(n);
    }
    return s;
  }
  /**
   * Format XML with indentation (basic implementation)
   */
  formatXML(e) {
    const t = [], s = /(>)(<)(\/*)(?=\w)/g;
    e = e.replace(s, `$1
$2$3`);
    let i = 0;
    const n = e.split(`
`);
    for (const r of n) {
      let o = 0;
      r.match(/.+<\/\w[^>]*>$/) ? o = 0 : r.match(/^<\/\w/) ? i !== 0 && (i -= 1) : r.match(/^<\w[^>]*[^/]>.*$/) ? o = 1 : o = 0, t.push("  ".repeat(i) + r), i += o;
    }
    return t.join(`
`);
  }
  /**
   * Static method to quickly write GPX from Path
   */
  static writeFromPath(e) {
    return new ne().writeFromPath(e);
  }
  /**
   * Static method to quickly write GPX data
   */
  static write(e) {
    return new ne().write(e);
  }
}
export {
  ot as AbstractPath,
  re as Bike,
  de as CIRC,
  ae as Cyclist,
  K as CyclistPowerProviderBase,
  Ge as DEFAULT_AIR_DENSITY,
  ve as DEFAULT_CRR,
  De as DEFAULT_CYCLIST_MASS_KG,
  Ie as DEFAULT_CYCLIST_POWER_W,
  We as DEFAULT_DRAG_COEFFICIENT,
  _e as DEFAULT_DRIVETRAIN_EFFICIENCY,
  Fe as DEFAULT_FRONTAL_AREA,
  Se as DEFAULT_INERTIA_FRONT,
  xe as DEFAULT_INERTIA_REAR,
  be as DEFAULT_MAX_BRAKE_G,
  Pe as DEFAULT_MAX_LEAN_ANGLE_DEG,
  Xt as DEFAULT_MAX_LEAN_ANGLE_RAD,
  Oe as DEFAULT_MAX_SPEED_KMH,
  Le as DEFAULT_WHEEL_RADIUS,
  te as DT,
  Ot as DouglasPeucker,
  Ne as EMPTY_POINT,
  J as EcefConverter,
  dt as Elevation,
  Yt as Enhancer,
  Z as FIELDS_PER_POINT,
  ue as FIRST_ECCENTRICITY_SQUARED,
  zt as G,
  Me as GPXParser,
  ne as GPXWriter,
  ht as GeneratedPath,
  N as LogLevel,
  ct as Logger,
  fe as MINIMAL_SPEED,
  mt as MaxSpeedComputer,
  G as Path,
  h as PointField,
  at as PointFieldName,
  Wt as PointPerSecond,
  Y as PowerComputer,
  yt as PowerProviderConstant,
  Ht as PowerProviderConstantWithTiring,
  Ce as SEMI_MAJOR_AXIS,
  M as Vector3D,
  ie as VirtualizeService,
  At as WindProviderConstant,
  wt as aeroPowerProvider,
  pt as aeroProviderConstant,
  Re as createLogger,
  Vt as fieldToPointField,
  Ft as getDefaultBikeProperties,
  Gt as getDefaultCyclistProperties,
  xt as gravPowerProvider,
  Tt as muscularPowerProvider,
  Kt as powerProviderFromData,
  qt as rhoProviderDefault,
  Pt as rhoProviderEstimate,
  _t as rollingResistancePowerProvider,
  F as toDegrees,
  H as toRadians,
  It as wheelBearingsPowerProvider,
  Rt as windProviderNone
};
//# sourceMappingURL=index.esm.js.map
