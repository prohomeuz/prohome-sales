/**
 * @file DATA layer: single project structure (TJM details).
 * @module entities/project/model/use-project-structure
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

/** @type {Record<string, string>} */
const STATUS_TO_STAT_KEY = {
  SOLD: "totalSold",
  RESERVED: "totalReserved",
  EMPTY: "totalEmpty",
  NOT: "totalNot",
};

const EMPTY_BLOCK_STATISTICS = {
  total: 0,
  totalEmpty: 0,
  totalReserved: 0,
  totalSold: 0,
  totalNot: 0,
};

function getDraftBlocksStorageKey(projectId) {
  return `tjm-draft-blocks:${projectId}`;
}

function normalizeDraftBlock(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const name = String(value.name ?? "").trim();
  const floor = Math.max(1, Math.round(Number(value.floor ?? 1) || 1));
  const homesPerFloor = Math.max(
    1,
    Math.round(Number(value.homesPerFloor ?? 7) || 7),
  );
  const startNumber = Math.max(
    1,
    Math.round(Number(value.startNumber ?? 1) || 1),
  );
  const floorsConfig = Array.isArray(value.floorsConfig)
    ? value.floorsConfig.slice(0, floor).map((row) =>
        Array.isArray(row) && row.length
          ? row.map((count) => Math.min(8, Math.max(1, Math.round(Number(count) || 1))))
          : Array.from({ length: homesPerFloor }, () => 1),
      )
    : Array.from({ length: floor }, () => Array.from({ length: homesPerFloor }, () => 1));

  if (!name) return null;

  return { name, floor, homesPerFloor, startNumber, floorsConfig };
}

function readDraftBlocks(projectId) {
  if (!projectId || typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getDraftBlocksStorageKey(projectId));
    const parsed = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeDraftBlock).filter(Boolean);
  } catch {
    return [];
  }
}

function writeDraftBlocks(projectId, draftBlocks) {
  if (!projectId || typeof window === "undefined") return;

  try {
    if (!draftBlocks.length) {
      window.localStorage.removeItem(getDraftBlocksStorageKey(projectId));
      return;
    }

    window.localStorage.setItem(
      getDraftBlocksStorageKey(projectId),
      JSON.stringify(draftBlocks),
    );
  } catch {
    // localStorage xatolarini jim o'tkazamiz
  }
}

function hasBlockName(blocks, targetName) {
  const normalizedTarget = String(targetName ?? "").trim().toLowerCase();
  return Object.keys(blocks ?? {}).some(
    (blockName) => blockName.trim().toLowerCase() === normalizedTarget,
  );
}

function createDraftRooms({
  name,
  floor,
  homesPerFloor,
  startNumber,
  projectId,
  floorsConfig: rawFloorsConfig,
}) {
  const floorsConfig = Array.from({ length: floor }, (_, index) =>
    Array.isArray(rawFloorsConfig?.[index]) &&
    rawFloorsConfig[index].length
      ? rawFloorsConfig[index]
      : Array.from({ length: homesPerFloor }, () => 1),
  );

  return floorsConfig.map((roomCounts, index) => {
    const floorNumber = floor - index;
    const rowOffset = floorsConfig
      .slice(index + 1)
      .reduce((total, row) => total + row.length, 0);

    return roomCounts.map((roomCount, roomIndex) => {
      const isObj = roomCount && typeof roomCount === "object";
      const roomNum = isObj ? roomCount.room : roomCount;
      const size = isObj ? Number(roomCount.size) || 0 : 0;
      const price = isObj ? Number(roomCount.price) || 0 : 0;
      return {
        id: `draft:${projectId}:${name}:${floorNumber}:${roomIndex + 1}`,
        houseNumber: startNumber + rowOffset + roomIndex,
        room: Math.min(8, Math.max(1, Math.round(Number(roomNum) || 1))),
        status: "NOT",
        size,
        price,
        totalPrice: size * price,
        __draft: true,
      };
    });
  });
}

function padRowsToMaxFloor(rows, floor, targetMaxFloor) {
  const missingRows = Math.max(0, targetMaxFloor - floor);
  return [
    ...Array.from({ length: missingRows }, () => []),
    ...rows,
  ];
}

function padBlockAppartment(block, targetMaxFloor) {
  const currentRows = Array.isArray(block?.appartment) ? block.appartment : [];
  if (currentRows.length >= targetMaxFloor) return block;

  return {
    ...block,
    appartment: padRowsToMaxFloor(
      currentRows.slice(-(block?.floor ?? currentRows.length)),
      block?.floor ?? currentRows.length,
      targetMaxFloor,
    ),
  };
}

function createEmptyBlock(draftBlock, projectId, targetMaxFloor) {
  const { floor } = draftBlock;
  return {
    floor,
    appartment: padRowsToMaxFloor(
      createDraftRooms({ ...draftBlock, projectId }),
      floor,
      targetMaxFloor,
    ),
    statistics: { ...EMPTY_BLOCK_STATISTICS },
  };
}

function mergeDraftBlocks(structure, projectId) {
  if (!structure) return structure;

  const draftBlocks = readDraftBlocks(projectId);
  if (!draftBlocks.length) return structure;

  const existingBlocks = structure.blocks ?? {};
  const draftBlocksToAdd = draftBlocks.filter(
    (draftBlock) => draftBlock && !hasBlockName(existingBlocks, draftBlock.name),
  );

  if (!draftBlocksToAdd.length) return structure;

  const nextMaxFloor = Math.max(
    1,
    Number(structure.maxFloor ?? 0),
    ...draftBlocksToAdd.map((draftBlock) => draftBlock.floor),
  );

  const nextBlocks = Object.fromEntries(
    Object.entries(existingBlocks).map(([blockName, block]) => [
      blockName,
      padBlockAppartment(block, nextMaxFloor),
    ]),
  );

  draftBlocksToAdd.forEach((draftBlock) => {
    nextBlocks[draftBlock.name] = createEmptyBlock(
      draftBlock,
      projectId,
      nextMaxFloor,
    );
  });

  return {
    ...structure,
    maxFloor: Math.max(nextMaxFloor, 1),
    blocks: nextBlocks,
  };
}

/**
 * @param {object|null} stats
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {object|null}
 */
function adjustStatistics(stats, fromStatus, toStatus) {
  if (!stats || fromStatus === toStatus) return stats;

  const fromKey = STATUS_TO_STAT_KEY[fromStatus];
  const toKey = STATUS_TO_STAT_KEY[toStatus];
  const next = { ...stats };

  if (fromKey && typeof next[fromKey] === "number") {
    next[fromKey] = Math.max(0, next[fromKey] - 1);
  }
  if (toKey && typeof next[toKey] === "number") {
    next[toKey] = Math.max(0, next[toKey] + 1);
  }

  return next;
}

/**
 * Bitta loyihaning strukturasini yuklaydi va xona statusini yangilash imkonini beradi.
 * @param {string|number} id - Loyiha ID si
 * @returns {{ structure: object|null, notFound: boolean, error: string|null, loading: boolean, submitting: boolean, get: Function, updateRoomStatus: Function, addBlock: Function, save: Function }}
 */
export function useProjectStructure(id) {
  const [structure, setStructure] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hookSubmitting, setSubmitting] = useState(false);
  const controllerRef = useRef(null);

  const get = useCallback(async () => {
    if (!id) return;
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      // 1. Fetch Structure
      const res = await apiRequest(`/api/v1/projects/${id}/structure`, {
        signal: controller.signal,
      });

      // 2. Fetch Project Info (to get real block IDs)
      const infoRes = await apiRequest(`/api/v1/projects/my-projects/${id}`, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      let apiData = null;
      if (res.ok) {
        apiData = await res.json();
      }

      let projectInfo = null;
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        // Endpoint returns a single project or array of projects, but since we queried by ID, let's handle both
        const projects = infoData?.data || (Array.isArray(infoData) ? infoData : [infoData]);
        projectInfo = projects.find(p => String(p.id) === String(id)) || projects[0];
      }

      // 1. Initial merge with legacy drafts (names only)
      let finalData = apiData ? mergeDraftBlocks(apiData, id) : null;

      // 3. Map real IDs from projectInfo to finalData.blocks
      if (finalData && projectInfo?.blocs) {
        const nameToId = Object.fromEntries(
          projectInfo.blocs.map(b => [String(b.name).trim().toLowerCase(), b.id])
        );
        
        finalData.blocks = Object.fromEntries(
          Object.entries(finalData.blocks).map(([name, block]) => {
            const realId = nameToId[String(name).trim().toLowerCase()];
            return [name, { ...block, id: realId || block.id }];
          })
        );
      }

      // 2. Critical Merge: Full resolution drafts from LocalStorage (includes the builder data)
      try {
        const fullDraftRaw = localStorage.getItem(`tjm_draft_${id}`);
        if (fullDraftRaw) {
          const fullDraft = JSON.parse(fullDraftRaw);
          if (fullDraft && fullDraft.blocks) {
            // If we have no API data, we initialize with draft
            if (!finalData) {
              finalData = {
                maxFloor: fullDraft.maxFloor || 0,
                blockCount: fullDraft.blockCount || 0,
                blocks: fullDraft.blocks,
                totalStatistics: fullDraft.totalStatistics || EMPTY_BLOCK_STATISTICS,
              };
            } else {
              // Merge into existing structure
              finalData = {
                ...finalData,
                blocks: { ...finalData.blocks, ...fullDraft.blocks },
                totalStatistics: fullDraft.totalStatistics || finalData.totalStatistics,
                maxFloor: Math.max(
                  finalData.maxFloor || 0,
                  fullDraft.maxFloor || 0,
                ),
              };
            }
          }
        }
      } catch (e) {
        console.warn("Full draft merge failed:", e);
      }

      if (finalData) {
        setStructure(finalData);
        setError(null);
        setNotFound(false);
      } else if (res.status === 404 || res.status === 400) {
        setNotFound(true);
      } else {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi!");
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      
      // Even on network error, try to show LocalStorage if available
      try {
        const fullDraftRaw = localStorage.getItem(`tjm_draft_${id}`);
        if (fullDraftRaw) {
           const fullDraft = JSON.parse(fullDraftRaw);
           if (fullDraft && fullDraft.blocks) {
              setStructure(fullDraft);
              setNotFound(false);
              setError(null);
              return;
           }
        }
      } catch(e) {}

      setError("Tizimda nosozlik yuz berdi!");
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  const updateRoomStatus = useCallback((roomId, patch) => {
    setStructure((prev) => {
      if (!prev?.blocks) return prev;

      let hasChanges = false;
      let previousStatus = null;
      let nextStatus = null;
      const nextBlocks = Object.fromEntries(
        Object.entries(prev.blocks).map(([blockName, block]) => {
          let blockChanged = false;
          let blockNextStats = block?.statistics;
          const nextAppartment = (block?.appartment ?? []).map((floorRooms) => {
            let floorChanged = false;
            const nextFloorRooms = floorRooms.map((room) => {
              if (String(room.id) !== String(roomId)) return room;
              floorChanged = true;
              hasChanges = true;
              previousStatus = room.status;
              nextStatus = patch?.status ?? room.status;
              return { ...room, ...patch };
            });

            if (floorChanged) blockChanged = true;
            return floorChanged ? nextFloorRooms : floorRooms;
          });

          if (
            blockChanged &&
            previousStatus &&
            nextStatus &&
            previousStatus !== nextStatus
          ) {
            blockNextStats = adjustStatistics(
              block?.statistics,
              previousStatus,
              nextStatus,
            );
          }

          if (!blockChanged) return [blockName, block];

          const nextBlock = { ...block, appartment: nextAppartment };
          if (blockNextStats !== undefined) {
            nextBlock.statistics = blockNextStats;
          }

          return [blockName, nextBlock];
        }),
      );

      const nextTotalStatistics =
        previousStatus && nextStatus && previousStatus !== nextStatus
          ? adjustStatistics(prev?.totalStatistics, previousStatus, nextStatus)
          : prev?.totalStatistics;

      return hasChanges
        ? { ...prev, blocks: nextBlocks, totalStatistics: nextTotalStatistics }
        : prev;
    });
  }, []);

  const addBlock = useCallback(
    ({ name, floor, homesPerFloor, startNumber, floorsConfig }) => {
      if (!structure) {
        return { ok: false, reason: "unavailable" };
      }

      const draftBlock = normalizeDraftBlock({
        name,
        floor,
        homesPerFloor,
        startNumber,
        floorsConfig,
      });
      if (!draftBlock) {
        return { ok: false, reason: "invalid" };
      }

      if (hasBlockName(structure.blocks, draftBlock.name)) {
        return { ok: false, reason: "duplicate" };
      }

      const existingDraftBlocks = readDraftBlocks(id);
      const nextDraftBlocks = [...existingDraftBlocks, draftBlock];
      writeDraftBlocks(id, nextDraftBlocks);
      setStructure((prev) => mergeDraftBlocks(prev, id));

      return { ok: true, blockName: draftBlock.name };
    },
    [id, structure],
  );

  const save = useCallback(async (newStructure) => {
    if (!id) return { ok: false };
    setSubmitting(true);
    try {
      // Optimistik update
      setStructure(newStructure);

      const res = await apiRequest(`/api/v1/projects/${id}/add`, {
        method: "POST",
        body: JSON.stringify({
          maxFloor: newStructure.maxFloor ?? 0,
          blocks: newStructure.blocks ?? {},
        }),
      });

      if (res.status === 200 || res.status === 201) {
        // Clear drafts after successful save
        writeDraftBlocks(id, []);
        localStorage.removeItem(`tjm_draft_${id}`);
        // Yangi strukturani serverdan qayta yuklab olamiz
        await get();
        return { ok: true };
      }
      return { ok: false, status: res.status };
    } catch {
      return { ok: false };
    } finally {
      setSubmitting(false);
    }
  }, [id, get]);

  const deleteBlock = useCallback(async (blockName) => {
    if (!id || !structure?.blocks?.[blockName]) return { ok: false };
    
    const block = structure.blocks[blockName];
    const bId = block.id;

    if (!bId) {
      console.error(`Blok uchun ID topilmadi: ${blockName}. Bu blok hali serverda yaratilmagan bo'lishi mumkin.`);
      return { ok: false, reason: "id_not_found" };
    }

    setSubmitting(true);
    try {
      // 1. HAQIQIY DELETE REQUEST yuboramiz: /api/v1/projects/block/{id}
      console.log(`Backenddan blok o'chirish so'rovi yuborilmoqda: /api/v1/projects/block/${bId}`);
      const delRes = await apiRequest(`/api/v1/projects/block/${bId}`, {
        method: "DELETE",
      });

      if (!delRes.ok) {
        console.error("Backenddan blok o'chirishda xatolik:", delRes.status);
        return { ok: false, status: delRes.status };
      }

      // 2. Server o'chirgandan keyin lokal holatni yangilaymiz
      const { [blockName]: _, ...remainingBlocks } = structure.blocks ?? {};
      
      setStructure(prev => {
        if (!prev) return prev;
        const allBlocks = Object.values(remainingBlocks);
        const newMaxFloor = allBlocks.length > 0
          ? Math.max(...allBlocks.map((b) => b.floor ?? 0))
          : 0;
        const newTotalStats = allBlocks.reduce(
          (acc, b) => {
            acc.total += b.statistics?.total ?? 0;
            acc.totalEmpty += b.statistics?.totalEmpty ?? 0;
            acc.totalReserved += b.statistics?.totalReserved ?? 0;
            acc.totalSold += b.statistics?.totalSold ?? 0;
            acc.totalNot += b.statistics?.totalNot ?? 0;
            return acc;
          },
          { total: 0, totalEmpty: 0, totalReserved: 0, totalSold: 0, totalNot: 0 },
        );

        return {
          ...prev,
          blocks: remainingBlocks,
          maxFloor: newMaxFloor,
          blockCount: allBlocks.length,
          totalStatistics: newTotalStats,
        };
      });

      localStorage.removeItem(`tjm_draft_${id}`);
      await get();
      return { ok: true };
    } catch (err) {
      console.error("Blokni o'chirishda xatolik:", err);
      return { ok: false };
    } finally {
      setSubmitting(false);
    }
  }, [id, structure, get]);

  return { 
    structure, 
    notFound, 
    error, 
    loading, 
    submitting: hookSubmitting, 
    get, 
    updateRoomStatus, 
    addBlock, 
    save,
    deleteBlock
  };
}
