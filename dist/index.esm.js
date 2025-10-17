const zt = 9.8, ne = 0.5555555555555556, Xt = 1, fe = 6378137, he = 0.0066943799901378, Ht = fe * 2 * Math.PI, ve = 4e-3, Re = 0.05, Ae = 0.07, Me = 0.7, Ie = 0.976, Se = 80, _e = 280, Le = 0.6, we = 35, Vt = we * Math.PI / 180, ye = 100, xe = 0.7, Oe = 0.5, be = 1.225, U = class {
};
U.ERROR = 0, U.WARN = 1, U.INFO = 2, U.DEBUG = 3, U.TRACE = 4;
let E = U;
const We = {
  warn: E.WARN
}, ue = {
  0: "ERROR",
  1: "WARN",
  2: "INFO",
  3: "DEBUG",
  4: "TRACE"
}, de = {
  0: console.error,
  1: console.error,
  2: console.log,
  3: console.log,
  4: console.log
};
class Ue {
  constructor(e) {
    this.namespace = e, this.level = We.warn;
  }
  shouldLog(e) {
    return e <= this.level;
  }
  doLog(e, t, ...i) {
    const s = `[${this.namespace}:${ue[e]}]`;
    typeof t == "string" ? de[e](`${s} ${t}`, ...i) : de[e](s, t, ...i);
  }
  log(e, t, ...i) {
    this.shouldLog(e) && this.doLog(e, t, ...i);
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
    return `[${this.namespace}:${ue[e]}] ${t}`;
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
  logDir(e, t, i, s) {
    this.doLog(e, "DIR %s", t), console.dir(i, s);
  }
  /**
   * Display an interactive list of object properties
   * Useful for exploring complex objects in development
   * @param obj - The object to inspect
   * @param options - Optional display options
   */
  dirLevel(e, t, i, s) {
  }
  /**
   * Display an interactive list of object properties
   * Useful for exploring complex objects in development
   * @param obj - The object to inspect
   * @param options - Optional display options
   */
  dir(e, t, i) {
    this.logDir(E.INFO, e, t, i);
  }
  /**
   * Clear the console
   */
  clear() {
    console.clear();
  }
}
const y = (a) => new Ue(a), T = y("tile/cache/ReentrantLock");
class Fe {
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
    if (T.debug(
      "%s: Lock acquire requested (active: %d/%d, queued: %d)",
      e,
      this.loadingCount,
      this.maxConcurrent,
      this.waitQueue.length
    ), this.locks.has(e))
      return T.debug(
        "%s: Lock deduplication - already loading, returning existing promise",
        e
      ), this.locks.get(e);
    if (await this.acquireLoadingSlot(e), this.locks.has(e))
      return T.debug(
        "%s: Lock race condition - already loading after slot acquired, releasing slot",
        e
      ), this.releaseLoadingSlot(e), this.locks.get(e);
    T.debug("%s: Lock creating new promise", e);
    const i = (async () => {
      try {
        T.debug("%s: Promise executing function", e);
        const s = await t();
        return T.debug("%s: Promise resolved successfully", e), s;
      } catch (s) {
        throw T.error("%s: Promise rejected - %o", e, s), s;
      } finally {
        T.debug("%s: Promise cleanup - removing lock and releasing slot", e), this.locks.delete(e), this.releaseLoadingSlot(e);
      }
    })();
    return this.locks.set(e, i), T.debug("%s: Lock registered promise (total locks: %d)", e, this.locks.size), i;
  }
  // ========================================================================
  // PRIVATE - SEMAPHORE OPERATIONS
  // ========================================================================
  /**
   * Acquire a loading slot (semaphore acquire)
   */
  async acquireLoadingSlot(e) {
    if (this.loadingCount < this.maxConcurrent) {
      this.loadingCount++, T.debug(
        "%s: Semaphore acquired slot immediately (%d/%d active, %d queued)",
        e,
        this.loadingCount,
        this.maxConcurrent,
        this.waitQueue.length
      );
      return;
    }
    return T.debug(
      "%s: Semaphore waiting for slot (%d/%d active, %d queued)",
      e,
      this.loadingCount,
      this.maxConcurrent,
      this.waitQueue.length
    ), T.timeLevel(E.DEBUG, e), new Promise((t) => {
      this.waitQueue.push(() => {
        T.timeEndLevel(E.DEBUG, e), this.loadingCount++, T.debug(
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
      T.debug(
        "%s: Semaphore: releasing slot to waiting request (%d/%d active, %d queued)",
        e,
        this.loadingCount,
        this.maxConcurrent,
        this.waitQueue.length
      );
      const t = this.waitQueue.shift();
      t && t();
    } else
      this.loadingCount--, T.debug(
        "%s: Semaphore: released slot (%d/%d active, %d queued)",
        e,
        this.loadingCount,
        this.maxConcurrent,
        this.waitQueue.length
      );
  }
}
const M = y("tile/cache/Cache");
class Ge {
  // ========================================================================
  // CONSTRUCTOR & VALIDATION
  // ========================================================================
  constructor(e, t, i, s) {
    if (this.head = null, this.tail = null, e <= 0)
      throw new Error("Cache size must be greater than 0");
    this.maxSize = e, this.keyMapper = t, this.valueBuilder = i, this.cleanupFn = s, this.cache = /* @__PURE__ */ new Map(), this.lruOrder = /* @__PURE__ */ new Map(), this.lock = new Fe(e);
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
    const t = this.keyMapper(e), i = this.cache.get(t);
    return i ? (this.moveToFront(t), i) : (M.debug("%s miss", t), this.lock.acquire(t, async () => {
      const s = this.cache.get(t);
      if (s)
        return M.debug("%s Missed at first but now OK", t), this.moveToFront(t), s;
      M.info("%s loading", t), M.timeLevel(E.INFO, t);
      const n = await this.valueBuilder(e);
      return M.info("%s loaded", t), M.timeEndLevel(E.INFO, t), this.set(t, n), n;
    }));
  }
  /**
   * Clear all cached items
   */
  clear() {
    if (M.debug("clear"), this.cleanupFn)
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
    let i = this.tail;
    for (; i && t.length < e; )
      t.push(i), i = this.lruOrder.get(i)?.prev || null;
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
    if (M.debug("%s delete", e), !this.cache.has(e))
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
      const i = this.lruOrder.get(this.head);
      i.prev = e;
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
        const i = this.lruOrder.get(t.prev);
        i.next = t.next;
      } else
        this.head = t.next;
      if (t.next) {
        const i = this.lruOrder.get(t.next);
        i.prev = t.prev;
      } else
        this.tail = t.prev;
      this.lruOrder.delete(e);
    }
  }
}
const H = y("tile/fetcher/TileLoader");
class ke {
  constructor(e, t) {
    this.tileUrlTemplate = e, this.tileFetcher = t;
  }
  // ========================================================================
  // PUBLIC API
  // ========================================================================
  async loadTile(e) {
    const t = `${e.z}/${e.x}/${e.y}`, i = this.getTileUrl(e), s = `fetch-${t}`;
    H.timeLevel(E.DEBUG, s);
    try {
      const n = await this.tileFetcher.fetchTile(i);
      return H.timeEndLevel(E.DEBUG, s), n;
    } catch (n) {
      throw H.timeEndLevel(E.DEBUG, s), n instanceof Error ? new Error(`Failed to fetch tile from ${i}: ${n.message}`) : new Error(`Failed to fetch tile from ${i}: Unknown error`);
    }
  }
  // ========================================================================
  // PRIVATE
  // ========================================================================
  getTileUrl(e) {
    const t = `fetch-${`${e.z}/${e.x}/${e.y}`}`;
    return H.timeLevel(E.DEBUG, t), this.tileUrlTemplate.replace("{z}", e.z.toString()).replace("{x}", e.x.toString()).replace("{y}", e.y.toString());
  }
}
class Be {
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
        const { BrowserTileFetcher: n } = await Promise.resolve().then(() => it);
        e = new n();
      }
      const t = (n) => n.close(), i = new ke(this.tileUrlTemplate, e), s = new Ge(
        this.cacheSize,
        (n) => `${n.z}/${n.x}/${n.y}`,
        (n) => i.loadTile(n),
        t
      );
      return this.cache = s, s;
    }
  }
}
const v = 256;
function ze(a) {
  return a * Math.PI / 180;
}
function Xe(a) {
  return a >= -85.0511 && a <= 85.0511;
}
function He(a) {
  return a >= -180 && a <= 180;
}
function Ve(a) {
  return Number.isInteger(a) && a >= 0 && a <= 15;
}
function V(a) {
  let { x: e, y: t } = a;
  const i = a.tile;
  let s = i.x, n = i.y;
  const r = i.z;
  e < 0 && (e += v, s -= 1), e >= v && (e -= v, s += 1), t < 0 && (t += v, n -= 1), t >= v && (t -= v, n += 1);
  const o = Math.pow(2, r) - 1;
  return s = Math.max(0, Math.min(o, s)), n = Math.max(0, Math.min(o, n)), { tile: { z: r, x: s, y: n }, x: e, y: t };
}
function Ce(a, e) {
  if (!Xe(a.latitude))
    throw new Error(
      `Invalid latitude: ${a.latitude}. Must be between -85.0511 and 85.0511`
    );
  if (!He(a.longitude))
    throw new Error(`Invalid longitude: ${a.longitude}. Must be between -180 and 180`);
  if (!Ve(e))
    throw new Error(`Invalid zoom level: ${e}. Must be between 0 and 15`);
  const t = ze(a.latitude), i = Math.pow(2, e), s = (a.longitude + 180) / 360 * i, n = (1 - Math.log(Math.tan(t) + 1 / Math.cos(t)) / Math.PI) / 2 * i;
  let r = Math.floor(s), o = Math.floor(n);
  const c = i - 1;
  return r = Math.max(0, Math.min(c, r)), o = Math.max(0, Math.min(c, o)), {
    x: r,
    y: o,
    xFloat: s,
    yFloat: n,
    z: e
  };
}
function $e(a, e) {
  const t = Ce(a, e);
  return {
    x: t.x,
    y: t.y,
    z: t.z
  };
}
function me(a, e) {
  const t = Ce(a, e), i = Math.floor((t.xFloat - t.x) * v), s = Math.floor((t.yFloat - t.y) * v);
  return {
    tile: {
      z: e,
      x: t.x,
      y: t.y
    },
    x: Math.max(0, Math.min(v - 1, i)),
    y: Math.max(0, Math.min(v - 1, s))
  };
}
class qe {
  constructor(e) {
    this.tileManager = e;
  }
  // ========================================================================
  // PUBLIC API - ELEVATION CALCULATIONS
  // ========================================================================
  async getElevation(e, t, i = !0) {
    try {
      if (i)
        return await this.getInterpolatedElevationInternal(e, t);
      {
        const s = me(e, t);
        return await this.getElevationFromPixel(s);
      }
    } catch (s) {
      throw s instanceof Error ? new Error(`Failed to get elevation: ${s.message}`) : new Error("Failed to get elevation: Unknown error");
    }
  }
  // ========================================================================
  // PRIVATE - HELPER METHODS
  // ========================================================================
  async getInterpolatedElevationInternal(e, t) {
    const i = me(e, t), s = {
      tile: i.tile,
      x: i.x,
      y: i.y
    }, n = Math.floor(s.x), r = Math.floor(s.y), o = n + 1, c = r + 1, l = s.x - n, u = s.y - r, d = await this.getElevationFromPixel(
      V({ tile: s.tile, x: n, y: r })
    ), g = await this.getElevationFromPixel(
      V({ tile: s.tile, x: o, y: r })
    ), m = await this.getElevationFromPixel(
      V({ tile: s.tile, x: n, y: c })
    ), C = await this.getElevationFromPixel(
      V({ tile: s.tile, x: o, y: c })
    ), D = d * (1 - l) + g * l, N = m * (1 - l) + C * l;
    return D * (1 - u) + N * u;
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
function $(a) {
  return { ...a, elevation: a.elevation ?? 0 };
}
class x {
  constructor(e, t, i) {
    this.x = e, this.y = t, this.z = i;
  }
  /**
   * Calculate Euclidean distance between two vectors
   */
  distanceTo(e) {
    const t = this.x - e.x, i = this.y - e.y, s = this.z - e.z;
    return Math.hypot(t, i, s);
  }
  /**
   * Subtract two vectors
   */
  subtract(e) {
    return new x(this.x - e.x, this.y - e.y, this.z - e.z);
  }
  /**
   * Add two vectors
   */
  add(e) {
    return new x(this.x + e.x, this.y + e.y, this.z + e.z);
  }
  /**
   * Multiply vector by scalar
   */
  multiply(e) {
    return new x(this.x * e, this.y * e, this.z * e);
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
    return new x(
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
    return e === 0 ? new x(0, 0, 0) : this.multiply(1 / e);
  }
  /**
   * Calculate perpendicular distance from this point to a line segment defined by two points
   * Uses the formula: ||(p-a) × (p-b)|| / ||b-a||
   * where p is this point, a and b are the line segment endpoints
   */
  distanceToSegment(e, t) {
    const i = t.subtract(e), s = i.magnitude();
    if (s === 0)
      return this.distanceTo(e);
    const n = this.subtract(e).dot(i) / (s * s), r = Math.max(0, Math.min(1, n)), o = e.add(i.multiply(r));
    return this.distanceTo(o);
  }
}
const Y = {
  /** Semi-major axis in meters (WGS84 ellipsoid) */
  SEMI_MAJOR_AXIS: 6378137,
  /** Mean radius in meters (used for distance calculations) */
  MEAN_RADIUS: 6371e3,
  /** First eccentricity squared (WGS84 ellipsoid) */
  FIRST_ECCENTRICITY_SQUARED: 0.00669437999014
}, q = {
  /** Degrees to radians conversion factor */
  DEG_TO_RAD: Math.PI / 180
}, Ke = {
  /** Minimum points needed for smoothing operations */
  MIN_SMOOTHING_POINTS: 3
};
class J {
  /**
   * Convert WGS84 coordinates to ECEF coordinates with optional elevation exaggeration
   * @param coordinates - Geographic coordinates with elevation
   * @param zExaggeration - Elevation exaggeration factor (default: 3)
   * @returns ECEF coordinates as Vector3D
   */
  static toEcef(e, t = 3) {
    const i = e.latitude * Math.PI / 180, s = e.longitude * Math.PI / 180, n = t * (e.elevation || 0), r = Math.sin(i), o = Y.SEMI_MAJOR_AXIS / Math.sqrt(1 - Y.FIRST_ECCENTRICITY_SQUARED * r * r), c = Math.cos(i), l = Math.cos(s), u = Math.sin(s), d = (o + n) * c * l, g = (o + n) * c * u, m = (o * (1 - Y.FIRST_ECCENTRICITY_SQUARED) + n) * r;
    return new x(d, g, m);
  }
  /**
   * Convert multiple coordinates to ECEF vectors
   * @param coordinates - Array of geographic coordinates with elevation
   * @param zExaggeration - Elevation exaggeration factor (default: 3)
   * @returns Array of ECEF coordinates as Vector3D
   */
  static convertBatch(e, t = 3) {
    return e.map((i) => this.toEcef(i, t));
  }
}
const z = y("utils/DouglasPeucker");
class Ye {
  /**
   * Simplify a path using the Douglas-Peucker algorithm in 3D space
   * @param points - Array of coordinates with elevation
   * @param tolerance - Maximum allowed distance from simplified line in meters
   * @param zExaggeration - Elevation exaggeration factor for ECEF conversion (default: 3)
   * @returns Simplified array of coordinates
   */
  static simplify(e, t, i = 3) {
    if (z.info("simplify %s", e.length), e.length <= 2)
      return z.warn("too small"), [...e];
    z.timeLevel(E.INFO, "simplify");
    const s = e.length - 1, n = [];
    n.push(e[0]);
    const r = this.simplifyRecursive(
      e,
      0,
      s,
      t,
      i
    );
    return n.push(...r), n.push(e[s]), z.timeEndLevel(E.INFO, "simplify"), z.debug("simplified -> %s", n.length), n;
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
  static simplifyRecursive(e, t, i, s, n) {
    let r = 0, o = -1;
    const c = [], l = J.toEcef(e[t], n), u = J.toEcef(e[i], n);
    for (let d = t + 1; d < i; d++) {
      const g = J.toEcef(e[d], n).distanceToSegment(l, u);
      g > r && (r = g, o = d);
    }
    if (r > s && o !== -1) {
      if (o - t > 1) {
        const d = this.simplifyRecursive(
          e,
          t,
          o,
          s,
          n
        );
        c.push(...d);
      }
      if (c.push(e[o]), i - o > 1) {
        const d = this.simplifyRecursive(
          e,
          o,
          i,
          s,
          n
        );
        c.push(...d);
      }
    }
    return c;
  }
}
class _ {
  /**
   * Calculate great circle distance between two geographic coordinates using Haversine formula
   * @param coord1 - First coordinate
   * @param coord2 - Second coordinate
   * @returns Distance in meters
   */
  static haversine(e, t) {
    const i = e.latitude * q.DEG_TO_RAD, s = t.latitude * q.DEG_TO_RAD, n = (t.latitude - e.latitude) * q.DEG_TO_RAD, r = (t.longitude - e.longitude) * q.DEG_TO_RAD, o = Math.sin(n / 2) * Math.sin(n / 2) + Math.cos(i) * Math.cos(s) * Math.sin(r / 2) * Math.sin(r / 2), c = 2 * Math.atan2(Math.sqrt(o), Math.sqrt(1 - o));
    return Y.MEAN_RADIUS * c;
  }
  /**
   * Calculate Euclidean distance between two 3D points
   * @param point1 - First 3D point
   * @param point2 - Second 3D point
   * @returns Distance in meters
   */
  static euclidean3D(e, t) {
    const i = e.x - t.x, s = e.y - t.y, n = e.z - t.z;
    return Math.sqrt(i * i + s * s + n * n);
  }
  /**
   * Calculate perpendicular distance from a point to a line segment in 3D space
   * @param point - Point to measure from
   * @param segmentStart - Start point of line segment
   * @param segmentEnd - End point of line segment
   * @returns Perpendicular distance in meters
   */
  static pointToSegment3D(e, t, i) {
    const s = i.subtract(t), n = e.subtract(t), r = s.dot(s);
    if (r === 0)
      return _.euclidean3D(e, t);
    const o = Math.max(0, Math.min(1, n.dot(s) / r)), c = t.add(s.multiply(o));
    return _.euclidean3D(e, c);
  }
  /**
   * Calculate cumulative distances along a path of coordinates
   * @param points - Array of coordinates
   * @returns Array of cumulative distances in meters
   */
  static cumulativeDistances(e) {
    const t = [0];
    for (let i = 1; i < e.length; i++) {
      const s = _.haversine(e[i - 1], e[i]);
      t.push(t[i - 1] + s);
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
    for (let i = 1; i < e.length; i++)
      t += _.haversine(e[i - 1], e[i]);
    return t;
  }
}
const K = y("utils/ElevationSmoother");
class De {
  /**
   * Apply distance-based smoothing to elevation data
   * @param points - Array of coordinates with elevation
   * @param windowSize - Smoothing window in meters (default: 50)
   * @returns Smoothed elevation data
   */
  static smooth(e, t = 50) {
    if (K.debug("smooth %s", e.length), e.length < Ke.MIN_SMOOTHING_POINTS)
      return K.debug("too small"), e;
    if (t <= 0)
      throw new Error(`Invalid window size: ${t}. Must be positive`);
    K.timeLevel(E.INFO, "smooth");
    const i = _.cumulativeDistances(e), s = [];
    for (let n = 0; n < e.length; n++) {
      const r = this.computeSmoothedValue(n, e, i, t);
      s.push({
        ...e[n],
        elevation: r
      });
    }
    return K.timeEndLevel(E.INFO, "smooth"), s;
  }
  /**
   * Compute smoothed elevation value for a single point
   * @param index - Index of point to smooth
   * @param points - All points
   * @param distances - Cumulative distances
   * @param windowSize - Smoothing window in meters
   * @returns Smoothed elevation value
   */
  static computeSmoothedValue(e, t, i, s) {
    const n = i[e];
    let r = e;
    for (; r > 0 && n - i[r - 1] <= s; )
      r--;
    let o = e;
    for (; o < t.length - 1 && i[o + 1] - n <= s; )
      o++;
    let c = 0, l = 0;
    for (let u = r; u <= o; u++) {
      const d = 1 - Math.abs(i[u] - n) / s;
      c += d, l += t[u].elevation * d;
    }
    return c > 0 ? l / c : t[e].elevation;
  }
}
class Z {
  constructor(e) {
    this.source = e;
  }
  static from(e) {
    async function* t() {
      for (const i of e)
        yield i;
    }
    return new Z(t());
  }
  mapAsync(e, t = 1) {
    const i = this.source;
    async function* s() {
      const n = [];
      for await (const r of i) {
        const o = e(r);
        n.push(o), n.length >= t && (yield await n.shift());
      }
      for (; n.length > 0; )
        yield await n.shift();
    }
    return new Z(s());
  }
  async countProcessed() {
    let e = 0;
    for await (const t of this.source)
      e++;
    return e;
  }
}
const p = y("calculator/BatchCalculator");
class Ze {
  constructor(e) {
    this.elevationCalculator = e;
  }
  async setElevations(e, t, i) {
    const s = {}, n = /* @__PURE__ */ new Map(), r = (c) => `${c.z}/${c.x}/${c.y}`;
    for (const c of e) {
      const l = $e(c, t), u = r(l);
      let d = s[u];
      d || (d = [], s[u] = d, n.set(u, l)), d.push(c);
    }
    const o = Array.from(n.values());
    await Z.from(o).mapAsync(async (c) => {
      const l = r(c), u = s[l];
      for (const d of u)
        d.elevation = await this.elevationCalculator.getElevation(
          d,
          t,
          i
        );
      return c;
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
  async getElevationsAlong(e, t, i, s, n, r, o) {
    const c = "path-elevations";
    if (p.timeLevel(E.INFO, c), p.info(
      "Path processing started - waypoints: %d, step: %dm, zoom: %d, interpolation: %s",
      e.length,
      i,
      t,
      n
    ), e.length < 2)
      throw p.error("Path validation failed - insufficient waypoints: %d", e.length), new Error("Path must contain at least 2 coordinates");
    if (i <= 1)
      throw p.error("Path validation failed - step too small: %dm", i), new Error(`Step is too small: ${i} meters`);
    p.debug("Generating coordinates along path");
    const l = "coordinate-generation";
    p.timeLevel(E.DEBUG, l);
    let u = Array.from(this.generateCoordinatesAlong(e, i, s));
    if (p.timeEndLevel(E.DEBUG, l), p.debug("Generated %d coordinates along path", u.length), p.debug("Fetching elevations for generated coordinates"), await this.setElevations(u, t, n), p.debug("Combined coordinates with elevations - points: %d", u.length), r?.enabled === !0 && u.length >= 3) {
      const d = r.windowSize ?? 50, g = u.length;
      p.debug("Applying elevation smoothing - windowSize: %dm", d);
      const m = "smoothing";
      p.timeLevel(E.DEBUG, m), u = De.smooth(u, d), p.timeEndLevel(E.DEBUG, m), p.debug(
        "Smoothing completed - points: %d → %d",
        g,
        u.length
      );
    } else r?.enabled === !0 && p.debug(
      "Smoothing skipped - insufficient points: %d (minimum: 3)",
      u.length
    );
    if (o?.enabled === !0 && u.length > 2) {
      const d = o?.tolerance ?? 10, g = o?.zExaggeration ?? 3, m = u.length;
      p.debug(
        "Applying Douglas-Peucker filtering - tolerance: %d, zExaggeration: %d",
        d,
        g
      );
      const C = "filtering";
      p.timeLevel(E.DEBUG, C);
      const D = Ye.simplify(u, d, g);
      return p.timeEndLevel(E.DEBUG, C), p.debug(
        "Filtering completed - points: %d → %d (%f % reduction)",
        m,
        D.length,
        ((m - D.length) / m * 100).toFixed(1)
      ), p.timeEndLevel(E.INFO, c), p.info(
        "Path processing completed - waypoints: %d, final points: %d, smoothed: %s, filtered: %s",
        e.length,
        D.length,
        r?.enabled,
        o?.enabled
      ), D;
    } else o?.enabled === !0 && p.debug(
      "Filtering skipped - insufficient points: %d (minimum: 3)",
      u.length
    );
    return p.timeEndLevel(E.INFO, c), p.info(
      "Path processing completed - waypoints: %d, final points: %d, smoothed: %s, filtered: %s",
      e.length,
      u.length,
      r?.enabled,
      o?.enabled
    ), u;
  }
  /**
   * Generate coordinates along a path with multiple waypoints
   * @param path - Array of coordinates defining the path
   * @param step - Distance between points in meters
   */
  *generateCoordinatesAlong(e, t, i) {
    if (e.length < 2) {
      p.debug("Path generation skipped - insufficient waypoints: %d", e.length);
      return;
    }
    p.debug("Generating coordinates - waypoints: %d, step: %dm", e.length, t), yield $(e[0]);
    let s = 1, n = 0;
    for (let r = 0; r < e.length - 1; r++) {
      const o = _.haversine(e[r], e[r + 1]);
      if (o < i) {
        n++, p.debug(
          "Segment %d skipped - distance too short: %.2fm (minimum: %.2fm)",
          r + 1,
          o,
          i
        );
        continue;
      }
      p.debug("Processing segment %d - distance: %.2fm", r + 1, o);
      let c = !0, l = 0;
      for (const u of this.generateCoordinatesBetween(e[r], e[r + 1], t)) {
        if (c) {
          c = !1;
          continue;
        }
        yield u, s++, l++;
      }
      p.debug("Segment %d completed - generated: %d points", r + 1, l);
    }
    n > 0 ? p.debug(
      "Path generation completed - generated: %d points, skipped segments: %d",
      s,
      n
    ) : p.debug("Path generation completed - generated: %d points", s);
  }
  /**
   * Generate coordinates between two points at regular intervals
   * @param coordinate1 - Start coordinate
   * @param coordinate2 - End coordinate
   * @param step - Distance between points in meters
   */
  *generateCoordinatesBetween(e, t, i) {
    const s = _.haversine(e, t);
    if (yield $(e), s <= i) {
      yield $(t);
      return;
    }
    const n = Math.floor(s / i), r = t.latitude - e.latitude, o = t.longitude - e.longitude;
    for (let c = 1; c <= n; c++) {
      const l = c * i / s;
      yield {
        latitude: e.latitude + r * l,
        longitude: e.longitude + o * l,
        elevation: 0
      };
    }
    yield $(t);
  }
}
const je = y("ElevationProvider");
class Qe {
  // ============================================================================
  // CONSTRUCTOR & CONFIGURATION
  // ============================================================================
  constructor(e = {}) {
    this.config = {
      zoomLevel: e.zoomLevel ?? 12,
      cacheSize: e.cacheSize ?? 100,
      tileUrlTemplate: e.tileUrlTemplate ?? "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
    }, je.dir("Config :", this.config), this.validateConfig(), this.tileManager = new Be(this.config.tileUrlTemplate, this.config.cacheSize), this.calculator = new qe(this.tileManager), this.batchCalculator = new Ze(this.calculator);
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
  async getElevation(e, t, i) {
    const s = i?.interpolation ?? !0, n = { latitude: e, longitude: t };
    return await this.calculator.getElevation(n, this.config.zoomLevel, s);
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
    const i = t?.interpolation ?? !0;
    await this.batchCalculator.setElevations(e, this.config.zoomLevel, i);
  }
  /**
   * Get elevations along a path defined by multiple coordinates
   * @param path - Array of coordinates defining the path
   * @param options - Optional parameters
   */
  async getElevationsAlong(e, t) {
    const i = t?.step ?? 10, s = t?.minDistance ?? 1, n = t?.interpolation ?? !0, r = t?.smoothingOptions, o = t?.filterOptions;
    return this.batchCalculator.getElevationsAlong(
      e,
      this.config.zoomLevel,
      i,
      s,
      n,
      r,
      o
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
const R = y("tile/fetcher/CanvasPool");
class Je {
  constructor(e) {
    this.available = [], this.idleSize = 5, this.idleTimeout = 3e4, this.idleTimer = null, this.totalCreated = 0, this.totalAcquired = 0, this.totalReleased = 0, this.builder = e;
  }
  /**
   * Acquire a canvas from the pool (creates new if none available)
   */
  acquire() {
    this.totalAcquired++;
    let e = this.available.pop();
    return e ? R.debug(
      "Canvas acquired from pool (pool size: %d → %d, total acquired: %d)",
      this.available.length + 1,
      this.available.length,
      this.totalAcquired
    ) : (e = this.builder(), this.totalCreated++, R.debug(
      "Canvas created - new canvas (total created: %d, pool size: %d)",
      this.totalCreated,
      this.available.length
    )), this._resetIdleTimer(), e;
  }
  /**
   * Return a canvas to the pool for reuse
   */
  release(e) {
    e ? (this.totalReleased++, this.available.push(e), R.debug(
      "Canvas released to pool (pool size: %d → %d, total released: %d)",
      this.available.length - 1,
      this.available.length,
      this.totalReleased
    ), this._resetIdleTimer()) : R.warn("Canvas release attempted with null/undefined canvas");
  }
  /**
   * Reset the idle timer for automatic cleanup
   */
  _resetIdleTimer() {
    this.idleTimer ? (clearTimeout(this.idleTimer), R.debug("Idle timer reset - previous timer cleared")) : R.debug("Idle timer started - %d ms until auto-trim", this.idleTimeout), this.idleTimer = setTimeout(() => this._trim(), this.idleTimeout);
  }
  /**
   * Trim excess canvases to prevent memory buildup
   */
  _trim() {
    const e = this.available.length;
    let t = 0;
    if (e > this.idleSize) {
      for (R.debug(
        "Auto-trim triggered - pool size %d exceeds idle limit %d",
        e,
        this.idleSize
      ); this.available.length > this.idleSize; )
        this.available.pop(), t++;
      R.info(
        "Canvas pool trimmed - removed %d canvases (pool size: %d → %d)",
        t,
        e,
        this.available.length
      );
    } else
      R.debug(
        "Auto-trim skipped - pool size %d within idle limit %d",
        e,
        this.idleSize
      );
    this.idleTimer = null;
  }
}
class et {
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
    const i = (e.y * t.width + e.x) * 4;
    return {
      red: t.data[i],
      green: t.data[i + 1],
      blue: t.data[i + 2]
      // Alpha channel (index + 3) is ignored for Terrarium encoding
    };
  }
}
class tt {
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  constructor() {
    this.canvasPool = new Je(() => document.createElement("canvas"));
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
    const i = await t.blob(), s = await createImageBitmap(i), n = this.canvasPool.acquire();
    try {
      n.width = s.width, n.height = s.height;
      const r = n.getContext("2d", { willReadFrequently: !0 });
      if (!r)
        throw new Error("Failed to get 2D canvas context");
      r.drawImage(s, 0, 0);
      const o = r.getImageData(0, 0, s.width, s.height);
      return new et(o, s);
    } finally {
      this.canvasPool.release(n);
    }
  }
}
const it = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BrowserTileFetcher: tt
}, Symbol.toStringTag, { value: "Module" }));
var h = /* @__PURE__ */ ((a) => (a[a.LATITUDE = 0] = "LATITUDE", a[a.LONGITUDE = 1] = "LONGITUDE", a[a.DISTANCE = 2] = "DISTANCE", a[a.DX = 3] = "DX", a[a.TIME = 4] = "TIME", a[a.ELAPSED = 5] = "ELAPSED", a[a.DT = 6] = "DT", a[a.BEARING = 7] = "BEARING", a[a.ELEVATION = 8] = "ELEVATION", a[a.GRADE = 9] = "GRADE", a[a.RADIUS = 10] = "RADIUS", a[a.AERO_COEF = 11] = "AERO_COEF", a[a.WIND_BEARING = 12] = "WIND_BEARING", a[a.WIND_ALPHA = 13] = "WIND_ALPHA", a[a.P_AERO = 14] = "P_AERO", a[a.P_GRAVITY = 15] = "P_GRAVITY", a[a.P_ROLLING_RESISTANCE = 16] = "P_ROLLING_RESISTANCE", a[a.P_WHEEL_BEARINGS = 17] = "P_WHEEL_BEARINGS", a[a.P_INPUT_POWER = 18] = "P_INPUT_POWER", a[a.P_CYCLIST_PROVIDED_OPTIMAL_POWER = 19] = "P_CYCLIST_PROVIDED_OPTIMAL_POWER", a[a.P_CYCLIST_PROVIDED_OPTIMAL_POWER_HARMONICS = 20] = "P_CYCLIST_PROVIDED_OPTIMAL_POWER_HARMONICS", a[a.P_CYCLIST_PROVIDED_POWER_NEEDED = 21] = "P_CYCLIST_PROVIDED_POWER_NEEDED", a[a.P_CYCLIST_PROVIDED_MUSCULAR = 22] = "P_CYCLIST_PROVIDED_MUSCULAR", a[a.P_CYCLIST_PROVIDED_WHEEL = 23] = "P_CYCLIST_PROVIDED_WHEEL", a[a.P_COMPUTED_TOTAL_POWER = 24] = "P_COMPUTED_TOTAL_POWER", a[a.P_COMPUTED_WHEEL_POWER = 25] = "P_COMPUTED_WHEEL_POWER", a[a.POWER = 26] = "POWER", a[a.SPEED = 27] = "SPEED", a[a.SPEED_MAX = 28] = "SPEED_MAX", a[a.SPEED_MAX_INCLINE = 29] = "SPEED_MAX_INCLINE", a[a.VIRT_SPEED_CURRENT = 30] = "VIRT_SPEED_CURRENT", a[a.TEMPERATURE = 31] = "TEMPERATURE", a[a.WIND_SPEED = 32] = "WIND_SPEED", a[a.WIND_DIRECTION = 33] = "WIND_DIRECTION", a[a.HEART_RATE = 34] = "HEART_RATE", a[a.CADENCE = 35] = "CADENCE", a))(h || {});
const te = [
  // Coordinates (4 properties)
  0,
  // Latitude (radians)
  1,
  // Longitude (radians)
  2,
  // Distance (meters)
  3,
  // dx (meters)
  // Temporal (3 properties)
  4,
  // Timestamp (ms since epoch)
  5,
  // Elapsed duration (ms)
  6,
  // dt (ms)
  // Angles (1 properties)
  7,
  // Direction bearing (radians)
  // 🏔️ Elevation (1 properties)
  8,
  // Elevation (meters)
  // 📐 Grade (1 properties)
  9,
  // Road grade/slope (%)
  // Radius (1 properties)
  10,
  // Turn radius (meters)
  // Aero coef (1 properties)
  11,
  // Aerodynamic coefficient
  // Cyclist wind (2 properties)
  12,
  // Wind bearing (radians)
  13,
  // Wind angle (radians)
  // ⚡ Power Physics (4 properties)
  14,
  // Aerodynamic power
  15,
  // Gravitational power
  16,
  // Rolling resistance power
  17,
  // Wheel bearings power
  // ⚡ Power Cyclist (6 properties)
  18,
  // GPX input power
  19,
  // Optimal power
  20,
  // Optimal power with harmonics
  21,
  // Power needed
  22,
  // Raw cyclist power
  23,
  // Cyclist power transmitted to ground
  // ⚡ Power Post processed (3 properties)
  24,
  // Power from kinetic energy change
  25,
  // Wheel power from kinetic energy change
  26,
  // Total power (watts)
  // Speed & Motion (4 properties)
  27,
  // Current speed (m/s)
  28,
  // Maximum speed (m/s)
  29,
  // Max speed on incline (m/s)
  30,
  // Virtual current speed (m/s)
  // Environmental (3 properties)
  31,
  // Temperature (celsius)
  32,
  // Wind speed (m/s)
  33,
  // Wind direction (radians)
  // Physiological (2 properties)
  34,
  // Heart rate (bpm)
  35
  /* CADENCE */
  // Pedaling cadence (rpm)
], qt = {
  // Coordinates (4 properties)
  latitude: 0,
  // Latitude (radians)
  longitude: 1,
  // Longitude (radians)
  distance: 2,
  // Distance (meters)
  dx: 3,
  // dx (meters)
  // Temporal (3 properties)
  time: 4,
  // Timestamp (ms since epoch)
  elapsed: 5,
  // Elapsed duration (ms)
  dt: 6,
  // dt (ms)
  // Angles (1 properties)
  bearing: 7,
  // Direction bearing (radians)
  // 🏔️ Elevation (1 properties)
  elevation: 8,
  // Elevation (meters)
  // 📐 Grade (1 properties)
  grade: 9,
  // Road grade/slope (%)
  // Radius (1 properties)
  radius: 10,
  // Turn radius (meters)
  // Aero coef (1 properties)
  aeroCoef: 11,
  // Aerodynamic coefficient
  // Cyclist wind (2 properties)
  windBearing: 12,
  // Wind bearing (radians)
  windAlpha: 13,
  // Wind angle (radians)
  // ⚡ Power Physics (4 properties)
  pAero: 14,
  // Aerodynamic power
  pGravity: 15,
  // Gravitational power
  pRollingResistance: 16,
  // Rolling resistance power
  pWheelBearings: 17,
  // Wheel bearings power
  // ⚡ Power Cyclist (6 properties)
  pInputPower: 18,
  // GPX input power
  pCyclistProvidedOptimalPower: 19,
  // Optimal power
  pCyclistProvidedOptimalPowerWithHarmonics: 20,
  // Optimal power with harmonics
  pCyclistPowerNeeded: 21,
  // Power needed
  pCyclistProvidedMuscular: 22,
  // Raw cyclist power
  PCyclistProvidedWheel: 23,
  // Cyclist power transmitted to ground
  // ⚡ Power Post processed (3 properties)
  pComputedTotalPower: 24,
  // Power from kinetic energy change
  pComputedWheelPower: 25,
  // Wheel power from kinetic energy change
  pComputedPower: 26,
  // Total power (watts)
  // Speed & Motion (4 properties)
  speed: 27,
  // Current speed (m/s)
  speedMax: 28,
  // Maximum speed (m/s)
  speedMaxIncline: 29,
  // Max speed on incline (m/s)
  virtSpeedCurrent: 30,
  // Virtual current speed (m/s)
  // Environmental (3 properties)
  temperature: 31,
  // Temperature (celsius)
  windSpeed: 32,
  // Wind speed (m/s)
  windDirection: 33,
  // Wind direction (radians)
  // Physiological (2 properties)
  heartRate: 34,
  // Heart rate (bpm)
  cadence: 35
  /* CADENCE */
  // Pedaling cadence (rpm)
}, S = 36, st = {
  // Coordinates
  latitude: NaN,
  longitude: NaN,
  distance: NaN,
  dx: NaN,
  // Temporal
  time: NaN,
  elapsed: NaN,
  dt: NaN,
  // Angles
  bearing: NaN,
  // 🏔️ Elevation
  elevation: NaN,
  // 📐 Grade
  grade: NaN,
  // Radius
  radius: NaN,
  // Aero coef
  aeroCoef: NaN,
  // Cyclist wind
  windBearing: NaN,
  windAlpha: NaN,
  // ⚡ Power Physics
  pAero: NaN,
  pGravity: NaN,
  pRollingResistance: NaN,
  pWheelBearings: NaN,
  // ⚡ Power Cyclist
  pInputPower: NaN,
  pCyclistProvidedOptimalPower: NaN,
  pCyclistProvidedOptimalPowerWithHarmonics: NaN,
  pCyclistPowerNeeded: NaN,
  pCyclistProvidedMuscular: NaN,
  PCyclistProvidedWheel: NaN,
  // ⚡ Power Post processed
  pComputedTotalPower: NaN,
  pComputedWheelPower: NaN,
  pComputedPower: NaN,
  // Speed & Motion
  speed: NaN,
  speedMax: NaN,
  speedMaxIncline: NaN,
  virtSpeedCurrent: NaN,
  // Environmental
  temperature: NaN,
  windSpeed: NaN,
  windDirection: NaN,
  // Physiological
  heartRate: NaN,
  cadence: NaN
};
class nt {
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
    const e = this.chunks.length * this.CHUNK_SIZE * S * 8;
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
      this.chunks.push(new Float64Array(this.CHUNK_SIZE * S));
  }
  /**
   * Calculates the chunk index and field offset for a given point and field.
   */
  getOffset(e, t) {
    if (e < 0 || e >= this.pointCount)
      throw new Error(`Point index ${e} out of bounds [0, ${this.pointCount})`);
    const i = Math.floor(e / this.CHUNK_SIZE), n = e % this.CHUNK_SIZE * S + t;
    return { chunkIndex: i, fieldOffset: n };
  }
  /**
   * Gets a field value for a specific point.
   */
  getField(e, t) {
    const { chunkIndex: i, fieldOffset: s } = this.getOffset(e, t);
    return this.chunks[i][s];
  }
  /**
   * Sets a field value for a specific point.
   */
  setField(e, t, i) {
    const { chunkIndex: s, fieldOffset: n } = this.getOffset(e, t);
    this.chunks[s][n] = i;
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
const rt = [
  {
    id: "coordinates",
    name: "Coordinates",
    fields: [
      {
        name: "LATITUDE",
        prop: "latitude",
        shortDescription: "Latitude (radians)",
        longDescription: "Latitude (radians)",
        unit: "radians",
        getDegrees: !0,
        notSelectable: !0
      },
      {
        name: "LONGITUDE",
        prop: "longitude",
        shortDescription: "Longitude (radians)",
        longDescription: "",
        unit: "radians",
        getDegrees: !0,
        notSelectable: !0
      },
      {
        name: "DISTANCE",
        prop: "distance",
        shortDescription: "Distance (meters)",
        longDescription: "",
        unit: "meters"
      },
      {
        name: "DX",
        prop: "dx",
        shortDescription: "dx (meters)",
        longDescription: "",
        unit: "meters"
      }
    ]
  },
  {
    id: "temporal",
    name: "Temporal",
    fields: [
      {
        name: "TIME",
        prop: "time",
        shortDescription: "Timestamp (ms since epoch)",
        longDescription: "",
        unit: "ms",
        setSpecial: "date",
        getSpecial: "date",
        notSelectable: !0
      },
      {
        name: "ELAPSED",
        prop: "elapsed",
        shortDescription: "Elapsed duration (ms)",
        longDescription: "",
        unit: "ms"
      },
      {
        name: "DT",
        prop: "dt",
        shortDescription: "dt (ms)",
        longDescription: "",
        unit: "ms"
      }
    ]
  },
  {
    id: "angles",
    name: "Angles",
    fields: [
      {
        name: "BEARING",
        prop: "bearing",
        shortDescription: "Direction bearing (radians)",
        longDescription: "",
        unit: "radians"
      }
    ]
  },
  {
    id: "elevation",
    name: "🏔️ Elevation",
    fields: [
      {
        name: "ELEVATION",
        prop: "elevation",
        shortDescription: "Elevation (meters)",
        longDescription: "",
        unit: "meters"
      }
    ]
  },
  {
    id: "grade",
    name: "📐 Grade",
    fields: [
      {
        name: "GRADE",
        prop: "grade",
        shortDescription: "Road grade/slope (%)",
        longDescription: "",
        unit: "%"
      }
    ]
  },
  {
    id: "radius",
    name: "Radius",
    fields: [
      {
        name: "RADIUS",
        prop: "radius",
        shortDescription: "Turn radius (meters)",
        longDescription: "",
        unit: "meters"
      }
    ]
  },
  {
    id: "aero_coef",
    name: "Aero coef",
    fields: [
      {
        name: "AERO_COEF",
        prop: "aeroCoef",
        shortDescription: "Aerodynamic coefficient",
        longDescription: "",
        unit: "aero"
      }
    ]
  },
  {
    id: "cyclist_wind",
    name: "Cyclist wind",
    fields: [
      {
        name: "WIND_BEARING",
        prop: "windBearing",
        shortDescription: "Wind bearing (radians)",
        longDescription: "",
        unit: "radians"
      },
      {
        name: "WIND_ALPHA",
        prop: "windAlpha",
        shortDescription: "Wind angle (radians)",
        longDescription: "",
        unit: "radians"
      }
    ]
  },
  {
    id: "power_physics",
    name: "⚡ Power Physics",
    fields: [
      {
        name: "P_AERO",
        prop: "pAero",
        shortDescription: "Aerodynamic power",
        longDescription: "",
        unit: "watts"
      },
      {
        name: "P_GRAVITY",
        prop: "pGravity",
        shortDescription: "Gravitational power",
        longDescription: "",
        unit: "watts"
      },
      {
        name: "P_ROLLING_RESISTANCE",
        prop: "pRollingResistance",
        shortDescription: "Rolling resistance power",
        longDescription: "",
        unit: "watts"
      },
      {
        name: "P_WHEEL_BEARINGS",
        prop: "pWheelBearings",
        shortDescription: "Wheel bearings power",
        longDescription: "",
        unit: "watts"
      }
    ]
  },
  {
    id: "power_cyclist",
    name: "⚡ Power Cyclist",
    fields: [
      {
        name: "P_INPUT_POWER",
        prop: "pInputPower",
        shortDescription: "GPX input power",
        longDescription: "",
        unit: "watts"
      },
      // provided
      {
        name: "P_CYCLIST_PROVIDED_OPTIMAL_POWER",
        prop: "pCyclistProvidedOptimalPower",
        shortDescription: "Optimal power",
        longDescription: "",
        unit: "watts"
      },
      {
        name: "P_CYCLIST_PROVIDED_OPTIMAL_POWER_HARMONICS",
        prop: "pCyclistProvidedOptimalPowerWithHarmonics",
        shortDescription: "Optimal power with harmonics",
        longDescription: "",
        unit: "watts"
      },
      {
        name: "P_CYCLIST_PROVIDED_POWER_NEEDED",
        prop: "pCyclistPowerNeeded",
        shortDescription: "Power needed",
        longDescription: "",
        unit: "watts"
      },
      {
        name: "P_CYCLIST_PROVIDED_MUSCULAR",
        prop: "pCyclistProvidedMuscular",
        shortDescription: "Raw cyclist power",
        longDescription: "",
        unit: "watts"
      },
      {
        name: "P_CYCLIST_PROVIDED_WHEEL",
        prop: "PCyclistProvidedWheel",
        shortDescription: "Cyclist power transmitted to ground",
        longDescription: "",
        unit: "watts"
      }
    ]
  },
  {
    id: "power_post",
    name: "⚡ Power Post processed",
    fields: [
      {
        name: "P_COMPUTED_TOTAL_POWER",
        prop: "pComputedTotalPower",
        shortDescription: "Power from kinetic energy change",
        longDescription: "",
        unit: "watts"
      },
      {
        name: "P_COMPUTED_WHEEL_POWER",
        prop: "pComputedWheelPower",
        shortDescription: "Wheel power from kinetic energy change",
        longDescription: "",
        unit: "watts"
      },
      {
        name: "POWER",
        prop: "pComputedPower",
        shortDescription: "Total power (watts)",
        longDescription: "",
        unit: "watts"
      }
    ]
  },
  {
    id: "speed",
    name: "Speed & Motion",
    fields: [
      {
        name: "SPEED",
        prop: "speed",
        shortDescription: "Current speed (m/s)",
        longDescription: "",
        unit: "m/s"
      },
      {
        name: "SPEED_MAX",
        prop: "speedMax",
        shortDescription: "Maximum speed (m/s)",
        longDescription: "",
        unit: "m/s"
      },
      {
        name: "SPEED_MAX_INCLINE",
        prop: "speedMaxIncline",
        shortDescription: "Max speed on incline (m/s)",
        longDescription: "",
        unit: "m/s"
      },
      {
        name: "VIRT_SPEED_CURRENT",
        prop: "virtSpeedCurrent",
        shortDescription: "Virtual current speed (m/s)",
        longDescription: "",
        unit: "m/s"
      }
    ]
  },
  {
    id: "environmental",
    name: "Environmental",
    fields: [
      {
        name: "TEMPERATURE",
        prop: "temperature",
        shortDescription: "Temperature (celsius)",
        longDescription: "",
        unit: "celsius"
      },
      {
        name: "WIND_SPEED",
        prop: "windSpeed",
        shortDescription: "Wind speed (m/s)",
        longDescription: "",
        unit: "m/s"
      },
      {
        name: "WIND_DIRECTION",
        prop: "windDirection",
        shortDescription: "Wind direction (radians)",
        longDescription: "",
        unit: "radians"
      }
    ]
  },
  {
    id: "physiological",
    name: "Physiological",
    fields: [
      {
        name: "HEART_RATE",
        prop: "heartRate",
        shortDescription: "Heart rate (bpm)",
        longDescription: "",
        unit: "bpm"
      },
      {
        name: "CADENCE",
        prop: "cadence",
        shortDescription: "Pedaling cadence (rpm)",
        longDescription: "",
        unit: "rpm"
      }
    ]
  }
], ot = rt.flatMap((a) => a.fields), Kt = ot.length, pe = (a) => a * Math.PI / 180, G = (a) => a * 180 / Math.PI, b = class b {
};
b.ERROR = 0, b.WARN = 1, b.INFO = 2, b.DEBUG = 3, b.TRACE = 4;
let f = b;
const at = {
  error: f.ERROR,
  warn: f.WARN,
  info: f.INFO,
  debug: f.DEBUG,
  trace: f.TRACE
}, ge = {
  0: "ERROR",
  1: "WARN",
  2: "INFO",
  3: "DEBUG",
  4: "TRACE"
}, Ee = {
  0: console.error,
  1: console.error,
  2: console.log,
  3: console.log,
  4: console.log
};
class ct {
  constructor(e) {
    this.namespace = e, this.level = at.warn;
  }
  shouldLog(e) {
    return e <= this.level;
  }
  doLog(e, t, ...i) {
    const s = `[${this.namespace}:${ge[e]}]`;
    typeof t == "string" ? Ee[e](`${s} ${t}`, ...i) : Ee[e](s, t, ...i);
  }
  log(e, t, ...i) {
    this.shouldLog(e) && this.doLog(e, t, ...i);
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
    this.log(f.WARN, e, ...t);
  }
  /**
   * Log errors
   * Supports printf-style formatting: logger.error('Failed to load %s: %o', file, error)
   */
  error(e, ...t) {
    this.log(f.ERROR, e, ...t);
  }
  getTimeLabel(e, t) {
    return `[${this.namespace}:${ge[e]}] ${t}`;
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
    this.doTime(f.INFO, e);
  }
  /**
   * End timing and log duration
   */
  timeEnd(e) {
    this.doTimeEnd(f.INFO, e);
  }
  logDir(e, t, i, s) {
    this.doLog(e, "DIR %s", t), console.dir(i, s);
  }
  /**
   * Display an interactive list of object properties
   * Useful for exploring complex objects in development
   * @param obj - The object to inspect
   * @param options - Optional display options
   */
  dirLevel(e, t, i, s) {
  }
  /**
   * Display an interactive list of object properties
   * Useful for exploring complex objects in development
   * @param obj - The object to inspect
   * @param options - Optional display options
   */
  dir(e, t, i) {
    this.logDir(f.INFO, e, t, i);
  }
  /**
   * Clear the console
   */
  clear() {
    console.clear();
  }
}
const Ne = (a) => new ct(a);
class O {
  constructor(e, t, i) {
    this.x = e, this.y = t, this.z = i;
  }
  /**
   * Calculate Euclidean distance between two vectors
   */
  distanceTo(e) {
    const t = this.x - e.x, i = this.y - e.y, s = this.z - e.z;
    return Math.hypot(t, i, s);
  }
  /**
   * Subtract two vectors
   */
  subtract(e) {
    return new O(this.x - e.x, this.y - e.y, this.z - e.z);
  }
  /**
   * Add two vectors
   */
  add(e) {
    return new O(this.x + e.x, this.y + e.y, this.z + e.z);
  }
  /**
   * Multiply vector by scalar
   */
  multiply(e) {
    return new O(this.x * e, this.y * e, this.z * e);
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
    return new O(
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
    return e === 0 ? new O(0, 0, 0) : this.multiply(1 / e);
  }
  /**
   * Calculate perpendicular distance from this point to a line segment defined by two points
   * Uses the formula: ||(p-a) × (p-b)|| / ||b-a||
   * where p is this point, a and b are the line segment endpoints
   */
  distanceToSegment(e, t) {
    const i = t.subtract(e), s = i.magnitude();
    if (s === 0)
      return this.distanceTo(e);
    const r = this.subtract(e).dot(i) / (s * s), o = Math.max(0, Math.min(1, r)), c = e.add(i.multiply(o));
    return this.distanceTo(c);
  }
}
class lt extends nt {
  // === Coordinates Accessors ===
  getLatitude(e) {
    return super.getField(e, h.LATITUDE);
  }
  getLatitudeDeg(e) {
    return G(super.getField(e, h.LATITUDE));
  }
  setLatitude(e, t) {
    super.setField(e, h.LATITUDE, t);
  }
  getLongitude(e) {
    return super.getField(e, h.LONGITUDE);
  }
  getLongitudeDeg(e) {
    return G(super.getField(e, h.LONGITUDE));
  }
  setLongitude(e, t) {
    super.setField(e, h.LONGITUDE, t);
  }
  getDistance(e) {
    return super.getField(e, h.DISTANCE);
  }
  setDistance(e, t) {
    super.setField(e, h.DISTANCE, t);
  }
  getDx(e) {
    return super.getField(e, h.DX);
  }
  setDx(e, t) {
    super.setField(e, h.DX, t);
  }
  // === Temporal Accessors ===
  getTime(e) {
    return super.getField(e, h.TIME);
  }
  setTime(e, t) {
    const i = t instanceof Date ? t.getTime() : t;
    super.setField(e, h.TIME, i);
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
  getDt(e) {
    return super.getField(e, h.DT);
  }
  setDt(e, t) {
    super.setField(e, h.DT, t);
  }
  // === Angles Accessors ===
  getBearing(e) {
    return super.getField(e, h.BEARING);
  }
  setBearing(e, t) {
    super.setField(e, h.BEARING, t);
  }
  // === 🏔️ Elevation Accessors ===
  getElevation(e) {
    return super.getField(e, h.ELEVATION);
  }
  setElevation(e, t) {
    super.setField(e, h.ELEVATION, t);
  }
  // === 📐 Grade Accessors ===
  getGrade(e) {
    return super.getField(e, h.GRADE);
  }
  setGrade(e, t) {
    super.setField(e, h.GRADE, t);
  }
  // === Radius Accessors ===
  getRadius(e) {
    return super.getField(e, h.RADIUS);
  }
  setRadius(e, t) {
    super.setField(e, h.RADIUS, t);
  }
  // === Aero coef Accessors ===
  getAeroCoef(e) {
    return super.getField(e, h.AERO_COEF);
  }
  setAeroCoef(e, t) {
    super.setField(e, h.AERO_COEF, t);
  }
  // === Cyclist wind Accessors ===
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
  // === ⚡ Power Physics Accessors ===
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
  // === ⚡ Power Cyclist Accessors ===
  getPInputPower(e) {
    return super.getField(e, h.P_INPUT_POWER);
  }
  setPInputPower(e, t) {
    super.setField(e, h.P_INPUT_POWER, t);
  }
  getPCyclistProvidedOptimalPower(e) {
    return super.getField(e, h.P_CYCLIST_PROVIDED_OPTIMAL_POWER);
  }
  setPCyclistProvidedOptimalPower(e, t) {
    super.setField(e, h.P_CYCLIST_PROVIDED_OPTIMAL_POWER, t);
  }
  getPCyclistProvidedOptimalPowerWithHarmonics(e) {
    return super.getField(e, h.P_CYCLIST_PROVIDED_OPTIMAL_POWER_HARMONICS);
  }
  setPCyclistProvidedOptimalPowerWithHarmonics(e, t) {
    super.setField(e, h.P_CYCLIST_PROVIDED_OPTIMAL_POWER_HARMONICS, t);
  }
  getPCyclistPowerNeeded(e) {
    return super.getField(e, h.P_CYCLIST_PROVIDED_POWER_NEEDED);
  }
  setPCyclistPowerNeeded(e, t) {
    super.setField(e, h.P_CYCLIST_PROVIDED_POWER_NEEDED, t);
  }
  getPCyclistProvidedMuscular(e) {
    return super.getField(e, h.P_CYCLIST_PROVIDED_MUSCULAR);
  }
  setPCyclistProvidedMuscular(e, t) {
    super.setField(e, h.P_CYCLIST_PROVIDED_MUSCULAR, t);
  }
  getPCyclistProvidedWheel(e) {
    return super.getField(e, h.P_CYCLIST_PROVIDED_WHEEL);
  }
  setPCyclistProvidedWheel(e, t) {
    super.setField(e, h.P_CYCLIST_PROVIDED_WHEEL, t);
  }
  // === ⚡ Power Post processed Accessors ===
  getPComputedTotalPower(e) {
    return super.getField(e, h.P_COMPUTED_TOTAL_POWER);
  }
  setPComputedTotalPower(e, t) {
    super.setField(e, h.P_COMPUTED_TOTAL_POWER, t);
  }
  getPComputedWheelPower(e) {
    return super.getField(e, h.P_COMPUTED_WHEEL_POWER);
  }
  setPComputedWheelPower(e, t) {
    super.setField(e, h.P_COMPUTED_WHEEL_POWER, t);
  }
  getPComputedPower(e) {
    return super.getField(e, h.POWER);
  }
  setPComputedPower(e, t) {
    super.setField(e, h.POWER, t);
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
   * @param data Complete point data with all 36 properties
   * @returns The index of the newly added point
   */
  addPoint(e) {
    const t = this.pointCount;
    return this.ensureCapacity(t + 1), this.pointCount++, this.setLatitude(t, e.latitude), this.setLongitude(t, e.longitude), this.setDistance(t, e.distance), this.setDx(t, e.dx), this.setTime(t, e.time), this.setElapsed(t, e.elapsed), this.setDt(t, e.dt), this.setBearing(t, e.bearing), this.setElevation(t, e.elevation), this.setGrade(t, e.grade), this.setRadius(t, e.radius), this.setAeroCoef(t, e.aeroCoef), this.setWindBearing(t, e.windBearing), this.setWindAlpha(t, e.windAlpha), this.setPAero(t, e.pAero), this.setPGravity(t, e.pGravity), this.setPRollingResistance(t, e.pRollingResistance), this.setPWheelBearings(t, e.pWheelBearings), this.setPInputPower(t, e.pInputPower), this.setPCyclistProvidedOptimalPower(t, e.pCyclistProvidedOptimalPower), this.setPCyclistProvidedOptimalPowerWithHarmonics(
      t,
      e.pCyclistProvidedOptimalPowerWithHarmonics
    ), this.setPCyclistPowerNeeded(t, e.pCyclistPowerNeeded), this.setPCyclistProvidedMuscular(t, e.pCyclistProvidedMuscular), this.setPCyclistProvidedWheel(t, e.PCyclistProvidedWheel), this.setPComputedTotalPower(t, e.pComputedTotalPower), this.setPComputedWheelPower(t, e.pComputedWheelPower), this.setPComputedPower(t, e.pComputedPower), this.setSpeed(t, e.speed), this.setSpeedMax(t, e.speedMax), this.setSpeedMaxIncline(t, e.speedMaxIncline), this.setVirtSpeedCurrent(t, e.virtSpeedCurrent), this.setTemperature(t, e.temperature), this.setWindSpeed(t, e.windSpeed), this.setWindDirection(t, e.windDirection), this.setHeartRate(t, e.heartRate), this.setCadence(t, e.cadence), t;
  }
  /**
   * Gets all data for a specific point.
   */
  getPointData(e) {
    return {
      // Coordinates
      latitude: this.getLatitude(e),
      longitude: this.getLongitude(e),
      distance: this.getDistance(e),
      dx: this.getDx(e),
      // Temporal
      time: this.getTime(e),
      elapsed: this.getElapsed(e),
      dt: this.getDt(e),
      // Angles
      bearing: this.getBearing(e),
      // 🏔️ Elevation
      elevation: this.getElevation(e),
      // 📐 Grade
      grade: this.getGrade(e),
      // Radius
      radius: this.getRadius(e),
      // Aero coef
      aeroCoef: this.getAeroCoef(e),
      // Cyclist wind
      windBearing: this.getWindBearing(e),
      windAlpha: this.getWindAlpha(e),
      // ⚡ Power Physics
      pAero: this.getPAero(e),
      pGravity: this.getPGravity(e),
      pRollingResistance: this.getPRollingResistance(e),
      pWheelBearings: this.getPWheelBearings(e),
      // ⚡ Power Cyclist
      pInputPower: this.getPInputPower(e),
      pCyclistProvidedOptimalPower: this.getPCyclistProvidedOptimalPower(e),
      pCyclistProvidedOptimalPowerWithHarmonics: this.getPCyclistProvidedOptimalPowerWithHarmonics(e),
      pCyclistPowerNeeded: this.getPCyclistPowerNeeded(e),
      pCyclistProvidedMuscular: this.getPCyclistProvidedMuscular(e),
      PCyclistProvidedWheel: this.getPCyclistProvidedWheel(e),
      // ⚡ Power Post processed
      pComputedTotalPower: this.getPComputedTotalPower(e),
      pComputedWheelPower: this.getPComputedWheelPower(e),
      pComputedPower: this.getPComputedPower(e),
      // Speed & Motion
      speed: this.getSpeed(e),
      speedMax: this.getSpeedMax(e),
      speedMaxIncline: this.getSpeedMaxIncline(e),
      virtSpeedCurrent: this.getVirtSpeedCurrent(e),
      // Environmental
      temperature: this.getTemperature(e),
      windSpeed: this.getWindSpeed(e),
      windDirection: this.getWindDirection(e),
      // Physiological
      heartRate: this.getHeartRate(e),
      cadence: this.getCadence(e)
    };
  }
}
class L extends lt {
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
        latitude: G(this.getLatitude(e)),
        longitude: G(this.getLongitude(e)),
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
    const i = [];
    for (let s = 0; s < t; s++)
      i.push(this.getPointData(e + s));
    return i;
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
        const t = this.getLatitude(e), i = this.getLongitude(e), s = this.getElevation(e);
        if (this.minLat = Math.min(this.minLat, t), this.maxLat = Math.max(this.maxLat, t), this.minLon = Math.min(this.minLon, i), this.maxLon = Math.max(this.maxLon, i), this.minElevation = Math.min(this.minElevation, s), this.maxElevation = Math.max(this.maxElevation, s), e > 0) {
          const n = this.getLatitude(e - 1), r = this.getLongitude(e - 1), o = this.getElevation(e - 1), c = this.distanceTo(n, r, t, i);
          this.totalDistance += c;
          const l = s - o;
          l > 0 ? this.totalElevationGain += l : this.totalElevationLoss += l;
        }
        this.setDistance(e, this.totalDistance);
      }
      for (let e = 0; e < this.pointCount; e++) {
        const t = this.getDistance(e), i = this.getElevation(e), s = this.getTime(e);
        if (this.setElapsed(e, (s - this.timeStart) / 1e3), this.pointCount > 0) {
          const n = Math.max(0, e - 1), r = Math.min(this.pointCount - 1, e + 1);
          this.setBearing(e, this.computeBearing(n, r));
          const o = this.getDistance(r) - this.getDistance(n), l = (this.getElevation(r) - this.getElevation(n)) / o;
          this.setGrade(e, l);
        }
        if (e === 0) {
          if (this.setSpeed(0, ne), e + 1 < this.pointCount) {
            const n = t - this.getDistance(e + 1), o = (i - this.getElevation(e + 1)) / n;
            this.setGrade(e, o), this.setBearing(e, this.computeBearing(0, 1));
          }
          this.setDx(e, 0), this.setDt(e, 0);
        }
        if (e > 0) {
          const n = e - 1, r = t - this.getDistance(n), o = s - this.getTime(n), c = r * 1e3 / o;
          this.setSpeed(e, c), this.setDx(e, r), this.setDt(e, o);
        }
      }
    }
  }
  computeBearing(e, t) {
    const i = this.getLatitude(e), s = this.getLongitude(e), n = this.getLatitude(t), r = this.getLongitude(t), o = this.project(i, s), c = this.project(n, r), l = c.y - o.y, u = c.x - o.x;
    return Math.atan2(-l, u);
  }
  /**
   * Calculate distance between two points using Haversine formula.
   * @param lat1 Latitude of first point (radians)
   * @param lon1 Longitude of first point (radians)
   * @param lat2 Latitude of second point (radians)
   * @param lon2 Longitude of second point (radians)
   * @returns Distance in meters
   */
  distanceTo(e, t, i, s) {
    const r = e, o = i, c = i - e, l = s - t, u = Math.sin(c / 2) * Math.sin(c / 2) + Math.cos(r) * Math.cos(o) * Math.sin(l / 2) * Math.sin(l / 2);
    return 6371e3 * (2 * Math.atan2(Math.sqrt(u), Math.sqrt(1 - u)));
  }
  /**
   * Simple coordinate projection to Cartesian coordinates for bearing calculation.
   * @param latitude Latitude in radians
   * @param longitude Longitude in radians
   * @returns Projected x,y coordinates
   */
  project(e, t) {
    return {
      x: t * Math.cos(e),
      y: e
    };
  }
  /**
   * PERFORMANCE OPTIMIZATION: Directly interpolate between two points and write to a new index.
   * Avoids creating intermediate Point objects.
   *
   * @param targetIndex Index where interpolated point will be written (must be valid)
   * @param index1 First source point index
   * @param index2 Second source point index
   * @param coef Interpolation coefficient (0 = index1, 1 = index2)
   * @param fieldsToInterpolate Array of PointField values to interpolate (others will be NaN)
   */
  addInterpolatedFrom(e, t, i, s, n) {
    const r = this.pointCount;
    this.ensureCapacity(r + 1), this.pointCount++;
    const o = Math.floor(t / this.CHUNK_SIZE), l = t % this.CHUNK_SIZE * S, u = e.chunks[o], d = Math.floor(i / this.CHUNK_SIZE), m = i % this.CHUNK_SIZE * S, C = e.chunks[d], D = Math.floor(r / this.CHUNK_SIZE), A = r % this.CHUNK_SIZE * S, k = this.chunks[D];
    for (const W of n) {
      const B = u[l + W], le = C[m + W];
      isNaN(B) || isNaN(le) ? k[A + W] = NaN : k[A + W] = B + (le - B) * s;
    }
    return r;
  }
  addFrom(e, t, i) {
    const s = this.pointCount;
    this.ensureCapacity(s + 1), this.pointCount++;
    const n = Math.floor(t / this.CHUNK_SIZE), o = t % this.CHUNK_SIZE * S, c = e.chunks[n], l = Math.floor(s / this.CHUNK_SIZE), d = s % this.CHUNK_SIZE * S, g = this.chunks[l];
    for (const m of i)
      g[d + m] = c[o + m];
    return s;
  }
}
const ht = new Qe();
class ut {
  static async fixElevation(e, t = !0) {
    let i = Array.from(e.coordinatesIterator());
    t && await ht.setElevations(i), i = De.smooth(i, 150);
    const s = new L(e.name);
    for (let n = 0; n < e.length; n++) {
      const r = e.getPointData(n), o = i[n];
      s.addPoint({
        ...r,
        elevation: o.elevation
      });
    }
    return s.computeDerivedData(), s;
  }
}
class dt {
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
    const t = e.path, i = e.cyclist, s = t.getPointCount();
    for (let n = 0; n < s; n++)
      n === 0 ? t.setSpeedMax(n, i.getMaxSpeedMs()) : n === s - 1 ? t.setSpeedMax(n, 2) : this.computeMaxSpeedByIncline(e, n), t.setSpeedMaxIncline(n, t.getSpeedMax(n));
  }
  /**
   * Second pass: Apply braking constraints working backwards through the path.
   * Ensures that the cyclist can brake safely from any speed to the required
   * speed at the next point.
   *
   * @param course Course to process
   */
  static secondPass(e) {
    const i = e.path.getPointCount();
    for (let s = i - 1; s > 0; s--)
      this.computeMaxSpeedByBraking(e, s - 1, s);
  }
  static computeRadiusWindowed(e, t, i = 2) {
    const s = Math.max(0, t - i), n = Math.min(e.length - 1, t + i), r = this.normalizeAngleDiff(
      e.getBearing(n) - e.getBearing(s)
    ), o = e.getDistance(n) - e.getDistance(s);
    if (Math.abs(r) < 1e-3)
      return 150;
    const c = o / Math.abs(r);
    return Math.max(5, Math.min(150, c));
  }
  static normalizeAngleDiff(e) {
    for (; e > Math.PI; )
      e -= 2 * Math.PI;
    for (; e < -Math.PI; )
      e += 2 * Math.PI;
    return e;
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
  static computeMaxSpeedByIncline(e, t) {
    const i = e.path, s = e.cyclist, n = this.computeRadiusWindowed(i, t, 10);
    i.setRadius(t, n);
    const r = Math.sqrt(9.8 * n * s.getTanMaxAngle());
    i.setSpeedMax(t, Math.min(s.getMaxSpeedMs(), r));
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
  static computeMaxSpeedByBraking(e, t, i) {
    const s = e.path, n = e.cyclist, r = s.getSpeedMax(t), o = s.getSpeedMax(i), c = -n.getMaxBrakeMS2();
    if (o >= r)
      return;
    const l = s.getDistance(i) - s.getDistance(t);
    if ((o * o - r * r) / (2 * c) <= l)
      return;
    const d = Math.sqrt(o * o - 2 * c * l);
    s.setSpeedMax(t, d);
  }
}
class mt {
  /**
   * Calculates the constant aerodynamic coefficient.
   *
   * @param course The course configuration containing cyclist and environmental parameters
   * @param path The path containing point data
   * @param pointIndex The index of the current point
   * @returns Aerodynamic coefficient in kg/m
   */
  getAeroCoef(e, t, i) {
    const s = e.rhoProvider.getRho(e, t, i);
    return e.cyclist.cd * e.cyclist.a * s / 2;
  }
}
const pt = new mt();
class gt {
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
  getPowerW(e, t, i) {
    const s = e.aeroProvider.getAeroCoef(e, t, i);
    t.setAeroCoef(i, s);
    const n = e.windProvider.getWind(e, t, i);
    let r;
    if (n.windSpeed === 0) {
      const o = t.getSpeed(i);
      r = -s * o * o * o;
    } else
      r = this.computePAirWithWind(t, i, s, n);
    return t.setPAero(i, r), r;
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
  computePAirWithWind(e, t, i, s) {
    const n = e.getSpeed(t), r = e.getBearing(t);
    e.setWindSpeed(t, s.windSpeed), e.setWindDirection(t, s.windDirection);
    const o = Math.PI / 2 - s.windDirection;
    e.setWindBearing(t, o);
    const c = o - r;
    e.setWindAlpha(t, c);
    const l = s.windSpeed, u = n + l * Math.cos(c), d = u * u, g = n * n + l * l + 2 * n * l * Math.cos(c), m = d / g, D = m + 1.2 * (1 - m);
    return -i * D * Math.sqrt(g) * u * n;
  }
}
const Et = new gt();
class Pt {
  getRho(e, t, i) {
    return be;
  }
}
const Yt = new Pt();
class ft {
  getRho(e, t, i) {
    const s = t.getTemperature(i), n = isNaN(s) ? 15 : s, r = t.getElevation(i), o = isNaN(r) ? 0 : r, c = 101325, l = 288.15, u = 9.80665, d = 65e-4, g = 287.05, m = n + 273.15;
    return c * Math.pow(1 - d * o / l, u / (g * d)) / (g * m);
  }
}
const wt = new ft();
class Ct {
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
  getWind(e, t, i) {
    return this.wind;
  }
}
class Dt extends Ct {
  /**
   * Creates a wind provider with zero wind speed.
   */
  constructor() {
    super({ windSpeed: 0, windDirection: 0 });
  }
}
const Nt = new Dt(), I = class I {
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
      for (let i = 0; i < t.length; i++)
        t[i] = Math.floor(Math.random() * 4294967295);
      for (let i = 0; i < 20; i++) {
        const s = 1 + t[i * 3] / 4294967295 * 9, n = t[i * 3 + 1] / 4294967295 * Math.PI, r = t[i * 3 + 2] / 4294967295 * 0.01;
        this.harmonics.push({ freq: s, d: n, amp: r });
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
  getPowerW(e, t, i) {
    let s = this.getOptimalPower(e, t, i);
    if (t.setPCyclistProvidedOptimalPower(i, s), this.useHarmonics) {
      const o = t.getTime(i) / 1e4;
      for (const c of this.harmonics)
        s += c.amp * s * Math.cos(c.freq * o - c.d);
    }
    t.setPCyclistProvidedOptimalPowerWithHarmonics(i, s);
    const n = -X.INSTANCE.getNewPower(e, t, i, !1);
    return t.setPCyclistPowerNeeded(i, n), s;
  }
  getRealOptimalPower(e, t, i, s) {
    const n = -X.INSTANCE.getNewPower(e, t, i, !1);
    t.setPCyclistPowerNeeded(i, n);
    const r = s * (1 - I.TOLERANCE), o = s * (1 + I.TOLERANCE);
    if (r <= n && n <= o)
      return s;
    if (n < r)
      return s * I.MAX_MULTIPLIER - n / r * s * (I.MAX_MULTIPLIER - 1);
    {
      const c = n - o, l = Math.min(1, Math.max(0, c / o));
      return s - l * s;
    }
  }
};
I.TOLERANCE = 0.05, I.MAX_MULTIPLIER = 3;
let j = I;
class Tt {
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
  getPowerW(e, t, i) {
    let s = e.cyclistPowerProvider.getPowerW(e, t, i);
    return t.setPCyclistProvidedMuscular(i, s), s = s * e.bike.efficiency, t.setPCyclistProvidedWheel(i, s), s;
  }
}
const vt = new Tt();
class Rt extends j {
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
  getOptimalPower(e, t, i) {
    return this.power;
  }
}
class Zt extends j {
  /**
   * Creates a power provider with time-based fatigue.
   *
   * @param duration Duration in seconds after which power stabilizes at 50%
   *                 Typical values: 3600 (1hr), 7200 (2hr), 10800 (3hr)
   */
  constructor(e, t, i) {
    super(t), this.power = e, this.duration = i;
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
  getOptimalPower(e, t, i) {
    const s = this.power, n = t.getElapsed(i) / 1e3, r = Math.max(0.5, 1 - 0.6 * n / this.duration);
    return s * r;
  }
}
class At {
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
  getPowerW(e, t, i) {
    return t.getPInputPower(i);
  }
}
const jt = new At();
class Mt {
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
  getPowerW(e, t, i) {
    const s = e.cyclist.mKg, n = t.getGrade(i), r = t.getSpeed(i), o = Math.sin(Math.atan(n)), c = -s * 9.8 * r * o;
    return t.setPGravity(i, c), c;
  }
}
const It = new Mt();
class St {
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
  getPowerW(e, t, i) {
    const s = e.cyclist.mKg, n = e.bike.crr, r = t.getGrade(i), o = t.getSpeed(i), l = -Math.cos(Math.atan(r)) * s * 9.8 * o * n;
    return t.setPRollingResistance(i, l), l;
  }
}
const _t = new St();
class Lt {
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
  getPowerW(e, t, i) {
    const s = t.getSpeed(i), n = -s * (91 + 8.7 * s) / 1e3;
    return t.setPWheelBearings(i, n), n;
  }
}
const yt = new Lt(), Q = class Q {
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
  getNewPower(e, t, i, s) {
    let n = 0;
    return n += yt.getPowerW(e, t, i), n += _t.getPowerW(e, t, i), n += Et.getPowerW(e, t, i), n += It.getPowerW(e, t, i), s && (n += vt.getPowerW(e, t, i)), n;
  }
  /**
   * Calculates distance traveled given power, mass, speed, and time step.
   *
   * Uses energy conservation to determine new speed, then calculates
   * distance.
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
  getDx(e, t, i, s) {
    return Math.max(
      Math.sqrt(s * e / (0.5 * t) + i * i),
      ne
    ) * s;
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
  getDt(e, t, i, s) {
    let n = 0.1;
    for (; this.getDx(e, t, i, n) <= s; )
      n = n + 0.1;
    return this.getDtInner(e, t, i, s, n - 0.1, n);
  }
  getDtInner(e, t, i, s, n, r) {
    for (; r - n >= s / 1e7; ) {
      const o = (n + r) / 2;
      this.getDx(e, t, i, o) < s ? n = o : r = o;
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
   */
  computeCyclistPower(e, t, i, s) {
    if (s === 0) {
      t.setPComputedPower(s, 0);
      return;
    }
    const n = this.getNewPower(e, t, s - 1, !1), r = t.getSpeed(s - 1), o = t.getSpeed(s), c = t.getDt(s) / 1e3, l = this.getTotPower(i, r, o, c);
    t.setPComputedTotalPower(s, l);
    const u = l - n;
    t.setPComputedWheelPower(s, u);
    const d = Math.max(0, u) / e.bike.efficiency;
    t.setPComputedPower(s, d);
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
  getTotPower(e, t, i, s) {
    return 0.5 * e * (i * i - t * t) / s;
  }
  /**
   * Calculates time difference between two points in seconds.
   *
   * @param path Path containing point data
   * @param pointIndex1 Index of first point
   * @param pointIndex2 Index of second point
   * @returns Time difference in seconds
   */
  getDtBetweenPoints(e, t, i) {
    const s = e.getTime(t);
    return (e.getTime(i) - s) / 1e3;
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
    const t = e.cyclist.mKg, i = e.bike.inertiaFront, s = e.bike.inertiaRear, n = e.bike.wheelRadius, r = i + s;
    return t + r / (n * n);
  }
};
Q.INSTANCE = new Q();
let X = Q;
const xt = Ne("physics/VirtualService"), ae = class ae {
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
    const t = this.powerComputer.getEquivalentMass(e), i = new L(e.path.name), s = e.path, r = s.getAllDistances().length;
    let o = 0, c = s.getPointData(o), l = ne, u = (/* @__PURE__ */ new Date()).getTime();
    const d = u;
    i.addPoint({
      ...c,
      time: u,
      elapsed: 0,
      speed: l,
      virtSpeedCurrent: l
    }), o++;
    let g = 0;
    for (; o < r - 1; ) {
      const m = this.powerComputer.getNewPower(e, i, o - 1, !0), C = s.getDistance(o) - s.getDistance(o - 1);
      let D = this.powerComputer.getDt(m, t, l, C), N = C / D;
      c = s.getPointData(o);
      const A = c.speedMax;
      if (N > A && (N = A, D = C / N), l = N, u += D * 1e3, i.addPoint({
        ...c,
        time: u,
        elapsed: u - d,
        dx: C,
        dt: D * 1e3,
        speed: l,
        virtSpeedCurrent: l
      }), o++, g++ > 1e5) {
        xt.warn("VirtualizeService: Simulation exceeded 100000 iterations, stopping");
        break;
      }
    }
    for (let m = 0; m < i.length - 1; m++)
      this.powerComputer.computeCyclistPower(e, i, t, m);
    return i.computeDerivedData(), i;
  }
};
ae.powerComputer = X.INSTANCE;
let ie = ae;
class ee {
  /**
   * Convert WGS84 coordinates to ECEF coordinates with optional elevation exaggeration
   * @param coordinates - Geographic coordinates with elevation
   * @param zExaggeration - Elevation exaggeration factor (default: 3)
   * @returns ECEF coordinates as Vector3D
   */
  static toEcef(e, t = 3) {
    const i = e.latitude, s = e.longitude, n = isNaN(e.elevation) ? 0 : e.elevation, r = t * n, o = Math.sin(i), c = fe / Math.sqrt(1 - he * o * o), l = Math.cos(i), u = Math.cos(s), d = Math.sin(s), g = (c + r) * l * u, m = (c + r) * l * d, C = (c * (1 - he) + r) * o;
    return new O(g, m, C);
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
  static simplify(e, t, i = 3) {
    if (e.getPointCount() <= 2)
      return e;
    const s = e.getPointCount() - 1, n = new L(e.name);
    n.addPoint(e.getPointData(0));
    const r = this.simplifyRecursive(
      e,
      0,
      s,
      t,
      i
    );
    for (const o of r)
      n.addPoint(o);
    return n.addPoint(e.getPointData(s)), n.computeDerivedData(), n;
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
  static simplifyRecursive(e, t, i, s, n) {
    let r = 0, o = -1;
    const c = [], l = ee.toEcef(e.getPointData(t), n), u = ee.toEcef(e.getPointData(i), n);
    for (let d = t + 1; d < i; d++) {
      const m = ee.toEcef(e.getPointData(d), n).distanceToSegment(l, u);
      m > r && (r = m, o = d);
    }
    if (r > s && o !== -1) {
      if (o - t > 1) {
        const d = this.simplifyRecursive(
          e,
          t,
          o,
          s,
          n
        );
        c.push(...d);
      }
      if (c.push(e.getPointData(o)), i - o > 1) {
        const d = this.simplifyRecursive(
          e,
          o,
          i,
          s,
          n
        );
        c.push(...d);
      }
    }
    return c;
  }
}
class bt {
  constructor() {
  }
  static compute(e, t, i, s = te) {
    const n = e.getPointCount();
    if (n === 0)
      return new L(e.name);
    const r = new L(e.name);
    r.addFrom(e, 0, s);
    let o = e.getDistance(0), c = 0;
    for (let l = 1; l < n; l++) {
      const u = e.getDistance(l), d = u - o;
      if (!(d < t))
        if (d <= i)
          r.addFrom(e, l, s), o = u, c = l;
        else {
          const g = Math.ceil(d / i), m = d / g;
          for (let C = 1; C < g; C++) {
            const D = o + C * m;
            let N = c;
            for (; N < l - 1 && e.getDistance(N + 1) < D; )
              N++;
            const A = N + 1, k = e.getDistance(N), W = e.getDistance(A), B = (D - k) / (W - k);
            r.addInterpolatedFrom(e, N, A, B, s);
          }
          r.addFrom(e, l, s), o = u, c = l;
        }
    }
    return r.computeDerivedData(), r;
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
      return new L(e.name);
    const i = /* @__PURE__ */ new Map();
    for (let s = 0; s < t; s++) {
      const n = e.getTime(s), r = Math.floor(n / 1e3), o = n % 1e3;
      if (s === 0 && o !== 0 && i.set(r, { type: "copy", index: s }), s === t - 1)
        o !== 0 && i.set(r + 1, { type: "copy", index: s });
      else {
        const c = e.getTime(s + 1), l = Math.floor(c / 1e3);
        if (r !== l) {
          const u = c - n, d = o === 0 ? r : r + 1, g = l;
          for (let m = d; m <= g; m++) {
            const N = (m * 1e3 - n) / u;
            i.set(m, {
              type: "interpolate",
              index1: s,
              index2: s + 1,
              coef: N
            });
          }
        }
      }
    }
    return this.createResampledPath(e, i);
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
   * Creates a new path with resampled points.
   */
  static createResampledPath(e, t) {
    const i = new L(e.name), s = Array.from(t.keys()).sort((n, r) => n - r);
    for (const n of s) {
      const r = t.get(n), o = n * 1e3;
      if (r.type === "copy") {
        const c = i.addFrom(e, r.index, te);
        i.setTime(c, o);
      } else {
        const c = i.addInterpolatedFrom(
          e,
          r.index1,
          r.index2,
          r.coef,
          te
        );
        i.setTime(c, o);
      }
    }
    return i.computeDerivedData(), i;
  }
}
const Ut = () => ({
  crr: ve,
  inertiaFront: Re,
  inertiaRear: Ae,
  wheelRadius: Me,
  efficiency: Ie
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
  constructor(e, t, i, s, n) {
    this.crr = e, this.inertiaFront = t, this.inertiaRear = i, this.wheelRadius = s, this.efficiency = n;
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
    return this.getBike(Ut());
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
const Ft = () => ({
  mKg: Se,
  maxBrakeG: Le,
  cd: xe,
  a: Oe,
  maxAngleDeg: we,
  maxSpeedKmH: ye
});
class oe {
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
  constructor(e, t, i, s, n, r) {
    this.mKg = e, this.maxBrakeG = t, this.cd = i, this.a = s, this.maxAngleDeg = n, this.maxSpeedKmH = r;
  }
  static getCyclist(e) {
    return new oe(
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
    return this.getCyclist(Ft());
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
const w = Ne("enhancer/Enhancer"), ce = class ce {
  static getDefaultCourse(e) {
    return {
      path: e,
      bike: re.getDefault(),
      cyclist: oe.getDefault(),
      rhoProvider: wt,
      aeroProvider: pt,
      windProvider: Nt,
      cyclistPowerProvider: new Rt(_e, !1)
    };
  }
  static async enhanceCourseDefault(e) {
    return this.enhanceCourse(this.getDefaultCourse(e));
  }
  static async enhanceCourse(e, t) {
    w.timeLevel(f.INFO, "enhance"), w.info(e);
    const i = {
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
    let s = e.path;
    w.info("Point count : %s", s.length), w.timeLevel(f.INFO, "PointPerDistance.compute"), s = bt.compute(s, 1, 2, this.FIELDS), w.timeEndLevel(f.INFO, "PointPerDistance.compute"), w.info("Point count : %s", s.length), w.timeLevel(f.INFO, "Elevation.fixElevation"), s = await ut.fixElevation(s, i.fixElevation), w.timeEndLevel(f.INFO, "Elevation.fixElevation"), w.info("Point count : %s", s.length);
    const n = { ...e, path: s };
    return (i.computeMaxSpeeds || i.virtualizeTrack) && (w.timeLevel(f.INFO, "MaxSpeedComputer.computeMaxSpeeds"), dt.computeMaxSpeeds(n), w.timeEndLevel(f.INFO, "MaxSpeedComputer.computeMaxSpeeds"), w.info("Point count : %s", s.length)), i.virtualizeTrack && (w.timeLevel(f.INFO, "VirtualizeService.virtualizeTrack"), s = ie.virtualizeTrack(n), w.timeEndLevel(f.INFO, "VirtualizeService.virtualizeTrack"), w.info("Point count : %s", s.length)), i.computeOnePointPerSecond && (w.timeLevel(f.INFO, "PointPerSecond.computeOnePointPerSecond"), s = Wt.computeOnePointPerSecond(s), w.timeEndLevel(f.INFO, "PointPerSecond.computeOnePointPerSecond"), w.info("Point count : %s", s.length)), i.simplifyPath.enable && (w.timeLevel(f.INFO, "DouglasPeucker.simplify"), s = Ot.simplify(
      s,
      i.simplifyPath.tolerance,
      i.simplifyPath.zExaggeration
    ), w.timeEndLevel(f.INFO, "DouglasPeucker.simplify"), w.info("Point count : %s", s.length)), w.timeEndLevel(f.INFO, "enhance"), s;
  }
};
ce.FIELDS = [
  h.LATITUDE,
  h.LONGITUDE,
  h.ELEVATION,
  h.TIME,
  h.P_INPUT_POWER,
  h.SPEED,
  h.TEMPERATURE,
  h.HEART_RATE,
  h.CADENCE
];
let Pe = ce;
const P = {
  GPX: "http://www.topografix.com/GPX/1/1",
  GARMIN_TPX: "http://www.garmin.com/xmlschemas/TrackPointExtension/v1",
  GARMIN_GPX: "http://www.garmin.com/xmlschemas/GpxExtensions/v3",
  CLUETRUST: "http://www.cluetrust.com/XML/GPXDATA/1/0",
  W3C_XSI: "http://www.w3.org/2001/XMLSchema-instance"
}, F = {
  [P.GPX]: "",
  [P.GARMIN_TPX]: "gpxtpx",
  [P.GARMIN_GPX]: "gpxx",
  [P.CLUETRUST]: "gpxdata",
  [P.W3C_XSI]: "xsi"
}, Gt = {
  heartRate: [
    { namespace: P.GARMIN_TPX, localName: "hr", dataType: "number" },
    { namespace: "", localName: "heartrate", dataType: "number" },
    { namespace: "", localName: "hr", dataType: "number" }
  ],
  cadence: [
    { namespace: P.GARMIN_TPX, localName: "cad", dataType: "number" },
    { namespace: P.CLUETRUST, localName: "cadence", dataType: "number" },
    { namespace: "", localName: "cadence", dataType: "number" }
  ],
  temperature: [
    { namespace: P.GARMIN_TPX, localName: "atemp", dataType: "number" },
    { namespace: P.CLUETRUST, localName: "temp", dataType: "number" },
    { namespace: "", localName: "temperature", dataType: "number" }
  ],
  power: [{ namespace: "", localName: "power", dataType: "number" }],
  speed: [{ namespace: P.CLUETRUST, localName: "speed", dataType: "number" }],
  distance: [
    { namespace: P.CLUETRUST, localName: "distance", dataType: "number" }
  ],
  seaLevelPressure: [
    {
      namespace: P.CLUETRUST,
      localName: "seaLevelPressure",
      dataType: "number"
    }
  ],
  verticalSpeed: [
    { namespace: P.CLUETRUST, localName: "verticalSpeed", dataType: "number" }
  ]
};
class kt {
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
    const i = this.findExtensionValue("heartRate", e);
    i !== null && (t.heartRate = Math.round(i));
  }
  /**
   * Parse cadence from various formats:
   * - ns3:cad / gpxtpx:cad (Garmin)
   * - gpxdata:cadence (Cluetrust/Movescount)
   * - cadence (generic)
   */
  parseCadence(e, t) {
    const i = this.findExtensionValue("cadence", e);
    i !== null && (t.cadence = Math.round(i));
  }
  /**
   * Parse temperature from various formats:
   * - gpxtpx:atemp (Garmin ambient temperature)
   * - gpxdata:temp (Cluetrust)
   * - temperature (generic)
   */
  parseTemperature(e, t) {
    const i = this.findExtensionValue("temperature", e);
    i !== null && (t.temperature = i);
  }
  /**
   * Parse power from custom power extensions
   * - power (custom format used in sample.gpx)
   */
  parsePower(e, t) {
    const i = this.findExtensionValue("power", e);
    i !== null && (t.pInputPower = Math.round(i));
  }
  /**
   * Generic method to find extension values using the field mapping
   */
  findExtensionValue(e, t) {
    const i = Gt[e];
    for (const s of i) {
      let n;
      if (s.namespace ? n = this.namespaceResolver.findElementByNamespace(
        t,
        s.localName,
        s.namespace
      ) : n = t.querySelector(s.localName), n && n.textContent) {
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
    const i = this.namespaceResolver.findElementByNamespace(
      e,
      "TrackPointExtension",
      P.GARMIN_TPX
    );
    if (!i)
      return;
    const s = this.namespaceResolver.findElementByNamespace(
      i,
      "hr",
      P.GARMIN_TPX
    );
    if (s && s.textContent) {
      const o = parseInt(s.textContent.trim(), 10);
      isNaN(o) || (t.heartRate = o);
    }
    const n = this.namespaceResolver.findElementByNamespace(
      i,
      "cad",
      P.GARMIN_TPX
    );
    if (n && n.textContent) {
      const o = parseInt(n.textContent.trim(), 10);
      isNaN(o) || (t.cadence = o);
    }
    const r = this.namespaceResolver.findElementByNamespace(
      i,
      "atemp",
      P.GARMIN_TPX
    );
    if (r && r.textContent) {
      const o = parseFloat(r.textContent.trim());
      isNaN(o) || (t.temperature = o);
    }
  }
}
class Bt {
  constructor(e) {
    this.prefixToNamespace = /* @__PURE__ */ new Map(), this.namespaceToPrefix = /* @__PURE__ */ new Map(), this.extractNamespaces(e.documentElement);
  }
  /**
   * Extract all namespace declarations from the XML document.
   * Builds bidirectional mapping between prefixes and namespace URIs.
   */
  extractNamespaces(e) {
    const t = e.attributes;
    for (let i = 0; i < t.length; i++) {
      const s = t[i];
      if (s.name === "xmlns")
        this.registerNamespace("", s.value);
      else if (s.name.startsWith("xmlns:")) {
        const n = s.name.substring(6);
        this.registerNamespace(n, s.value);
      }
    }
  }
  /**
   * Register a namespace prefix and URI mapping
   */
  registerNamespace(e, t) {
    if (this.prefixToNamespace.set(e, t), !this.namespaceToPrefix.has(t)) {
      const i = F[t];
      this.namespaceToPrefix.set(t, i || e);
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
  findElementByNamespace(e, t, i) {
    if (!this.hasNamespace(i))
      return null;
    const s = e.children;
    for (let n = 0; n < s.length; n++) {
      const r = s[n];
      if (this.elementMatches(r, t, i))
        return r;
    }
    return null;
  }
  /**
   * Check if an element matches the given local name and namespace
   */
  elementMatches(e, t, i) {
    const s = e.tagName, n = s.indexOf(":");
    return n === -1 ? s.toLowerCase() === t.toLowerCase() ? this.getElementNamespace(e) === i : !1 : s.substring(n + 1).toLowerCase() === t.toLowerCase() ? this.getElementNamespace(e) === i : !1;
  }
  /**
   * Get the namespace URI for an element based on its prefix
   */
  getElementNamespace(e) {
    const t = e.tagName, i = t.indexOf(":");
    if (i === -1)
      return this.getNamespaceUri("");
    {
      const s = t.substring(0, i);
      return this.getNamespaceUri(s);
    }
  }
}
class Te {
  /**
   * Parse GPX XML content into structured data
   */
  parse(e) {
    const i = new DOMParser().parseFromString(e, "text/xml"), s = i.querySelector("parsererror");
    if (s)
      throw new Error(`XML parsing error: ${s.textContent}`);
    this.namespaceResolver = new Bt(i), this.extensionParser = new kt(this.namespaceResolver);
    const n = i.documentElement;
    if (!n || n.tagName !== "gpx")
      throw new Error("Invalid GPX file: missing gpx root element");
    const r = {
      name: "noname",
      tracks: []
    }, o = n.querySelector("metadata");
    if (o) {
      const l = o.querySelector("name");
      l?.textContent && (r.name = l.textContent.trim());
    }
    const c = n.querySelectorAll("trk");
    for (let l = 0; l < c.length; l++) {
      const u = this.parseTrack(c[l]);
      r.tracks.push(u);
    }
    return r;
  }
  /**
   * Parse a GPX track element
   */
  parseTrack(e) {
    const t = new L("noname"), i = e.querySelector("name");
    i?.textContent && (t.name = i.textContent.trim());
    const s = e.querySelectorAll("trkseg");
    for (let n = 0; n < s.length; n++)
      this.parseTrackSegment(t, s[n]);
    return t.computeDerivedData(), t;
  }
  /**
   * Parse a GPX track segment element
   */
  parseTrackSegment(e, t) {
    const i = t.querySelectorAll("trkpt");
    for (let s = 0; s < i.length; s++) {
      const n = this.parseTrackPoint(i[s]);
      e.addPoint(n);
    }
  }
  /**
   * Parse a GPX track point element
   */
  parseTrackPoint(e) {
    const t = { ...st }, i = e.getAttribute("lat"), s = e.getAttribute("lon");
    if (!i || !s)
      throw new Error("Invalid track point: missing latitude or longitude attribute");
    const n = parseFloat(i), r = parseFloat(s);
    if (isNaN(n) || isNaN(r))
      throw new Error("Invalid track point: latitude or longitude is not a valid number");
    t.latitude = pe(n), t.longitude = pe(r);
    const o = e.querySelector("ele");
    if (o?.textContent) {
      const u = parseFloat(o.textContent.trim());
      isNaN(u) || (t.elevation = u);
    }
    const c = e.querySelector("time");
    if (c?.textContent)
      try {
        t.time = new Date(c.textContent.trim()).getTime();
      } catch {
      }
    const l = e.querySelector("extensions");
    return l && this.extensionParser.parseExtensions(l, t), { ...t };
  }
  /**
   * Static method to quickly parse GPX content
   */
  static parse(e) {
    return new Te().parse(e);
  }
}
class se {
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
    const t = this.createDocument(), i = this.createGPXElement(t), s = this.createMetadataElement(t, e);
    i.appendChild(s);
    for (const o of e.tracks) {
      const c = this.createTrackElement(t, o);
      i.appendChild(c);
    }
    t.appendChild(i);
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
    return t.setAttribute("version", "1.1"), t.setAttribute("creator", "@glandais/virtual-cyclist"), t.setAttribute("xmlns", P.GPX), t.setAttribute("xmlns:xsi", P.W3C_XSI), t.setAttribute(
      `xmlns:${F[P.GARMIN_TPX]}`,
      P.GARMIN_TPX
    ), t.setAttribute(
      "xsi:schemaLocation",
      `${P.GPX} http://www.topografix.com/GPX/1/1/gpx.xsd`
    ), t;
  }
  /**
   * Create metadata element
   */
  createMetadataElement(e, t) {
    const i = e.createElement("metadata");
    if (t.name) {
      const s = e.createElement("name");
      s.textContent = t.name, i.appendChild(s);
    }
    return i;
  }
  /**
   * Create track element
   */
  createTrackElement(e, t) {
    const i = e.createElement("trk");
    if (t.name) {
      const n = e.createElement("name");
      n.textContent = t.name, i.appendChild(n);
    }
    const s = e.createElement("trkseg");
    for (const n of t) {
      const r = this.createTrackPointElement(e, n);
      s.appendChild(r);
    }
    return i.appendChild(s), i;
  }
  /**
   * Create track point element with extensions
   */
  createTrackPointElement(e, t) {
    const i = e.createElement("trkpt");
    if (i.setAttribute("latitude", G(t.latitude).toString()), i.setAttribute("longitude", G(t.longitude).toString()), !isNaN(t.elevation)) {
      const n = e.createElement("elevation");
      n.textContent = t.elevation.toString(), i.appendChild(n);
    }
    if (!isNaN(t.time)) {
      const n = e.createElement("time");
      n.textContent = new Date(t.time).toISOString(), i.appendChild(n);
    }
    const s = this.createExtensionsElement(e, t);
    return s.hasChildNodes() && i.appendChild(s), i;
  }
  /**
   * Create extensions element with proper namespace handling
   */
  createExtensionsElement(e, t) {
    const i = e.createElement("extensions"), s = e.createElement(
      `${F[P.GARMIN_TPX]}:TrackPointExtension`
    );
    if (!isNaN(t.heartRate)) {
      const n = e.createElement(
        `${F[P.GARMIN_TPX]}:hr`
      );
      n.textContent = Math.round(t.heartRate).toString(), s.appendChild(n);
    }
    if (!isNaN(t.cadence)) {
      const n = e.createElement(
        `${F[P.GARMIN_TPX]}:cad`
      );
      n.textContent = Math.round(t.cadence).toString(), s.appendChild(n);
    }
    if (!isNaN(t.temperature)) {
      const n = e.createElement(
        `${F[P.GARMIN_TPX]}:atemp`
      );
      n.textContent = t.temperature.toString(), s.appendChild(n);
    }
    if (s.hasChildNodes() && i.appendChild(s), !isNaN(t.pInputPower)) {
      const n = e.createElement("power");
      n.textContent = Math.round(t.pInputPower).toString(), i.appendChild(n);
    }
    return i;
  }
  /**
   * Format XML with indentation (basic implementation)
   */
  formatXML(e) {
    const t = [], i = /(>)(<)(\/*)(?=\w)/g;
    e = e.replace(i, `$1
$2$3`);
    let s = 0;
    const n = e.split(`
`);
    for (const r of n) {
      let o = 0;
      r.match(/.+<\/\w[^>]*>$/) ? o = 0 : r.match(/^<\/\w/) ? s !== 0 && (s -= 1) : r.match(/^<\w[^>]*[^/]>.*$/) ? o = 1 : o = 0, t.push("  ".repeat(s) + r), s += o;
    }
    return t.join(`
`);
  }
  /**
   * Static method to quickly write GPX from Path
   */
  static writeFromPath(e) {
    return new se().writeFromPath(e);
  }
  /**
   * Static method to quickly write GPX data
   */
  static write(e) {
    return new se().write(e);
  }
}
export {
  ot as ALL_FIELDS,
  nt as AbstractPath,
  re as Bike,
  Ht as CIRC,
  oe as Cyclist,
  j as CyclistPowerProviderBase,
  be as DEFAULT_AIR_DENSITY,
  ve as DEFAULT_CRR,
  Se as DEFAULT_CYCLIST_MASS_KG,
  _e as DEFAULT_CYCLIST_POWER_W,
  xe as DEFAULT_DRAG_COEFFICIENT,
  Ie as DEFAULT_DRIVETRAIN_EFFICIENCY,
  Oe as DEFAULT_FRONTAL_AREA,
  Re as DEFAULT_INERTIA_FRONT,
  Ae as DEFAULT_INERTIA_REAR,
  Le as DEFAULT_MAX_BRAKE_G,
  we as DEFAULT_MAX_LEAN_ANGLE_DEG,
  Vt as DEFAULT_MAX_LEAN_ANGLE_RAD,
  ye as DEFAULT_MAX_SPEED_KMH,
  Me as DEFAULT_WHEEL_RADIUS,
  Xt as DT,
  Ot as DouglasPeucker,
  st as EMPTY_POINT,
  ee as EcefConverter,
  ut as Elevation,
  Pe as Enhancer,
  S as FIELDS_PER_POINT,
  rt as FIELD_DEFINITIONS,
  he as FIRST_ECCENTRICITY_SQUARED,
  zt as G,
  Te as GPXParser,
  se as GPXWriter,
  lt as GeneratedPath,
  f as LogLevel,
  ct as Logger,
  ne as MINIMAL_SPEED,
  dt as MaxSpeedComputer,
  te as POINT_FIELDS,
  L as Path,
  h as PointField,
  bt as PointPerDistance,
  Wt as PointPerSecond,
  X as PowerComputer,
  Rt as PowerProviderConstant,
  Zt as PowerProviderConstantWithTiring,
  fe as SEMI_MAJOR_AXIS,
  Kt as TOTAL_FIELD_COUNT,
  O as Vector3D,
  ie as VirtualizeService,
  Ct as WindProviderConstant,
  Et as aeroPowerProvider,
  pt as aeroProviderConstant,
  Ne as createLogger,
  qt as fieldToPointField,
  Ut as getDefaultBikeProperties,
  Ft as getDefaultCyclistProperties,
  It as gravPowerProvider,
  vt as muscularPowerProvider,
  jt as powerProviderFromData,
  Yt as rhoProviderDefault,
  wt as rhoProviderEstimate,
  _t as rollingResistancePowerProvider,
  G as toDegrees,
  pe as toRadians,
  yt as wheelBearingsPowerProvider,
  Nt as windProviderNone
};
//# sourceMappingURL=index.esm.js.map
