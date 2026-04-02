import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { apiRequest } from "@/shared/lib/api";

const DEFAULT_STAGES = [
  { id: "stage-1", name: "Yangi", title: "Yangi" },
  { id: "stage-2", name: "Qo'ng'iroq qildim", title: "Qo'ng'iroq qildim" },
  { id: "stage-3", name: "Telefon ko'tarmadi", title: "Telefon ko'tarmadi" },
  { id: "stage-4", name: "Qayta qo'ng'iroq", title: "Qayta qo'ng'iroq" },
  { id: "stage-5", name: "Kelishildi", title: "Kelishildi" },
  { id: "stage-6", name: "Bekor", title: "Bekor" },
];

const LEGACY_STAGE_TITLE_MAP = {
  "Aloqa qilindi": "Qo'ng'iroq qildim",
  "Muzokara": "Telefon ko'tarmadi",
  "Qaror": "Qayta qo'ng'iroq",
  "Bitim": "Kelishildi",
};

const normalizeStageTitle = (nameOrTitle) => {
  const raw = String(nameOrTitle || "").trim();
  return LEGACY_STAGE_TITLE_MAP[raw] || raw;
};

const hasStageTitle = (columns, expectedTitle) => {
  const normalizedExpected = String(expectedTitle || "").trim().toLowerCase();
  return columns.some((col) => {
    const title = normalizeStageTitle(col.name || col.title);
    return title.toLowerCase() === normalizedExpected;
  });
};

export const useCrmStore = create((set, get) => {
  const safeJson = async (res) => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    const text = await res.text();
    throw new Error(text.slice(0, 100) || "Server xatosi (JSON emas)");
  };

  return {
    columns: DEFAULT_STAGES,
    leads: [],
    isLoading: false,
    error: null,
    hasFetched: false,
    pollingIntervalId: null,
    bekorBootstrapChecked: false,

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
      if (state.pollingIntervalId) return; // Already polling
      
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
      const { hasFetched, pollingIntervalId, bekorBootstrapChecked } = get();
      if (!hasFetched && !pollingIntervalId) {
        set({ isLoading: true, error: null });
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const [voronkaRes, leadsRes] = await Promise.all([
          apiRequest("/api/v1/sales-manager-crm/voronka", { signal: controller.signal }),
          apiRequest("/api/v1/sales-manager-crm/leads", { signal: controller.signal }),
        ]);

        clearTimeout(timeoutId);

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

        // Backend columns mavjud bo'lsa — faqat shularni ishlatamiz (DEFAULT_STAGES bilan merge qilmaymiz)
        let normalizedColumns = backendColumns.length > 0
          ? backendColumns.map((col) => {
              const originalTitle = col.name || col.title;
              return { ...col, title: normalizeStageTitle(originalTitle) };
            })
          : [...DEFAULT_STAGES];

        if (
          backendColumns.length > 0 &&
          !bekorBootstrapChecked &&
          !hasStageTitle(normalizedColumns, "Bekor")
        ) {
          try {
            const createBekorRes = await apiRequest("/api/v1/sales-manager-crm/voronka", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: "Bekor" }),
            });
            if (createBekorRes.ok) {
              const createBekorRaw = await safeJson(createBekorRes);
              const createBekorData = createBekorRaw?.data || createBekorRaw;
              normalizedColumns = [
                ...normalizedColumns,
                {
                  ...createBekorData,
                  title: normalizeStageTitle(createBekorData.name || createBekorData.title),
                },
              ];
            }
          } catch (err) {
            console.warn("Bekor bosqichini yaratib bo'lmadi:", err?.message || err);
          }
        }

        const normalizedLeads = backendLeads.map(lead => ({
          ...lead,
          columnId: lead.statusId,
          title: lead.firstName || lead.title,
          companyName: lead.phone || lead.companyName
        }));

        set({ 
          columns: normalizedColumns, 
          leads: normalizedLeads, 
          isLoading: false,
          hasFetched: true,
          bekorBootstrapChecked: true,
          error: null 
        });
      } catch (err) {
        const { hasFetched } = get();
        if (hasFetched) {
          console.warn("Background refresh failed:", err.message);
          set({ isLoading: false }); 
        } else {
          set({ error: err.message, isLoading: false });
        }
      }
    },

    addColumn: async (name) => {
      try {
        const res = await apiRequest("/api/v1/sales-manager-crm/voronka", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          const raw = await safeJson(res);
          const data = raw?.data || raw; // Handle both nested and direct
          const normalized = { ...data, title: data.name || data.title };
          set((state) => ({ columns: [...state.columns, normalized] }));
          return { success: true, data: normalized };
        }
        return { success: false, error: "Bosqich qo'shib bo'lmadi" };
      } catch (err) {
        console.error("Column qo'shishda xato:", err);
        return { success: false, error: err.message };
      }
    },

    updateColumn: async (id, name) => {
      try {
        const res = await apiRequest(`/api/v1/sales-manager-crm/voronka/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          set((state) => ({
            columns: state.columns.map((col) => (col.id === id ? { ...col, name, title: name } : col)),
          }));
        }
      } catch (err) {
        console.error("Column tahrirlashda xato:", err);
      }
    },

    deleteColumn: async (id) => {
      try {
        const res = await apiRequest(`/api/v1/sales-manager-crm/voronka/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          set((state) => ({
            columns: state.columns.filter((col) => col.id !== id),
            leads: state.leads.filter((lead) => lead.columnId !== id),
          }));
        }
      } catch (err) {
        console.error("Column o'chirishda xato:", err);
      }
    },

    addLead: async (columnId, leadData) => {
      try {
        let finalColumnId = columnId;

        if (String(columnId).startsWith("stage-")) {
          const { columns, addColumn } = get();
          const localCol = columns.find(c => c.id === columnId);
          if (!localCol) throw new Error("Bosqich topilmadi");
          
          const createRes = await addColumn(localCol.title);
          if (!createRes.success) throw new Error(createRes.error);
          
          finalColumnId = createRes.data.id;
          set((state) => ({
            columns: state.columns.filter(c => c.id !== columnId)
          }));
        }

        const res = await apiRequest("/api/v1/sales-manager-crm/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            firstName: leadData.title,
            phone: leadData.companyName,
            price: leadData.price,
            statusId: Number(finalColumnId)
          }),
        });
        
        if (res.ok) {
          const raw = await safeJson(res);
          const data = raw?.data || raw; // Handle both nested and direct
          // Normalize the new lead from backend
          const normalized = {
            ...data,
            columnId: data.statusId,
            title: data.firstName || data.title,
            companyName: data.phone || data.companyName
          };
          set((state) => ({ leads: [...state.leads, normalized] }));
          return { success: true };
        } else {
          await safeJson(res); 
        }
      } catch (err) {
        console.error("Lead qo'shishda xato:", err);
        return { success: false, error: err.message };
      }
    },

    updateLead: async (id, updateData) => {
      try {
        let finalColumnId = updateData.columnId;
        if (finalColumnId && String(finalColumnId).startsWith("stage-")) {
          const { columns, addColumn } = get();
          const localCol = columns.find((c) => c.id === finalColumnId);
          if (!localCol) throw new Error("Bosqich topilmadi");

          const createRes = await addColumn(localCol.title || localCol.name);
          if (!createRes.success) throw new Error(createRes.error || "Bosqich yaratilmadi");

          finalColumnId = createRes.data.id;
          set((state) => ({
            columns: state.columns.filter((c) => c.id !== updateData.columnId),
          }));
        }

        const mappedData = { ...updateData };
        if (finalColumnId) {
          mappedData.statusId = Number(finalColumnId);
          delete mappedData.columnId;
        }
        if (updateData.title) {
          mappedData.firstName = updateData.title;
          delete mappedData.title;
        }
        if (updateData.companyName) {
          mappedData.phone = updateData.companyName;
          delete mappedData.companyName;
        }

        const res = await apiRequest(`/api/v1/sales-manager-crm/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mappedData),
        });
        if (res.ok) {
          set((state) => ({
            leads: state.leads.map((lead) =>
              lead.id === id
                ? {
                    ...lead,
                    ...updateData,
                    ...(updateData.columnId ? { columnId: finalColumnId } : null),
                  }
                : lead
            ),
          }));
        }
      } catch (err) {
        console.error("Lead tahrirlashda xato:", err);
      }
    },

    deleteLead: async (id) => {
      try {
        const res = await apiRequest(`/api/v1/sales-manager-crm/leads/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          set((state) => ({
            leads: state.leads.filter((lead) => lead.id !== id),
          }));
        }
      } catch (err) {
        console.error("Lead o'chirishda xato:", err);
      }
    },

    archiveLead: async (leadId) => {
      const { columns, updateLead } = get();
      const archiveCol = columns.find(
        (c) => c.name === "__crm_hidden_archive__" || c.title === "__crm_hidden_archive__"
      );
      if (!archiveCol) return;
      await updateLead(leadId, { columnId: archiveCol.id });
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
        const oldIndex = state.leads.findIndex((l) => l.id === activeId);
        const newIndex = state.leads.findIndex((l) => l.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          return { leads: arrayMove(state.leads, oldIndex, newIndex) };
        }
        return state;
      });
    },

    moveLeadToDifferentColumn: (activeId, overId, newColumnId, isOverAColumn) => {
      const { leads, updateLead } = get();
      const activeIndex = leads.findIndex((l) => l.id === activeId);
      const overIndex = leads.findIndex((l) => l.id === overId);

      if (activeIndex !== -1) {
        const activeLead = leads[activeIndex];
        const newLeads = [...leads];
        const updatedLead = { ...activeLead, columnId: newColumnId };
        newLeads.splice(activeIndex, 1);
        
        if (isOverAColumn) {
          newLeads.push(updatedLead);
        } else {
          const adjustedOverIndex = overIndex >= 0 ? overIndex : newLeads.length;
          newLeads.splice(adjustedOverIndex, 0, updatedLead);
        }
        
        set({ leads: newLeads });
        updateLead(activeId, { columnId: newColumnId });
      }
    },

    initializeDefaultColumns: async () => {
      const { addColumn, fetchCrmData, columns } = get();
      const standardNames = DEFAULT_STAGES.map((stage) => stage.title);
      set({ isLoading: true });
      try {
        const existingNames = columns
          .filter(c => !String(c.id).startsWith("stage-"))
          .map(c => (c.name || c.title).toLowerCase());

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
