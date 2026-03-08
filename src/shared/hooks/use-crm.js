// use-crm.js
import {
  MouseSensor, TouchSensor, pointerWithin,
  rectIntersection, useSensor, useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  addLead, fetchLeads, fetchVoronka, insertVoronkaAt,
  patchCollapseState, patchLeadStatus, patchVoronkaOrder,
} from "./crm-api";

function customCollision(args) {
  const isCol = args.active?.id?.toString().startsWith("col-");
  if (isCol) return rectIntersection(args);
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function useCrm() {
  const [voronka, setVoronka] = useState([]);
  const [leads, setLeads] = useState([]);
  const [colMeta, setColMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeCardStatus, setActiveCardStatus] = useState(null);
  const [highlightedLeadId, setHighlightedLeadId] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchVoronka()
      .then((v) => { if (alive) { setVoronka(v); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e.message ?? "Xatolik"); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const loadColLeads = useCallback(async (status, page = 1) => {
    setColMeta((p) => ({ ...p, [status]: { ...p[status], loading: true } }));
    try {
      const { items, hasMore, total } = await fetchLeads(status, page);
      setLeads((prev) => {
        const base = page === 1 ? prev.filter((l) => l.status !== status) : prev;
        const newIds = new Set(items.map((l) => l.id));
        return [...base.filter((l) => !newIds.has(l.id)), ...items];
      });
      setColMeta((p) => ({
        ...p,
        [status]: { loading: false, page, hasMore, total },
      }));
    } catch {
      setColMeta((p) => ({ ...p, [status]: { ...p[status], loading: false } }));
    }
  }, []);

  const handleColumnVisible = useCallback(
    (status) => {
      setColMeta((prev) => {
        if (prev[status]) return prev;
        loadColLeads(status, 1);
        return { ...prev, [status]: { loading: true, page: 1, hasMore: false, total: 0 } };
      });
    },
    [loadColLeads],
  );

  const handleLoadMore = useCallback(
    (status) => {
      const m = colMeta[status];
      if (!m || m.loading || !m.hasMore) return;
      loadColLeads(status, m.page + 1);
    },
    [colMeta, loadColLeads],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const isColDrag = typeof activeId === "string" && activeId?.startsWith("col-");
  const isCardDrag = activeId !== null && !isColDrag;
  const activeLead = isCardDrag ? leads.find((l) => l.id === activeId) : null;
  const activeCol = isColDrag ? voronka.find((v) => `col-${v.id}` === activeId) : null;
  const colSortIds = voronka.map((v) => `col-${v.id}`);

  const leadsRef = useRef(leads);
  const dragStartStatusRef = useRef(null);
  useEffect(() => { leadsRef.current = leads; }, [leads]);

  const statusOf = useCallback(
    (id) => leadsRef.current.find((l) => l.id === id)?.status ?? null, [],
  );
  const getDropStatus = useCallback(
    (overId) => voronka.find((v) => v.status === overId)?.status ?? statusOf(overId),
    [voronka, statusOf],
  );
  const moveLeadPreview = useCallback((prev, active, over, toStatus) => {
    const activeId = active.id;
    const overId = over?.id;
    if (!toStatus || overId == null) return prev;
    if (activeId === overId) return prev;

    const activeIndex = prev.findIndex((l) => l.id === activeId);
    if (activeIndex === -1) return prev;

    const activeLead = prev[activeIndex];
    const next = [...prev];
    next.splice(activeIndex, 1);

    const overIsStatus = String(overId) === toStatus;
    let insertIndex = next.length;

    if (overIsStatus) {
      const lastInColumn = next.reduce(
        (acc, item, index) => (item.status === toStatus ? index : acc),
        -1,
      );
      insertIndex = lastInColumn === -1 ? next.length : lastInColumn + 1;
    } else {
      const overIndex = next.findIndex((l) => l.id === overId);
      if (overIndex !== -1) {
        const activeTop = active.rect?.current?.translated?.top ?? 0;
        const overMid = (over.rect?.top ?? 0) + (over.rect?.height ?? 0) / 2;
        const placeAfter = activeTop > overMid;
        insertIndex = overIndex + (placeAfter ? 1 : 0);
      }
    }

    next.splice(insertIndex, 0, { ...activeLead, status: toStatus });
    return next;
  }, []);
  const restoreStatuses = useCallback(async (statuses) => {
    const unique = [...new Set(statuses.filter(Boolean))];
    await Promise.all(
      unique.map(async (status) => {
        const { items, hasMore, total } = await fetchLeads(status, 1);
        setLeads((prev) => [...prev.filter((l) => l.status !== status), ...items]);
        setColMeta((prev) => ({
          ...prev,
          [status]: { loading: false, page: 1, hasMore, total },
        }));
      }),
    );
  }, []);
  const syncLeadOrders = useCallback(async (statuses) => {
    const unique = [...new Set(statuses.filter(Boolean))];
    const snapshot = leadsRef.current;
    const requests = unique.flatMap((status) =>
      snapshot
        .filter((lead) => lead.status === status)
        .map((lead, order) => patchLeadStatus(lead.id, status, order)),
    );
    await Promise.all(requests);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveColOrder = useCallback(
    debounce((ordered) => {
      patchVoronkaOrder(ordered.map((v) => v.id)).catch(() =>
        fetchVoronka().then(setVoronka).catch(() => {}),
      );
    }, 500), [],
  );

  const handleCollapseChange = useCallback((colId, next) => {
    setVoronka((p) => p.map((v) => (v.id === colId ? { ...v, collapsed: next } : v)));
    patchCollapseState(colId, next).catch(() => {
      setVoronka((p) => p.map((v) => (v.id === colId ? { ...v, collapsed: !next } : v)));
    });
  }, []);

  const handleAddColumn = useCallback(async (formData, insertIdx) => {
    try {
      const newCol = await insertVoronkaAt(insertIdx, formData);
      setVoronka((prev) =>
        [...prev.map((col) => (
          col.order >= insertIdx ? { ...col, order: col.order + 1 } : col
        )), newCol].sort((a, b) => a.order - b.order),
      );
      setColMeta((p) => ({
        ...p,
        [newCol.status]: { loading: false, page: 1, hasMore: false, total: 0 },
      }));
    } catch { /* silent */ }
  }, []);

  const handleAddLead = useCallback(async (leadData) => {
    const newLead = await addLead(leadData);
    setLeads((prev) => [...prev, newLead]);
    setColMeta((p) => ({
      ...p,
      [newLead.status]: {
        ...p[newLead.status],
        total: (p[newLead.status]?.total ?? 0) + 1,
      },
    }));
    return newLead;
  }, []);

  const handleHighlightLead = useCallback((leadId) => {
    setHighlightedLeadId(leadId);
    setTimeout(() => setHighlightedLeadId(null), 2400);
  }, []);

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(active.id);
    if (!String(active.id).startsWith("col-")) {
      dragStartStatusRef.current = statusOf(active.id);
    }
  }, [statusOf]);

  const handleDragOver = useCallback(
    ({ active, over }) => {
      if (!over || isColDrag) return;
      const fromStatus = statusOf(active.id);
      const toStatus = getDropStatus(over.id);
      if (!fromStatus || !toStatus) return;
      setActiveCardStatus(toStatus);
      setLeads((prev) => moveLeadPreview(prev, active, over, toStatus));
    },
    [isColDrag, statusOf, getDropStatus, moveLeadPreview],
  );

  const handleDragEnd = useCallback(
    async ({ active, over }) => {
      const startStatus = dragStartStatusRef.current;
      dragStartStatusRef.current = null;
      setActiveId(null);
      setActiveCardStatus(null);
      if (!over) return;

      if (isColDrag) {
        const from = voronka.findIndex((v) => `col-${v.id}` === active.id);
        const to = voronka.findIndex((v) => `col-${v.id}` === over.id);
        if (from === -1 || to === -1 || from === to) return;
        const next = arrayMove(voronka, from, to);
        setVoronka(next);
        saveColOrder(next);
        return;
      }

      const fromStatus = startStatus ?? statusOf(active.id);
      const toStatus = leadsRef.current.find((lead) => lead.id === active.id)?.status
        ?? getDropStatus(over.id);
      if (!fromStatus || !toStatus) return;

      const statuses = fromStatus === toStatus ? [toStatus] : [fromStatus, toStatus];
      try {
        await syncLeadOrders(statuses);
      } catch {
        restoreStatuses(statuses).catch(() => {});
      }
    },
    [isColDrag, voronka, statusOf, saveColOrder, getDropStatus, syncLeadOrders, restoreStatuses],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveCardStatus(null);
    dragStartStatusRef.current = null;
  }, []);

  return {
    voronka, leads, colMeta, loading, error, sensors,
    collisionDetection: customCollision,
    activeId, isCardDrag, isColDrag, activeLead, activeCol,
    colSortIds, activeCardStatus, highlightedLeadId,
    handleDragStart, handleDragOver, handleDragEnd, handleDragCancel,
    handleCollapseChange, handleColumnVisible, handleLoadMore,
    handleAddColumn, handleAddLead, handleHighlightLead,
  };
}
