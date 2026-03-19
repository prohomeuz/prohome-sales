let dataset = [];

function normalizeRange(range) {
  if (!Array.isArray(range)) {
    return [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
  }
  const min = Number(range[0]);
  const max = Number(range[1]);
  const safeMin = Number.isFinite(min) ? min : Number.NEGATIVE_INFINITY;
  const safeMax = Number.isFinite(max) ? max : Number.POSITIVE_INFINITY;
  return safeMin <= safeMax ? [safeMin, safeMax] : [safeMax, safeMin];
}

self.onmessage = (event) => {
  const payload = event?.data;
  if (!payload) return;

  if (payload.type === "dataset") {
    dataset = Array.isArray(payload.rooms) ? payload.rooms : [];
    return;
  }

  if (payload.type === "filter") {
    const filters = payload.filters ?? {};
    const matchedIds = [];
    const roomsSet = new Set(
      Array.isArray(filters.rooms) ? filters.rooms.map(String) : [],
    );
    const statusesSet = new Set(
      Array.isArray(filters.statuses) ? filters.statuses : [],
    );
    const hasRooms = roomsSet.size > 0;
    const hasStatuses = statusesSet.size > 0;
    const [sizeMin, sizeMax] = normalizeRange(filters.sizeRange);
    const [priceMin, priceMax] = normalizeRange(filters.priceRange);
    const [floorMin, floorMax] = normalizeRange(filters.floorRange);

    for (const room of dataset) {
      if (!room) continue;
      if (hasRooms && !roomsSet.has(String(room.room))) continue;
      if (hasStatuses && !statusesSet.has(room.status)) continue;

      const size = Number(room.size ?? 0);
      const priceTotal = Number(room.price ?? 0) * Number(room.size ?? 0);
      const floor = Number(room.floor ?? 0);

      if (Number.isFinite(sizeMin) && size < sizeMin) continue;
      if (Number.isFinite(sizeMax) && size > sizeMax) continue;
      if (Number.isFinite(priceMin) && priceTotal < priceMin) continue;
      if (Number.isFinite(priceMax) && priceTotal > priceMax) continue;
      if (Number.isFinite(floorMin) && floor < floorMin) continue;
      if (Number.isFinite(floorMax) && floor > floorMax) continue;

      matchedIds.push(String(room.id));
    }

    self.postMessage({
      type: "result",
      requestId: payload.requestId,
      matchedIds,
    });
  }
};
