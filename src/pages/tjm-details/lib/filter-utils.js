/**
 * @file TJM xonalarni filtrlash uchun sof yordamchi funksiyalar.
 * @module pages/tjm-details/lib/filter-utils
 *
 * Barcha funksiyalar sof (pure) — hech qanday side-effect yo'q.
 * Web Worker va asosiy thread ikkalasida ham ishlatilishi mumkin.
 */

/**
 * URL query parametr kalitlari.
 * @type {Record<string, string>}
 */
export const FILTER_QUERY_KEYS = {
  rooms: "f_rooms",
  statuses: "f_status",
  size: "f_size",
  price: "f_price",
  floor: "f_floor",
};

/**
 * min/max qiymatlarni [min, max] sifatida normalizatsiya qiladi.
 * @param {number} min
 * @param {number} max
 * @returns {[number, number]}
 */
export function normalizeBounds(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [0, 0];
  }

  return [Math.min(min, max), Math.max(min, max)];
}

/**
 * Range ni bounds ichiga qisqartiradi (clamp).
 * @param {[number, number]|undefined} range
 * @param {[number, number]} bounds
 * @returns {[number, number]}
 */
export function clampRange(range, bounds) {
  const minBound = Math.min(bounds[0], bounds[1]);
  const maxBound = Math.max(bounds[0], bounds[1]);
  const rawStart = Array.isArray(range) ? range[0] : minBound;
  const rawEnd = Array.isArray(range) ? range[1] : maxBound;
  const start = Number.isFinite(rawStart) ? rawStart : minBound;
  const end = Number.isFinite(rawEnd) ? rawEnd : maxBound;
  const nextStart = Math.max(minBound, Math.min(start, maxBound));
  const nextEnd = Math.max(minBound, Math.min(end, maxBound));

  return nextStart <= nextEnd ? [nextStart, nextEnd] : [nextEnd, nextStart];
}

/**
 * Range to'liq bounds da turganini tekshiradi.
 * @param {[number, number]|undefined} range
 * @param {[number, number]} bounds
 * @returns {boolean}
 */
export function isRangeAtBounds(range, bounds) {
  if (!Array.isArray(range)) return false;
  return range[0] === bounds[0] && range[1] === bounds[1];
}

/**
 * Range bounds dan farq qilib turganini tekshiradi (filter faol mi).
 * @param {[number, number]|undefined} range
 * @param {[number, number]} bounds
 * @returns {boolean}
 */
export function isRangeActive(range, bounds) {
  if (!Array.isArray(range)) return false;
  return range[0] > bounds[0] || range[1] < bounds[1];
}

/**
 * Bounds asosida standart filter qiymatlarini qaytaradi.
 * @param {{ size: [number,number], price: [number,number], floor: [number,number] }} bounds
 * @returns {object}
 */
export function buildDefaultFilters(bounds) {
  return {
    rooms: [],
    statuses: [],
    sizeRange: [...bounds.size],
    priceRange: [...bounds.price],
    floorRange: [...bounds.floor],
  };
}

/**
 * Filter obyektining chuqur nusxasini yaratadi.
 * @param {object|null} filters
 * @returns {object|null}
 */
export function cloneFilters(filters) {
  if (!filters) return null;
  return {
    rooms: [...(filters.rooms ?? [])],
    statuses: [...(filters.statuses ?? [])],
    sizeRange: [...(filters.sizeRange ?? [0, 0])],
    priceRange: [...(filters.priceRange ?? [0, 0])],
    floorRange: [...(filters.floorRange ?? [0, 0])],
  };
}

/**
 * Filter ni yangi bounds ga moslashtiradi.
 * prevBounds mavjud bo'lsa — ranges ni eski bounds da edimi? Yangi bounds ga ko'chiradi.
 * @param {object|null} filters
 * @param {{ size, price, floor }} bounds
 * @param {{ size, price, floor }|undefined} [prevBounds]
 * @returns {object}
 */
export function normalizeFilters(filters, bounds, prevBounds) {
  if (!filters) {
    return buildDefaultFilters(bounds);
  }

  const next = {
    rooms: Array.isArray(filters.rooms) ? filters.rooms : [],
    statuses: Array.isArray(filters.statuses) ? filters.statuses : [],
    sizeRange: clampRange(filters.sizeRange, bounds.size),
    priceRange: clampRange(filters.priceRange, bounds.price),
    floorRange: clampRange(filters.floorRange, bounds.floor),
  };

  if (prevBounds) {
    if (isRangeAtBounds(filters.sizeRange, prevBounds.size)) {
      next.sizeRange = [...bounds.size];
    }
    if (isRangeAtBounds(filters.priceRange, prevBounds.price)) {
      next.priceRange = [...bounds.price];
    }
    if (isRangeAtBounds(filters.floorRange, prevBounds.floor)) {
      next.floorRange = [...bounds.floor];
    }
  }

  return next;
}

/**
 * URL query string dan list parametrini parse qiladi.
 * @param {string|null} value
 * @returns {string[]}
 */
export function parseListParam(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * URL query string dan range parametrini parse qiladi.
 * @param {string|null} value
 * @returns {[number, number]|undefined}
 */
export function parseRangeParam(value) {
  if (!value) return undefined;
  const [min, max] = value.split(",");
  if (min === undefined || max === undefined) return undefined;
  const minValue = Number(min);
  const maxValue = Number(max);
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return undefined;
  }
  return [minValue, maxValue];
}

/**
 * URLSearchParams dan filter holatini o'qib, filter obyektini qaytaradi.
 * Hech qanday filter parametri yo'q bo'lsa `null` qaytaradi.
 * @param {URLSearchParams} searchParams
 * @returns {object|null}
 */
export function parseFiltersFromSearch(searchParams) {
  const roomsRaw = searchParams.get(FILTER_QUERY_KEYS.rooms);
  const statusesRaw = searchParams.get(FILTER_QUERY_KEYS.statuses);
  const sizeRaw = searchParams.get(FILTER_QUERY_KEYS.size);
  const priceRaw = searchParams.get(FILTER_QUERY_KEYS.price);
  const floorRaw = searchParams.get(FILTER_QUERY_KEYS.floor);
  const hasFilters = !!(
    roomsRaw ||
    statusesRaw ||
    sizeRaw ||
    priceRaw ||
    floorRaw
  );

  if (!hasFilters) return null;

  return {
    rooms: parseListParam(roomsRaw),
    statuses: parseListParam(statusesRaw),
    sizeRange: parseRangeParam(sizeRaw),
    priceRange: parseRangeParam(priceRaw),
    floorRange: parseRangeParam(floorRaw),
  };
}

/**
 * Range ni URL query string formatiga o'zgartiradi.
 * @param {[number, number]|undefined} range
 * @param {number} [decimals]
 * @returns {string|null}
 */
export function formatRangeParam(range, decimals) {
  if (!Array.isArray(range)) return null;
  const min = Number(range[0]);
  const max = Number(range[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (decimals !== undefined) {
    return `${min.toFixed(decimals)},${max.toFixed(decimals)}`;
  }
  return `${Math.round(min)},${Math.round(max)}`;
}

/**
 * Filtr holatini URL search parametrlariga aylantiradi.
 * Null qiymat — parametrni o'chirish degani.
 * @param {object} filters
 * @param {{ size, price, floor }} bounds
 * @returns {Record<string, string|null>}
 */
export function buildFilterSearchPatch(filters, bounds) {
  return {
    [FILTER_QUERY_KEYS.rooms]: filters.rooms?.length
      ? filters.rooms.join(",")
      : null,
    [FILTER_QUERY_KEYS.statuses]: filters.statuses?.length
      ? filters.statuses.join(",")
      : null,
    [FILTER_QUERY_KEYS.size]: isRangeActive(filters.sizeRange, bounds.size)
      ? formatRangeParam(filters.sizeRange, 2)
      : null,
    [FILTER_QUERY_KEYS.price]: isRangeActive(filters.priceRange, bounds.price)
      ? formatRangeParam(filters.priceRange)
      : null,
    [FILTER_QUERY_KEYS.floor]: isRangeActive(filters.floorRange, bounds.floor)
      ? formatRangeParam(filters.floorRange)
      : null,
  };
}

/**
 * Filtr holatini solishtirishga mo'ljallangan string sifatida serializatsiya qiladi.
 * @param {object} filters
 * @returns {string}
 */
export function serializeFilterState(filters) {
  const rooms = [...(filters.rooms ?? [])].sort();
  const statuses = [...(filters.statuses ?? [])].sort();
  return JSON.stringify({
    rooms,
    statuses,
    sizeRange: filters.sizeRange ?? [],
    priceRange: filters.priceRange ?? [],
    floorRange: filters.floorRange ?? [],
  });
}

/**
 * URLSearchParams ni patch bilan yangilab, search string qaytaradi.
 * @param {string} search - hozirgi location.search
 * @param {Record<string, string|null|undefined>} patch
 * @returns {string} - "?..." yoki ""
 */
export function buildSearch(search, patch) {
  const params = new URLSearchParams(search);

  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  const next = params.toString();
  return next ? `?${next}` : "";
}
