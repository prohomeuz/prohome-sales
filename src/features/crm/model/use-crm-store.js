import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { apiRequest } from "@/shared/lib/api";

const DEFAULT_STAGES = [
  { id: "stage-1", name: "Yangi", title: "Yangi" },
  { id: "stage-2", name: "Qo'ng'iroq qilindi", title: "Qo'ng'iroq qilindi" },
  { id: "stage-3", name: "Muzokara", title: "Muzokara" },
  { id: "stage-4", name: "Qaror", title: "Qaror" },
  { id: "stage-5", name: "Bitim", title: "Bitim" },
];

const TEMP_STAGE_PREFIX = "stage-";
const SYSTEM_ARCHIVE_STAGE_NAME = "__crm_hidden_archive__";
const LEAD_DELETE_SUPPORTED = true;

function normalizeId(value) {
  return value === null || value === undefined ? "" : String(value);
}

function isTempStageId(id) {
  return normalizeId(id).startsWith(TEMP_STAGE_PREFIX);
}

function isArchiveStageName(value) {
  return String(value ?? "").trim().toLowerCase() === SYSTEM_ARCHIVE_STAGE_NAME;
}

function isArchiveColumn(column) {
  return isArchiveStageName(column?.name ?? column?.title);
}

function normalizeColumnTitle(value) {
  const title = String(value ?? "").trim();

  if (title.toLowerCase() === "aloqa qilindi") {
    return "Qo'ng'iroq qilindi";
  }

  return title;
}

function hasColumnTitle(columns, title, exceptId = null) {
  const normalizedTitle = normalizeColumnTitle(title).toLowerCase();
  if (!normalizedTitle) return false;

  return columns.some((column) => {
    if (exceptId !== null && normalizeId(column.id) === normalizeId(exceptId)) {
      return false;
    }

    return normalizeColumnTitle(column?.title || column?.name).toLowerCase() === normalizedTitle;
  });
}

function normalizeColumn(column) {
  const title = normalizeColumnTitle(column?.name || column?.title || "");
  return {
    ...column,
    id: normalizeId(column?.id ?? column?._id),
    name: title,
    title,
  };
}

function normalizeLead(lead) {
  return {
    ...lead,
    id: normalizeId(lead?.id ?? lead?._id),
    columnId: normalizeId(lead?.statusId ?? lead?.columnId),
    title: lead?.firstName || lead?.title || "",
    companyName: lead?.phone || lead?.companyName || "",
  };
}

function buildLeadOrderByColumn(leads) {
  return leads.reduce((acc, lead) => {
    const columnId = normalizeId(lead?.columnId);
    if (!columnId) return acc;
    if (!acc[columnId]) {
      acc[columnId] = [];
    }
    acc[columnId].push(normalizeId(lead.id));
    return acc;
  }, {});
}

function sortLeadsByColumnOrder(leads, leadOrderByColumn) {
  const indexedLeads = leads.map((lead, index) => ({ lead, index }));
  const positionMaps = Object.fromEntries(
    Object.entries(leadOrderByColumn || {}).map(([columnId, ids]) => [
      columnId,
      new Map(ids.map((id, index) => [normalizeId(id), index])),
    ]),
  );

  return indexedLeads
    .sort((a, b) => {
      if (a.lead.columnId !== b.lead.columnId) {
        return a.index - b.index;
      }

      const columnPositions = positionMaps[a.lead.columnId];
      if (!columnPositions) {
        return a.index - b.index;
      }

      const aPos = columnPositions.has(a.lead.id)
        ? columnPositions.get(a.lead.id)
        : Number.MAX_SAFE_INTEGER;
      const bPos = columnPositions.has(b.lead.id)
        ? columnPositions.get(b.lead.id)
        : Number.MAX_SAFE_INTEGER;

      if (aPos !== bPos) {
        return aPos - bPos;
      }

      return a.index - b.index;
    })
    .map(({ lead }) => lead);
}

function moveLeadToColumnEnd(leads, leadId, targetColumnId, nextLead) {
  const filteredLeads = leads.filter((lead) => lead.id !== normalizeId(leadId));
  const lastIndexInColumn = filteredLeads.reduce(
    (lastIndex, lead, index) =>
      lead.columnId === normalizeId(targetColumnId) ? index : lastIndex,
    -1,
  );

  const insertIndex =
    lastIndexInColumn === -1 ? filteredLeads.length : lastIndexInColumn + 1;
  filteredLeads.splice(insertIndex, 0, nextLead);
  return filteredLeads;
}

export const useCrmStore = create((set, get) => {
  const pendingStageCreations = new Map();
  const pendingSystemStageCreations = new Map();

  const safeJson = async (res) => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    const text = await res.text();
    throw new Error(text.slice(0, 100) || "Server xatosi (JSON emas)");
  };

  const ensurePersistedColumnId = async (columnId) => {
    const normalizedId = normalizeId(columnId);

    if (!isTempStageId(normalizedId)) {
      return { success: true, id: normalizedId };
    }

    const { columns, addColumn } = get();
    const localCol = columns.find((col) => col.id === normalizedId);
    if (!localCol) {
      return { success: false, error: "Bosqich topilmadi" };
    }

    if (!pendingStageCreations.has(normalizedId)) {
      pendingStageCreations.set(normalizedId, addColumn(localCol.title));
    }

    const createRes = await pendingStageCreations.get(normalizedId);
    pendingStageCreations.delete(normalizedId);

    if (!createRes.success) {
      return createRes;
    }

    set((state) => ({
      columns: state.columns.filter((col) => col.id !== normalizedId),
    }));

    return { success: true, id: normalizeId(createRes.data.id) };
  };

  const ensureArchiveColumnId = async () => {
    const { archiveColumnId, systemColumns } = get();

    if (archiveColumnId) {
      return { success: true, id: normalizeId(archiveColumnId) };
    }

    const existingArchiveColumn = systemColumns.find(isArchiveColumn);
    if (existingArchiveColumn) {
      const nextId = normalizeId(existingArchiveColumn.id);
      set({ archiveColumnId: nextId });
      return { success: true, id: nextId };
    }

    const pendingKey = SYSTEM_ARCHIVE_STAGE_NAME;
    if (!pendingSystemStageCreations.has(pendingKey)) {
      pendingSystemStageCreations.set(
        pendingKey,
        (async () => {
          try {
            const res = await apiRequest("/api/v1/sales-manager-crm/voronka", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: SYSTEM_ARCHIVE_STAGE_NAME }),
            });

            if (!res.ok) {
              const errorData = await safeJson(res).catch(() => null);
              return {
                success: false,
                error:
                  errorData?.message ||
                  errorData?.error ||
                  "Yashirin arxiv bosqichini yaratib bo'lmadi",
              };
            }

            const raw = await safeJson(res);
            const data = raw?.data || raw;
            const normalized = normalizeColumn(data);

            set((state) => ({
              systemColumns: state.systemColumns.some(
                (column) => column.id === normalized.id,
              )
                ? state.systemColumns
                : [...state.systemColumns, normalized],
              archiveColumnId: normalized.id,
            }));

            return { success: true, id: normalized.id };
          } catch (err) {
            return { success: false, error: err.message };
          }
        })(),
      );
    }

    const result = await pendingSystemStageCreations.get(pendingKey);
    pendingSystemStageCreations.delete(pendingKey);
    return result;
  };

  return {
    columns: DEFAULT_STAGES,
    systemColumns: [],
    archiveColumnId: null,
    leads: [],
    leadOrderByColumn: {},
    isLoading: false,
    error: null,
    hasFetched: false,
    pollingIntervalId: null,
    leadDeleteSupported: LEAD_DELETE_SUPPORTED,

    filters: {
      phoneQuery: "",
      priceMin: "",
      priceMax: "",
      dateFrom: null,
      dateTo: null,
    },

    setFilters: (newFilters) => set((state) => ({ 
      filters: { ...state.filters, ...newFilters } 
    })),

    startPolling: () => {
      const state = get();
      if (state.pollingIntervalId || state.error === "permissions denied") return; // Already polling / permission blocked
      
      const id = setInterval(() => {
        get().fetchCrmData();
      }, 10000); // Poll every 10 seconds
      
      set({ pollingIntervalId: id });
    },

    stopPolling: () => {
      const { pollingIntervalId } = get();
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        set({ pollingIntervalId: null });
      }
    },

    fetchCrmData: async () => {
      const { hasFetched, pollingIntervalId } = get();
      if (!hasFetched && !pollingIntervalId) {
        set({ isLoading: true, error: null });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const [voronkaRes, leadsRes] = await Promise.all([
          apiRequest("/api/v1/sales-manager-crm/voronka", { signal: controller.signal }),
          apiRequest("/api/v1/sales-manager-crm/leads", { signal: controller.signal }),
        ]);

        if (!voronkaRes.ok || !leadsRes.ok) {
          const errorRes = !voronkaRes.ok ? voronkaRes : leadsRes;
          if (errorRes.status === 403 || errorRes.status === 401) {
            throw new Error("permissions denied");
          }
          await safeJson(errorRes);
        }

        const voronka = await safeJson(voronkaRes);
        const leadsRaw = await safeJson(leadsRes);

        const backendColumns = Array.isArray(voronka) ? voronka : (voronka?.data || []);
        const backendLeads = Array.isArray(leadsRaw) ? leadsRaw : (leadsRaw?.data || []);

        const normalizedBackendColumns = backendColumns.map(normalizeColumn);
        const systemColumns = normalizedBackendColumns.filter(isArchiveColumn);
        const hiddenColumnIds = new Set(systemColumns.map((column) => column.id));

        let normalizedColumns = [...DEFAULT_STAGES];

        normalizedBackendColumns
          .filter((column) => !hiddenColumnIds.has(column.id))
          .forEach((normalized) => {
          const bName = normalized.title.toLowerCase();
          const existingIdx = normalizedColumns.findIndex(
            (defaultColumn) => defaultColumn.title.toLowerCase() === bName,
          );
          if (existingIdx !== -1) {
            normalizedColumns[existingIdx] = normalized;
          } else {
            normalizedColumns.push(normalized);
          }
          });

        const normalizedLeads = backendLeads
          .map(normalizeLead)
          .filter((lead) => !hiddenColumnIds.has(lead.columnId));
        const orderedLeads = sortLeadsByColumnOrder(
          normalizedLeads,
          get().leadOrderByColumn,
        );

        set({ 
          columns: normalizedColumns, 
          systemColumns,
          archiveColumnId: systemColumns[0]?.id ?? null,
          leads: orderedLeads,
          leadOrderByColumn: buildLeadOrderByColumn(orderedLeads),
          isLoading: false,
          hasFetched: true,
          error: null 
        });
      } catch (err) {
        const { hasFetched } = get();
        if (err.message === "permissions denied") {
          get().stopPolling();
          set({
            error: "permissions denied",
            isLoading: false,
          });
          return;
        }

        if (hasFetched) {
          console.warn("Background refresh failed:", err.message);
          set({ isLoading: false }); 
        } else {
          set({ error: err.message, isLoading: false });
        }
      } finally {
        clearTimeout(timeoutId);
      }
    },

    addColumn: async (name) => {
      try {
        const trimmedName = normalizeColumnTitle(name);
        if (!trimmedName) {
          return { success: false, error: "Bosqich nomini kiriting" };
        }

        if (hasColumnTitle(get().columns, trimmedName)) {
          return { success: false, error: "Bu nomdagi bosqich allaqachon mavjud" };
        }

        const res = await apiRequest("/api/v1/sales-manager-crm/voronka", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        });
        if (res.ok) {
          const raw = await safeJson(res);
          const data = raw?.data || raw;
          const normalized = normalizeColumn(data);

          set((state) => {
            const hasSameColumn = state.columns.some(
              (column) => !isTempStageId(column.id) && column.id === normalized.id,
            );

            if (hasSameColumn) {
              return { columns: state.columns };
            }

            const tempStageIndex = state.columns.findIndex(
              (column) =>
                isTempStageId(column.id) &&
                column.title.toLowerCase() === normalized.title.toLowerCase(),
            );

            if (tempStageIndex !== -1) {
              const nextColumns = [...state.columns];
              nextColumns[tempStageIndex] = normalized;
              return { columns: nextColumns };
            }

            return { columns: [...state.columns, normalized] };
          });

          return { success: true, data: normalized };
        }
        const errorData = await safeJson(res).catch(() => null);
        return {
          success: false,
          error: errorData?.message || errorData?.error || "Bosqich qo'shib bo'lmadi",
        };
      } catch (err) {
        console.error("Column qo'shishda xato:", err);
        return { success: false, error: err.message };
      }
    },

    updateColumn: async (id, name) => {
      try {
        if (isTempStageId(id)) {
          return { success: false, error: "Avval bosqichni serverda yaratish kerak" };
        }

        const trimmedName = normalizeColumnTitle(name);
        if (!trimmedName) {
          return { success: false, error: "Bosqich nomini kiriting" };
        }

        if (hasColumnTitle(get().columns, trimmedName, id)) {
          return { success: false, error: "Bu nomdagi bosqich allaqachon mavjud" };
        }

        const res = await apiRequest(`/api/v1/sales-manager-crm/voronka/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        });
        if (res.ok) {
          set((state) => ({
            columns: state.columns.map((col) =>
              col.id === normalizeId(id)
                ? { ...col, name: trimmedName, title: trimmedName }
                : col,
            ),
          }));
          return { success: true };
        }
        const errorData = await safeJson(res).catch(() => null);
        return {
          success: false,
          error: errorData?.message || errorData?.error || "Bosqich tahrirlanmadi",
        };
      } catch (err) {
        console.error("Column tahrirlashda xato:", err);
        return { success: false, error: err.message };
      }
    },

    deleteColumn: async (id) => {
      try {
        if (isTempStageId(id)) {
          return { success: false, error: "Standart bosqichni o'chirib bo'lmaydi" };
        }

        const hasLeads = get().leads.some(
          (lead) => normalizeId(lead.columnId) === normalizeId(id),
        );
        if (hasLeads) {
          return {
            success: false,
            error: "Avval ushbu bosqich ichidagi leadlarni boshqa joyga ko'chiring",
          };
        }

        const res = await apiRequest(`/api/v1/sales-manager-crm/voronka/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          set((state) => {
            const nextLeads = state.leads.filter(
              (lead) => lead.columnId !== normalizeId(id),
            );
            return {
              columns: state.columns.filter((col) => col.id !== normalizeId(id)),
              leads: nextLeads,
              leadOrderByColumn: buildLeadOrderByColumn(nextLeads),
            };
          });
          return { success: true };
        }
        const errorData = await safeJson(res).catch(() => null);
        return {
          success: false,
          error: errorData?.message || errorData?.error || "Bosqich o'chirilmadi",
        };
      } catch (err) {
        console.error("Column o'chirishda xato:", err);
        return { success: false, error: err.message };
      }
    },

    addLead: async (columnId, leadData) => {
      try {
        const persistedColumn = await ensurePersistedColumnId(columnId);
        if (!persistedColumn.success) {
          throw new Error(persistedColumn.error);
        }

        const res = await apiRequest("/api/v1/sales-manager-crm/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            firstName: leadData.title,
            phone: leadData.companyName,
            price: leadData.price,
            statusId: Number(persistedColumn.id)
          }),
        });
        
        if (res.ok) {
          const raw = await safeJson(res);
          const data = raw?.data || raw;
          const normalized = normalizeLead(data);
          set((state) => {
            const nextLeads = [...state.leads, normalized];
            return {
              leads: nextLeads,
              leadOrderByColumn: buildLeadOrderByColumn(nextLeads),
            };
          });
          return { success: true, data: normalized };
        } else {
          const errorData = await safeJson(res);
          return {
            success: false,
            error: errorData?.message || errorData?.error || "Lead qo'shib bo'lmadi",
          };
        }
      } catch (err) {
        console.error("Lead qo'shishda xato:", err);
        return { success: false, error: err.message };
      }
    },

    updateLead: async (id, updateData) => {
      try {
        const mappedData = { ...updateData };
        if (
          updateData.columnId !== undefined &&
          updateData.columnId !== null &&
          updateData.columnId !== ""
        ) {
          const persistedColumn = await ensurePersistedColumnId(updateData.columnId);
          if (!persistedColumn.success) {
            return persistedColumn;
          }
          mappedData.statusId = Number(persistedColumn.id);
          updateData = { ...updateData, columnId: persistedColumn.id };
          delete mappedData.columnId;
        }
        if (updateData.title !== undefined) {
          mappedData.firstName = updateData.title;
          delete mappedData.title;
        }
        if (updateData.companyName !== undefined) {
          mappedData.phone = updateData.companyName;
          delete mappedData.companyName;
        }

        const res = await apiRequest(`/api/v1/sales-manager-crm/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mappedData),
        });
        if (res.ok) {
          set((state) => {
            const normalizedLeadId = normalizeId(id);
            const currentLead = state.leads.find(
              (lead) => lead.id === normalizedLeadId,
            );

            if (!currentLead) {
              return state;
            }

            const nextColumnId = normalizeId(
              updateData.columnId ?? currentLead.columnId,
            );
            const nextLead = normalizeLead({
              ...currentLead,
              ...updateData,
              statusId: nextColumnId,
            });

            const shouldMoveToAnotherColumn =
              updateData.columnId &&
              normalizeId(currentLead.columnId) !== nextColumnId;

            const nextLeads = shouldMoveToAnotherColumn
              ? moveLeadToColumnEnd(
                  state.leads,
                  normalizedLeadId,
                  nextColumnId,
                  nextLead,
                )
              : state.leads.map((lead) =>
                  lead.id === normalizedLeadId ? nextLead : lead,
                );

            return {
              leads: nextLeads,
              leadOrderByColumn: buildLeadOrderByColumn(nextLeads),
            };
          });
          return { success: true };
        }
        const errorData = await safeJson(res).catch(() => null);
        return {
          success: false,
          error: errorData?.message || errorData?.error || "Lead saqlanmadi",
        };
      } catch (err) {
        console.error("Lead tahrirlashda xato:", err);
        return { success: false, error: err.message };
      }
    },

    changeLeadColumn: async (id, columnId) => {
      const normalizedLeadId = normalizeId(id);
      const normalizedColumnId = normalizeId(columnId);
      const existingLead = get().leads.find((lead) => lead.id === normalizedLeadId);

      if (!existingLead) {
        return { success: false, error: "Lead topilmadi" };
      }

      if (existingLead.columnId === normalizedColumnId) {
        return { success: true };
      }

      return await get().updateLead(normalizedLeadId, {
        columnId: normalizedColumnId,
      });
    },

    moveLeadByColumnIndex: (id, direction) => {
      const normalizedLeadId = normalizeId(id);
      const { leads } = get();
      const activeLead = leads.find((lead) => lead.id === normalizedLeadId);

      if (!activeLead) {
        return { success: false, error: "Lead topilmadi" };
      }

      const sameColumnLeads = leads.filter(
        (lead) => lead.columnId === activeLead.columnId,
      );
      const currentIndex = sameColumnLeads.findIndex(
        (lead) => lead.id === normalizedLeadId,
      );
      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (currentIndex === -1 || targetIndex < 0 || targetIndex >= sameColumnLeads.length) {
        return {
          success: false,
          error:
            direction === "up"
              ? "Lead allaqachon tepada"
              : "Lead allaqachon pastda",
        };
      }

      const reorderedColumnLeads = arrayMove(
        sameColumnLeads,
        currentIndex,
        targetIndex,
      );
      let replacementIndex = 0;
      const nextLeads = leads.map((lead) => {
        if (lead.columnId !== activeLead.columnId) {
          return lead;
        }

        const replacementLead = reorderedColumnLeads[replacementIndex];
        replacementIndex += 1;
        return replacementLead;
      });

      set({
        leads: nextLeads,
        leadOrderByColumn: buildLeadOrderByColumn(nextLeads),
      });

      return { success: true };
    },

    deleteLead: async (id) => {
      try {
        const normalizedId = normalizeId(id);
        const archiveColumn = await ensureArchiveColumnId();
        if (!archiveColumn.success) {
          return archiveColumn;
        }

        const archiveStatusId = Number(archiveColumn.id);
        if (!Number.isFinite(archiveStatusId)) {
          return {
            success: false,
            error: "Arxiv bosqichi ID noto'g'ri qaytdi",
          };
        }

        const res = await apiRequest(`/api/v1/sales-manager-crm/leads/${normalizedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId: archiveStatusId }),
        });

        if (res.ok) {
          set((state) => {
            const nextLeads = state.leads.filter(
              (lead) => lead.id !== normalizedId,
            );
            return {
              leads: nextLeads,
              leadOrderByColumn: buildLeadOrderByColumn(nextLeads),
            };
          });
          return { success: true, archived: true };
        }

        const errorData = await safeJson(res).catch(() => null);
        const message = errorData?.message || errorData?.error || "Lead arxivga yuborilmadi";
        return {
          success: false,
          error: message,
        };
      } catch (err) {
        console.error("Lead o'chirishda xato:", err);
        return { success: false, error: err.message };
      }
    },

    moveColumn: (activeId, overId) => {
      set((state) => {
        const oldIndex = state.columns.findIndex((col) => col.id === activeId);
        const newIndex = state.columns.findIndex((col) => col.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newColumns = arrayMove(state.columns, oldIndex, newIndex);
          return { columns: newColumns };
        }
        return state;
      });
    },

    moveLeadSameColumn: (activeId, overId) => {
      set((state) => {
        const oldIndex = state.leads.findIndex((lead) => lead.id === normalizeId(activeId));
        const newIndex = state.leads.findIndex((lead) => lead.id === normalizeId(overId));
        if (oldIndex !== -1 && newIndex !== -1) {
          const nextLeads = arrayMove(state.leads, oldIndex, newIndex);
          return {
            leads: nextLeads,
            leadOrderByColumn: buildLeadOrderByColumn(nextLeads),
          };
        }
        return state;
      });
    },

    previewMoveLeadToDifferentColumn: (activeId, overId, newColumnId, isOverAColumn) => {
      const { leads } = get();
      const normalizedActiveId = normalizeId(activeId);
      const normalizedOverId = normalizeId(overId);
      const activeIndex = leads.findIndex((lead) => lead.id === normalizedActiveId);
      const overIndex = leads.findIndex((lead) => lead.id === normalizedOverId);

      if (activeIndex !== -1) {
        const activeLead = leads[activeIndex];
        const newLeads = [...leads];
        const updatedLead = { ...activeLead, columnId: normalizeId(newColumnId) };
        newLeads.splice(activeIndex, 1);
        
        if (isOverAColumn) {
          newLeads.push(updatedLead);
        } else {
          const adjustedOverIndex = overIndex >= 0 ? overIndex : newLeads.length;
          newLeads.splice(adjustedOverIndex, 0, updatedLead);
        }
        
        set({
          leads: newLeads,
          leadOrderByColumn: buildLeadOrderByColumn(newLeads),
        });
        return { success: true };
      }

      return { success: false, error: "Lead topilmadi" };
    },

    moveLeadToDifferentColumn: async (activeId, overId, newColumnId, isOverAColumn) => {
      const { leads, updateLead, previewMoveLeadToDifferentColumn } = get();
      const normalizedActiveId = normalizeId(activeId);
      const previousLeads = leads;

      const previewResult = previewMoveLeadToDifferentColumn(
        normalizedActiveId,
        overId,
        newColumnId,
        isOverAColumn,
      );

      if (!previewResult?.success) {
        return previewResult;
      }

      const movedLead = get().leads.find((lead) => lead.id === normalizedActiveId);
      if (!movedLead) {
        set({
          leads: previousLeads,
          leadOrderByColumn: buildLeadOrderByColumn(previousLeads),
        });
        return { success: false, error: "Lead topilmadi" };
      }

      const result = await updateLead(normalizedActiveId, { columnId: movedLead.columnId });
      if (!result?.success) {
        set({
          leads: previousLeads,
          leadOrderByColumn: buildLeadOrderByColumn(previousLeads),
        });
        return result;
      }

      return { success: true };
    },

    initializeDefaultColumns: async () => {
      const { addColumn, fetchCrmData, columns } = get();
      const standardNames = ["Yangi", "Qo'ng'iroq qilindi", "Muzokara", "Qaror", "Bitim"];
      set({ isLoading: true });
      try {
        const existingNames = columns
          .filter((column) => !isTempStageId(column.id))
          .map((column) => (column.name || column.title).toLowerCase());

        for (const name of standardNames) {
          if (!existingNames.includes(name.toLowerCase())) {
            await addColumn(name);
          }
        }
        await fetchCrmData();
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        set({ isLoading: false });
      }
    }
  };
});
