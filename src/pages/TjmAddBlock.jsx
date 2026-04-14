import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { useProjectStructure } from "@/shared/hooks/use-project-structure";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import GeneralError from "@/widgets/error/GeneralError";
import LoadTransition from "@/widgets/loading/LoadTransition";
import LogoLoader from "@/widgets/loading/LogoLoader";
import TjmFloorGrid from "@/pages/tjm-details/ui/TjmFloorGrid";
import {
  ArrowLeft,
  Building2,
  LayoutPanelLeft,
  Layers3,
  Minus,
  PlusCircle,
  RefreshCcw,
  Ruler,
  Copy,
  Eraser,
  ArrowDownToLine,
  FlipHorizontal,
  Maximize,
  ClipboardCopy,
  ClipboardPaste,
  GripVertical,
  MousePointer2,
  Loader2,
  Save,
  Undo2,
  Redo2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,Plus
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const INITIAL_FORM = {
  name: "",
  floor: "16",
  homesPerFloor: "7",
  startNumber: "1",
};

const INITIAL_ERRORS = {
  name: null,
  floor: null,
  homesPerFloor: null,
  startNumber: null,
  submit: null,
};

const PRESETS = [
  { label: "Kichik blok", floor: "9", homesPerFloor: "4" },
  { label: "Standart blok", floor: "16", homesPerFloor: "7" },
  { label: "Katta blok", floor: "20", homesPerFloor: "9" },
];

function clampRoomCount(value) {
  if (value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return 1;
  return Math.min(8, Math.max(1, Math.round(num)));
}

function parseCellObj(cell) {
  if (typeof cell === "number" || typeof cell === "string") {
    return { room: clampRoomCount(cell), size: "", price: "", img2d: "", img3d: "" };
  }
  return { 
    ...cell, 
    room: clampRoomCount(cell?.room ?? 1),
    img2d: cell?.img2d ?? "",
    img3d: cell?.img3d ?? ""
  };
}

function buildFloorRow(homesPerFloor) {
  return Array.from({ length: Math.max(1, homesPerFloor) }, () => ({
    room: 1,
    size: "",
    price: "",
    customNumber: "",
    img2d: "",
    img3d: "",
  }));
}

function createInitialFloorsConfig(floor, homesPerFloor) {
  return Array.from({ length: floor }, () => buildFloorRow(homesPerFloor));
}

function syncFloorsConfig(prev, floor, homesPerFloor, forceResizeRows = false) {
  const normalizedPrev = Array.isArray(prev)
    ? prev.map((row) => {
        if (!Array.isArray(row) || !row.length) return buildFloorRow(homesPerFloor);
        if (forceResizeRows) {
          if (row.length === homesPerFloor) return row.map(parseCellObj);
          if (row.length > homesPerFloor) return row.slice(0, homesPerFloor).map(parseCellObj);
          return [
            ...row.map(parseCellObj),
            ...buildFloorRow(homesPerFloor - row.length),
          ];
        }
        return row.map(parseCellObj);
      })
    : [];

  let next =
    normalizedPrev.length > floor
      ? normalizedPrev.slice(normalizedPrev.length - floor)
      : [...normalizedPrev];

  if (next.length < floor) {
    next = [
      ...Array.from({ length: floor - next.length }, () =>
        buildFloorRow(homesPerFloor)
      ),
      ...next,
    ];
  }

  return next.map((row) =>
    Array.isArray(row) && row.length ? row : buildFloorRow(homesPerFloor)
  );
}

function buildPreviewRows({ floorsConfig, startNumber }) {
  const floor = floorsConfig.length;

  return floorsConfig.map((roomCounts, index) => {
    const floorNumber = floor - index;
    const rowOffset = floorsConfig
      .slice(index + 1)
      .reduce((total, row) => total + row.length, 0);

    return {
      floorNumber,
      homes: roomCounts.map((cell, roomIndex) => {
        const autoNumber = startNumber + rowOffset + roomIndex;
        const displayHouseNumber = cell?.customNumber || autoNumber;

        return {
          key: `${floorNumber}-${roomIndex + 1}`,
          houseNumber: displayHouseNumber,
          roomCount: clampRoomCount(cell?.room ?? cell),
        };
      }),
    };
  });
}

// Standalone memoized tooltip — hech qachon re-render qilinmaydi
const FloatingTooltip = ({ tooltipRef }) => (
  <div
    ref={tooltipRef}
    className="fixed pointer-events-none z-[9999]"
    style={{ display: 'none' }}
  >
    <div className="bg-[#020617] text-white border border-white/10 p-4 rounded-[14px] shadow-2xl min-w-[170px] space-y-2.5 text-[11px] relative" />
  </div>
);

export default function TjmAddBlock() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    structure: home,
    notFound,
    error,
    loading,
    addBlock,
    save,
    submitting: isSaving,
  } = useProjectStructure(id);
  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const [previewVariant, setPreviewVariant] = useState("default");
  const [showRoomCount, setShowRoomCount] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState("16");
  const [clipboardRow, setClipboardRow] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]); // [{ fIdx, rIdx }]
  const [draggedCell, setDraggedCell] = useState(null);
  const [dragEnabledId, setDragEnabledId] = useState(null);
  // suppressDetailsIdx is now a ref (no re-render needed)
  const [selectionBox, setSelectionBox] = useState(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const selectionStartRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const tooltipRef = useRef(null);
  const hoverDataRef = useRef(null);
  const suppressDetailsRef = useRef(null);

  const [floorsConfig, setFloorsConfig] = useState(() =>
    createInitialFloorsConfig(
      Number(INITIAL_FORM.floor),
      Number(INITIAL_FORM.homesPerFloor),
    ),
  );

  const prevHomesPerFloorRef = useRef(Number(INITIAL_FORM.homesPerFloor));

  // --- Undo/Redo History ---
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const pushState = useCallback(() => {
     setUndoStack(prev => [...prev.slice(-49), { floorsConfig, form }]);
     setRedoStack([]);
  }, [floorsConfig, form]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack(rs => [...rs.slice(-49), { floorsConfig, form }]);
    setUndoStack(us => us.slice(0, -1));
    
    // Disable structural sync temporarily or ensure it doesn't loop
    setFloorsConfig(last.floorsConfig);
    setForm(last.form);
    
    toast.info("Amal bekor qilindi", { duration: 1000 });
  }, [floorsConfig, form, undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(us => [...us.slice(-49), { floorsConfig, form }]);
    setRedoStack(rs => rs.slice(0, -1));
    
    setFloorsConfig(next.floorsConfig);
    setForm(next.form);
    
    toast.info("Amal qaytarildi", { duration: 1000 });
  }, [floorsConfig, form, redoStack]);

  useEffect(() => {
    const handleShortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && !submitting) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [undo, redo, submitting]);

  // Sidebar Resizing Effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = Math.max(300, Math.min(600, e.clientX));
        setLeftWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(300, Math.min(600, window.innerWidth - e.clientX));
        setRightWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingLeft || isResizingRight) {
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  // Figma Space tracking
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Input yoki textarea ichida xalaqit qilmaymiz
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Figma Ctrl+Scroll qilib zoom qilish
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = Math.sign(e.deltaY) * -0.1;
        setScale((prev) => Math.min(Math.max(0.3, prev + delta), 4));
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [complete, loading, start]);

  const blockOptions = useMemo(
    () => Object.keys(home?.blocks ?? {}),
    [home?.blocks],
  );

  const normalizedName = form.name.trim();
  const floor = Math.max(1, Math.round(Number(form.floor) || 1));
  const baseHomesPerFloor = Math.max(
    1,
    Math.round(Number(form.homesPerFloor) || 1),
  );
  const startNumber = Math.max(1, Math.round(Number(form.startNumber) || 1));

  useEffect(() => {
    const homesPerFloorChanged = prevHomesPerFloorRef.current !== baseHomesPerFloor;
    prevHomesPerFloorRef.current = baseHomesPerFloor;

    setFloorsConfig((prev) =>
      syncFloorsConfig(prev, floor, baseHomesPerFloor, homesPerFloorChanged),
    );
  }, [baseHomesPerFloor, floor]);

  useEffect(() => {
    const nextSelected = Math.min(
      Math.max(1, Number(selectedFloor) || floor),
      floor,
    );

    if (String(nextSelected) !== String(selectedFloor)) {
      setSelectedFloor(String(nextSelected));
    }
  }, [floor, selectedFloor]);

  // Global keybinds for canceling selections
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedCells([]);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        setSelectedCells([]);
      }
    };
    
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);



  useEffect(() => {
    const handlePointerMove = (e) => {
      if (isResizingLeft) {
        setLeftWidth(Math.max(320, Math.min(e.clientX, 480)));
      }
      if (isResizingRight) {
        setRightWidth(Math.max(280, Math.min(window.innerWidth - e.clientX, 520)));
      }
    };
    const handlePointerUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };
    
    if (isResizingLeft || isResizingRight) {
      document.body.style.cursor = isResizingLeft || isResizingRight ? 'col-resize' : '';
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }
    
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizingLeft, isResizingRight]);

  const prevSelectedCountRef = useRef(0);
  
  useEffect(() => {
    const prev = prevSelectedCountRef.current;
    const curr = selectedCells.length;
    
    if (curr > 0 && curr !== prev) {
      setRightSidebarOpen(true);
    }
    
    prevSelectedCountRef.current = curr;
  }, [selectedCells.length]);

  const previewRows = useMemo(
    () => buildPreviewRows({ floorsConfig, startNumber }),
    [floorsConfig, startNumber],
  );

  const totalHomes = useMemo(
    () => previewRows.reduce((total, row) => total + row.homes.length, 0),
    [previewRows],
  );

  const selectedFloorIndex = Math.max(
    0,
    previewRows.length - Number(selectedFloor || floor),
  );

  const selectedFloorPreview = previewRows[selectedFloorIndex] ?? null;
  const selectedFloorRooms = floorsConfig[selectedFloorIndex] ?? [];

  const previewBlock = useMemo(
    () => ({
      floor,
      appartment: previewRows.map((row) =>
        row.homes.map((home) => ({
          id: `preview:${row.floorNumber}:${home.houseNumber}`,
          houseNumber: home.houseNumber,
          room: home.roomCount,
          status: "NOT",
          size: 0,
          price: 0,
        })),
      ),
      statistics: {
        total: totalHomes,
        totalEmpty: 0,
        totalReserved: 0,
        totalSold: 0,
        totalNot: totalHomes,
      },
    }),
    [floor, previewRows, totalHomes],
  );

  const previewBlockLayouts = useMemo(() => {
    const maxHomes = Math.max(
      1,
      ...previewRows.map((row) => row.homes.length),
    );

    return [
      {
        blockName: normalizedName || "Yangi blok",
        block: previewBlock,
        widthStyle: {
          width: `calc(${maxHomes} * var(--room-tile-size) + ${Math.max(
            maxHomes - 1,
            0,
          )} * var(--room-tile-gap))`,
        },
      },
    ];
  }, [normalizedName, previewBlock, previewRows]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null, submit: null }));
  }, []);

  const applyPreset = useCallback((preset) => {
    setForm((prev) => ({
      ...prev,
      floor: preset.floor,
      homesPerFloor: preset.homesPerFloor,
    }));
    setSelectedFloor(preset.floor);
    setErrors((prev) => ({
      ...prev,
      floor: null,
      homesPerFloor: null,
      submit: null,
    }));
  }, []);

  const updateRoomBox = useCallback((floorIndex, roomIndex, field, value) => {
    pushState();
    setFloorsConfig((prev) =>
      prev.map((r, i) =>
        i === floorIndex
          ? r.map((c, j) => {
              if (j !== roomIndex) return c;
              const nextC = { ...c };
              if (field === "room") nextC.room = clampRoomCount(value);
              else nextC[field] = value;
              return nextC;
            })
          : r
      )
    );
  }, []);

  const applyToSelected = useCallback((field, value) => {
    setFloorsConfig((prev) => {
      pushState();
      const next = prev.map((r) => [...r]);
      selectedCells.forEach(({ fIdx, rIdx }) => {
        if (!next[fIdx] || !next[fIdx][rIdx]) return;
        const c = next[fIdx][rIdx];
        const nextC = { ...c };
        if (field === "room") nextC.room = clampRoomCount(value);
        else nextC[field] = value;
        next[fIdx][rIdx] = nextC;
      });
      return next;
    });
  }, [selectedCells]);

  const handleCellMouseMove = useCallback((e, fIdx, rIdx) => {
    const tip = tooltipRef.current;
    if (!tip) return;
    if (isPanning || isSpacePressed || isCtrlPressed) {
      tip.style.display = 'none';
      return;
    }
    if (suppressDetailsRef.current === `${fIdx}-${rIdx}`) {
      tip.style.display = 'none';
      return;
    }
    // Update position
    tip.style.display = 'block';
    tip.style.left = `${e.clientX}px`;
    tip.style.top = `${e.clientY - 15}px`;
    tip.style.transform = 'translate(-50%, -100%)';
    // Update content directly in DOM — zero React re-renders
    const cell = floorsConfig[fIdx]?.[rIdx];
    const details = previewRows[fIdx]?.homes[rIdx];
    const inner = tip.querySelector('div');
    if (!inner || !cell) return;
    inner.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:24px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;margin-bottom:4px">
        <span style="color:#94a3b8;font-weight:500;white-space:nowrap">Uy raqami:</span>
        <span style="color:#fff;font-weight:700;font-size:13px">#${details?.houseNumber ?? '—'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.05);padding:6px;border-radius:8px;padding-right:10px">
        <span style="color:#94a3b8;padding:0 4px">Xonalar soni:</span>
        <span style="color:#fff;font-weight:700">${cell.room || 1}X</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0 6px">
        <span style="color:#94a3b8">Narxi:</span>
        <span style="color:#fff;font-weight:700">${cell.price || '—'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0 6px">
        <span style="color:#94a3b8">Maydon:</span>
        <span style="color:#fff;font-weight:700">${cell.size || '—'} m²</span>
      </div>
      <svg style="position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:-2px;width:16px;height:8px;fill:#020617" viewBox="0 0 30 10" preserveAspectRatio="none"><path d="M0 0 L15 10 L30 0 Z"/></svg>
    `;
  }, [isPanning, isSpacePressed, isCtrlPressed, floorsConfig, previewRows]);

  const handleCellPointerDown = useCallback((e, fIdx, rIdx) => {
    if (e.altKey || e.shiftKey) {
      // Allow toggle
      setSelectedCells((prev) => {
        const exists = prev.find((p) => p.fIdx === fIdx && p.rIdx === rIdx);
        if (exists) return prev.filter((p) => !(p.fIdx === fIdx && p.rIdx === rIdx));
        return [...prev, { fIdx, rIdx }];
      });
    } else {
      setSelectedCells([{ fIdx, rIdx }]);
    }
  }, []);

  const handleFigmaCanvasPointer = useCallback((e) => {
    const isPanTriggered = e.button === 1 || (e.button === 0 && (isSpacePressed || e.ctrlKey || e.metaKey));
    
    // Figma Pan mantiqi (Orta tugma yoki Space + Chap tugma)
    if (isPanTriggered) {
      e.preventDefault();
      setIsPanning(true);
      const container = scrollContainerRef.current;
      const startX = e.clientX;
      const startY = e.clientY;
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;

      const handlePointerMove = (moveEvent) => {
        container.scrollLeft = scrollLeft - (moveEvent.clientX - startX);
        container.scrollTop = scrollTop - (moveEvent.clientY - startY);
      };

      const handlePointerUp = () => {
        setIsPanning(false);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return;
    }

    // Figma Lasso (Chap tugma)
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.group\\/cell') || e.target.closest('.group\\/label')) {
      return; 
    }
    
    if (!e.altKey && !e.shiftKey) {
       setSelectedCells([]);
    }

    const container = scrollContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const startX = (e.clientX - rect.left + container.scrollLeft) / scale;
    const startY = (e.clientY - rect.top + container.scrollTop) / scale;

    selectionStartRef.current = { x: startX, y: startY };
    setSelectionBox({
      startX, startY,
      currentX: startX, currentY: startY,
      initialSelected: [...selectedCells]
    });
  }, [selectedCells, isSpacePressed, scale]);

  useEffect(() => {
    if (!selectionBox) return;

    document.body.style.userSelect = "none";
    
    let animationFrameId;
    let latestClientX = 0;
    let latestClientY = 0;
    let isDragging = true;

    const handlePointerMove = (e) => {
      latestClientX = e.clientX;
      latestClientY = e.clientY;
    };
    
    const performScrollAndSelect = () => {
      if (!isDragging) return;
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      let dx = 0;
      let dy = 0;
      const THRESHOLD = 60; 
      const SPEED = 25;
      
      // Auto-scroll logic based on cursor proximity to container edges
      if (latestClientY > 0) {
          if (latestClientY < rect.top + THRESHOLD) dy = -SPEED;
          else if (latestClientY > rect.bottom - THRESHOLD) dy = SPEED;
          
          if (latestClientX < rect.left + THRESHOLD) dx = -SPEED;
          else if (latestClientX > rect.right - THRESHOLD) dx = SPEED;
          
          if (dx !== 0 || dy !== 0) {
             container.scrollLeft += dx;
             container.scrollTop += dy;
          }
      }
      
      // Absolyut kordinatalar va mashtab
      const currentAbsX = latestClientX > 0 ? ((latestClientX - rect.left + container.scrollLeft) / scale) : selectionBox.startX;
      const currentAbsY = latestClientY > 0 ? ((latestClientY - rect.top + container.scrollTop) / scale) : selectionBox.startY;
      const startAbsX = selectionStartRef.current.x;
      const startAbsY = selectionStartRef.current.y;
      
      setSelectionBox(prev => ({
         ...prev, currentX: currentAbsX, currentY: currentAbsY
      }));
      
      // Haqiqiy vizual kordinataga tiklash
      const boxVPLeft = (Math.min(startAbsX, currentAbsX) * scale) - container.scrollLeft + rect.left;
      const boxVPRight = (Math.max(startAbsX, currentAbsX) * scale) - container.scrollLeft + rect.left;
      const boxVPTop = (Math.min(startAbsY, currentAbsY) * scale) - container.scrollTop + rect.top;
      const boxVPBottom = (Math.max(startAbsY, currentAbsY) * scale) - container.scrollTop + rect.top;
      
      const cells = document.querySelectorAll('.group\\/cell\\/input');
      const newSelectedMap = new Map();

      if (selectionBox.initialSelected) {
         selectionBox.initialSelected.forEach(p => newSelectedMap.set(`${p.fIdx}-${p.rIdx}`, p));
      }

      cells.forEach(cell => {
         const cellRect = cell.getBoundingClientRect();
         if (
             cellRect.left < boxVPRight &&
             cellRect.right > boxVPLeft &&
             cellRect.top < boxVPBottom &&
             cellRect.bottom > boxVPTop
         ) {
             const fIdx = parseInt(cell.getAttribute('data-floor'));
             const rIdx = parseInt(cell.getAttribute('data-room'));
             if (!isNaN(fIdx) && !isNaN(rIdx)) {
                newSelectedMap.set(`${fIdx}-${rIdx}`, { fIdx, rIdx });
             }
         }
      });
      setSelectedCells(Array.from(newSelectedMap.values()));
      
      animationFrameId = requestAnimationFrame(performScrollAndSelect);
    };
    
    animationFrameId = requestAnimationFrame(performScrollAndSelect);
    
    const handlePointerUp = () => {
       isDragging = false;
       cancelAnimationFrame(animationFrameId);
       setSelectionBox(null);
       selectionStartRef.current = null;
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
       isDragging = false;
       cancelAnimationFrame(animationFrameId);
       document.body.style.userSelect = "";
       window.removeEventListener('pointermove', handlePointerMove);
       window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [selectionBox ? "active" : "inactive"]);

  const addRoomBox = useCallback((floorIndex) => {
    pushState();
    setFloorsConfig((prev) =>
      prev.map((r, i) => (i === floorIndex ? [...r, { room: 1, size: "", price: "" }] : r))
    );
  }, [floorsConfig]);

  const removeRoomBox = useCallback((floorIndex, roomIndex) => {
    pushState();
    setFloorsConfig((prev) =>
      prev.map((r, i) =>
        i === floorIndex ? r.filter((_, j) => j !== roomIndex) : r
      )
    );
  }, [floorsConfig]);

  const copyFloorBelow = useCallback((floorIndex) => {
    setFloorsConfig((prev) => {
      const sourceRow = prev[floorIndex];
      return prev.map((r, i) => (i > floorIndex ? [...sourceRow] : r));
    });
    toast.success("Qavat dizayni pastki qavatlarga nusxalandi!");
  }, []);

  const clearFloor = useCallback((floorIndex) => {
    pushState();
    setFloorsConfig((prev) =>
      prev.map((r, i) => (i === floorIndex ? [] : r))
    );
  }, []);

  const handleDrop = useCallback((e, targetFIdx, targetRIdx) => {
    e.preventDefault();
    if (!draggedCell) return;
    const { fIdx: originF, rIdx: originR } = draggedCell;
    if (originF === targetFIdx && originR === targetRIdx) return;

    pushState();
    setFloorsConfig((prev) => {
      const next = prev.map((r) => [...r]);
      const itemToMove = next[originF][originR];
      
      next[originF].splice(originR, 1);
      
      let insertIdx = targetRIdx;
      // When moving in the same row from left to right, splicing the original shifts target
      if (originF === targetFIdx && originR < targetRIdx) {
         insertIdx = targetRIdx; 
      }
      
      next[targetFIdx].splice(insertIdx, 0, itemToMove);
      return next;
    });
    setDraggedCell(null);
    setDragEnabledId(null);
  }, [draggedCell]);

  const handleKeyDown = useCallback((e, fIdx, rIdx) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      let diffF = e.key === "ArrowUp" ? -1 : (e.key === "ArrowDown" ? 1 : 0);
      let diffR = e.key === "ArrowLeft" ? -1 : (e.key === "ArrowRight" ? 1 : 0);
      let nextInput = document.querySelector(`input[data-floor="${fIdx + diffF}"][data-room="${rIdx + diffR}"]`);
      if (nextInput) {
        nextInput.focus();
        e.preventDefault();
      }
    }
  }, []);

  const mirrorBlock = useCallback(() => {
    pushState();
    setFloorsConfig((prev) => prev.map((row) => [...row].reverse()));
    toast.success("Bino strukturasi gorizontal o'girildi!");
  }, []);

  const fillEmptySpaces = useCallback(() => {
    pushState();
    setFloorsConfig((prev) => {
      const maxLen = Math.max(1, ...prev.map((r) => r.length));
      return prev.map((row) => {
        if (row.length < maxLen) {
          return [...row, ...Array(maxLen - row.length).fill(1)];
        }
        return row;
      });
    });
    toast.success("Bino to'liq kvadrat shaklga keltirildi!");
  }, []);

  const handleCopyFloor = useCallback(
    (floorIndex) => {
      setClipboardRow(floorsConfig[floorIndex]);
      toast.success("Qavat xotiraga olindi! Boshqa qavatga joylashingiz mumkin.");
    },
    [floorsConfig]
  );

  const handlePasteFloor = useCallback(
    (floorIndex) => {
      if (!clipboardRow) return;
      pushState();
      setFloorsConfig((prev) =>
        prev.map((r, i) => (i === floorIndex ? [...clipboardRow] : r))
      );
      toast.success("Xotiradan joylandi!");
    },
    [clipboardRow]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const nextErrors = { ...INITIAL_ERRORS };
      const normalizedBlockNames = blockOptions.map((name) =>
        String(name).trim().toLowerCase(),
      );

      if (!normalizedName) {
        nextErrors.name = "Blok nomini kiriting.";
      } else if (normalizedBlockNames.includes(normalizedName.toLowerCase())) {
        nextErrors.name = "Bu nomdagi blok allaqachon mavjud.";
      }

      if (floor < 1) nextErrors.floor = "Kamida 1 qavat bo'lishi kerak.";
      if (baseHomesPerFloor < 1 || totalHomes < 1) {
        nextErrors.homesPerFloor = "Kamida 1 ta xonadon bo'lishi kerak.";
      }
      if (startNumber < 1) {
        nextErrors.startNumber = "Boshlang'ich raqam 1 dan kichik bo'lmasin.";
      }

      if (
        nextErrors.name ||
        nextErrors.floor ||
        nextErrors.homesPerFloor ||
        nextErrors.startNumber
      ) {
        setErrors(nextErrors);
        Object.values(nextErrors).forEach(err => {
          if (err) toast.error(err);
        });
        return;
      }

      setSubmitting(true);
      setErrors(INITIAL_ERRORS);

      try {
        const STATUS_MAP = {
          available: "EMPTY",
          reserved: "RESERVED",
          sold: "SOLD",
          not_for_sale: "NOT",
        };

        // 1. Transform current floorsConfig into requested apartment format
        const newBlockAppartment = previewRows.map((row) =>
          row.homes.map((h, rIdx) => {
            const cell = floorsConfig[previewRows.length - row.floorNumber]?.[rIdx] || {};
            return {
              room: Number(cell.room || h.roomCount || 1),
              houseNumber: Number(h.houseNumber),
              size: Number(cell.size || 0),
              price: Number(cell.price || 0),
              status: STATUS_MAP[cell.status] || "EMPTY",
              img2d: cell.img2d || "",
              img3d: cell.img3d || "",
              // Generate a temp ID or use existing if any
              id: Date.now() + Math.floor(Math.random() * 1000),
            };
          })
        );

        // 2. Calculate statistics for the new block
        const newBlockStatistics = {
          totalEmpty: 0,
          totalSold: 0,
          totalReserved: 0,
          totalNot: 0,
          total: 0,
        };

        newBlockAppartment.forEach(floorRow => {
          floorRow.forEach(apt => {
            newBlockStatistics.total++;
            if (apt.status === "EMPTY") newBlockStatistics.totalEmpty++;
            if (apt.status === "SOLD") newBlockStatistics.totalSold++;
            if (apt.status === "RESERVED") newBlockStatistics.totalReserved++;
            if (apt.status === "NOT") newBlockStatistics.totalNot++;
          });
        });

        // 3. Construct full structure
        const existingBlocks = home?.blocks || {};
        const updatedBlocks = {
          ...existingBlocks,
          [normalizedName]: {
            floor: floor,
            statistics: newBlockStatistics,
            appartment: newBlockAppartment,
          }
        };

        const allBlockEntries = Object.values(updatedBlocks);
        const maxFloor = Math.max(0, ...allBlockEntries.map(b => b.floor || 0));
        const blockCount = allBlockEntries.length;

        const totalStatistics = {
          totalEmpty: 0,
          totalSold: 0,
          totalReserved: 0,
          totalNot: 0,
          total: 0,
        };

        allBlockEntries.forEach(b => {
          totalStatistics.totalEmpty += b.statistics?.totalEmpty || 0;
          totalStatistics.totalSold += b.statistics?.totalSold || 0;
          totalStatistics.totalReserved += b.statistics?.totalReserved || 0;
          totalStatistics.totalNot += b.statistics?.totalNot || 0;
          totalStatistics.total += b.statistics?.total || 0;
        });

        const finalStructure = {
          maxFloor,
          blockCount,
          blocks: updatedBlocks,
          totalStatistics
        };

        // 4. Save to Local Storage (Temporary bypass for Backend)
        const storageKey = `tjm_draft_${id}`;
        localStorage.setItem(storageKey, JSON.stringify(finalStructure));
        
        toast.success(`${normalizedName} brauzer xotirasiga (LocalStorage) muvaffaqiyatli saqlandi!`);
        
        // Simulating redirect for UX consistency
        setTimeout(() => {
           navigate(`/tjm/${id}?block=${encodeURIComponent(normalizedName)}`);
        }, 1500);
      } catch (err) {
        console.error("Submit Error:", err);
        setErrors(prev => ({ ...prev, submit: "Tizimda kutilmagan nosozlik." }));
      } finally {
        setSubmitting(false);
      }
    },
    [baseHomesPerFloor, blockOptions, floor, floorsConfig, home, id, navigate, normalizedName, previewRows, save, totalHomes]
  );


  return (
    <TooltipProvider delayDuration={200}>
      <LoadTransition
        loading={loading}
      className="h-full"
      loader={
        <LogoLoader
          title="Blok qo'shish sahifasi yuklanmoqda"
          description="Toolbox va preview tayyorlanmoqda."
        />
      }
      loaderClassName="bg-background/92 backdrop-blur-sm"
      contentClassName="h-full"
    >
      {error ? (
        <GeneralError />
      ) : notFound ? (
        <div className="flex h-full items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <h3 className="text-2xl font-semibold">TJM topilmadi</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Blok qo'shish uchun avval mavjud TJM ni ochish kerak.
            </p>
            <Link
              className={cn(buttonVariants({ variant: "secondary" }), "mt-5")}
              to="/tjm"
            >
              TJM ga qaytish
            </Link>
          </div>
        </div>
      ) : !home ? null : (
        <>
        <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background select-none">
            <header className="bg-white px-8 py-5 flex items-center justify-between z-30 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <Link
                  className="flex items-center justify-center size-10 rounded-full bg-transparent text-slate-400 hover:text-primary transition-all group"
                  to={`/tjm/${id}`}
                >
                  <ArrowLeft className="size-5 transition-transform" />
                </Link>
                <div className="space-y-0.5">
                  <h1 className="text-[14px] font-bold tracking-tight text-slate-900">Blok qo'shish</h1>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center gap-6 px-10">
               

               
                {/* View Toggle */}
                <div className="flex items-center gap-1.5 select-none">
                  <span 
                    className={cn(
                      "text-[11px] font-bold transition-all duration-200 cursor-pointer px-1", 
                      !showRoomCount ? "text-[#00C347]" : "text-slate-400 hover:text-slate-500"
                    )} 
                    onClick={() => setShowRoomCount(false)}
                  >
                    Xonadon
                  </span>
                  <Switch 
                    checked={showRoomCount} 
                    onCheckedChange={setShowRoomCount}
                    className="h-5 w-9 data-[state=checked]:bg-[#00C347] data-[state=unchecked]:bg-slate-200"
                  />
                  <span 
                    className={cn(
                      "text-[11px] font-bold transition-all duration-200 cursor-pointer px-1", 
                      showRoomCount ? "text-[#00C347]" : "text-slate-400 hover:text-slate-500"
                    )} 
                    onClick={() => setShowRoomCount(true)}
                  >
                    Xonalar
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-100" />

                {/* Function Tools */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={mirrorBlock}
                    className="h-10 px-4 rounded-xl hover:bg-slate-50 text-slate-600 transition-all font-bold gap-2 text-[10px]"
                  >
                    <FlipHorizontal className="size-4 text-slate-300" />
                    X-akslantirish
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fillEmptySpaces}
                    className="h-10 px-4 rounded-xl hover:bg-slate-50 text-slate-600 transition-all font-bold gap-2 text-[10px]"
                  >
                    <Maximize className="size-4 text-slate-300" />
                    Avto-to'ldirish
                  </Button>
                </div>

                <div className="h-6 w-px bg-slate-100" />

                {/* History Stack */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    className="h-9 w-9 rounded-xl hover:bg-slate-50 text-slate-400 transition-all"
                  >
                    <Undo2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    className="h-9 w-9 rounded-xl hover:bg-slate-50 text-slate-400 transition-all"
                  >
                    <Redo2 className="size-4" />
                  </Button>
                </div>

                <div className="h-6 w-px bg-slate-100" />

                {/* Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                     <Building2 className="size-3.5 text-slate-400" />
                     <span className="text-[10px] font-bold text-slate-500">{floor} qavat</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                     <Ruler className="size-3.5 text-slate-400" />
                     <span className="text-[10px] font-bold text-slate-500">{totalHomes} xonadon</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting} 
                  className="h-11 px-8 rounded-2xl bg-[#00C347] hover:bg-[#00C347]/90 text-white font-bold text-xs shadow-none border border-[#00C347] transition-all active:scale-95 flex items-center gap-2 group"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin size-4" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Blokni saqlash
                </Button>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 overflow-hidden relative">
              {/* LEFT SIDEBAR: Controls & Inputs */}
              <aside 
                className={cn(
                  "shrink-0 bg-white border-r border-slate-100 flex flex-col transition-all duration-300 relative z-30",
                  !leftSidebarOpen && "w-0 opacity-0 -translate-x-full overflow-hidden"
                )}
                style={{ width: leftSidebarOpen ? leftWidth : 0 }}
              >
                {/* Resize Handle Left */}
                <div 
                  onMouseDown={(e) => { e.preventDefault(); setIsResizingLeft(true); }}
                  className="absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-50 group hover:bg-primary/20 transition-all flex items-center justify-center"
                >
                   <div className="h-8 w-1 bg-slate-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center justify-between p-6 border-b border-slate-50">
                  <h3 className="text-[11px] font-bold text-slate-400">Blok sozlamalari</h3>
                  <Button variant="ghost" size="icon" className="size-8 rounded-xl text-slate-400 hover:text-slate-900 transition-colors" onClick={() => setLeftSidebarOpen(false)}>
                    <PanelLeftClose className="size-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-7 space-y-10">
                  {/* Form Inputs with ultra-modern design */}
                  <div className="space-y-7">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-bold text-slate-400 ml-1">Blok nomi</Label>
                      <Input
                        placeholder="Masalan: B-BLOK"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      className={cn(
                        "h-11 rounded-xl bg-slate-50/50 border-slate-100 transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary",
                        errors.name && "border-red-400 focus:ring-red-50"
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-400 ml-1">Qavatlar*</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={form.floor}
                        onChange={(e) => setForm(f => ({ ...f, floor: e.target.value }))}
                        className="h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-400 ml-1">Uylar/qavat*</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={form.homesPerFloor}
                        onChange={(e) => setForm(f => ({ ...f, homesPerFloor: e.target.value }))}
                        className="h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 ml-1">Boshlang'ich №*</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.startNumber}
                      onChange={(e) => setForm(f => ({ ...f, startNumber: e.target.value }))}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                   <Label className="text-[11px] font-bold text-slate-400 ml-1">Tezkor shablonlar</Label>
                   <div className="space-y-2">
                      {PRESETS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => applyPreset(p)}
                          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-primary">{p.label}</span>
                          <span className="text-[10px] font-medium text-slate-400 group-hover:text-primary/70">{p.floor} q. • {p.homesPerFloor} x.</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <Label className="text-[11px] font-bold text-slate-400 ml-1">Ko'rinish boshqaruvi</Label>
                   <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-1 rounded-xl border border-slate-100">
                      <button 
                        onClick={() => setPreviewVariant("default")}
                        className={cn(
                          "py-2 text-[11px] font-bold rounded-lg transition-all",
                          previewVariant === "default" ? "bg-white shadow-sm text-primary ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        Shaxmatka
                      </button>
                      <button 
                        onClick={() => setPreviewVariant("expanded")}
                        className={cn(
                          "py-2 text-[11px] font-bold rounded-lg transition-all",
                          previewVariant === "expanded" ? "bg-white shadow-sm text-primary ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        Keng
                      </button>
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <Label className="text-[11px] font-bold text-slate-400 ml-1">Ko'rsatkichlar</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold">Jami qavat</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="size-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <Layers3 className="size-3.5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{floor}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold">Jami xonadon</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="size-6 rounded-lg bg-blue-50 flex items-center justify-center">
                          <LayoutPanelLeft className="size-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{totalHomes}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {errors.submit && (
                  <div className="ring-1 ring-red-200 bg-red-50 p-4 rounded-xl text-red-600 text-xs font-semibold animate-shake">
                    {errors.submit}
                  </div>
                )}
              </div>
            </aside>

            {/* CENTER CANVAS: Builder Grid Preview */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#f9fbff] dark:bg-[#09090b] relative">
              {/* Pro Studio Grid Background */}
              <div 
                className="absolute inset-0 z-0 opacity-[0.4] dark:opacity-[0.1]" 
                style={{ 
                  backgroundImage: `
                    radial-gradient(circle at 2px 2px, #e2e8f0 1.5px, transparent 0),
                    linear-gradient(to right, #f1f5f9 1px, transparent 1px),
                    linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px, 120px 120px, 120px 120px'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/40 pointer-events-none" />
              
              {/* Floating Sidebar Toggles */}
              {!leftSidebarOpen && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-6 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white border border-slate-100 text-slate-300 hover:text-primary size-11 transition-all group"
                      onClick={() => setLeftSidebarOpen(true)}
                    >
                      <PanelLeftOpen className="size-5 transition-transform" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold border-none shadow-2xl">Sozlamalar panelini ochish</TooltipContent>
                </Tooltip>
              )}
              
              {!rightSidebarOpen && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-6 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white border border-slate-100 text-slate-300 hover:text-primary size-11 transition-all group"
                      onClick={() => setRightSidebarOpen(true)}
                    >
                      <PanelRightOpen className="size-5 transition-transform" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold border-none shadow-2xl">Uy xususiyatlari panelini ochish</TooltipContent>
                </Tooltip>
              )}


              <div className="px-8 py-3 border-b border-slate-100 bg-white flex items-center justify-between relative z-10 w-full">
                <div className="flex gap-6 sm:gap-10 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-2.5 whitespace-nowrap group cursor-default">
                     <div className="size-2.5 rounded-full bg-[#00C347]" />
                     <span className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Bo'sh</span>
                  </div>
                  <div className="flex items-center gap-2.5 whitespace-nowrap group cursor-default">
                     <div className="size-2.5 rounded-full bg-[#FFBA01]" />
                     <span className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Bron</span>
                  </div>
                  <div className="flex items-center gap-2.5 whitespace-nowrap group cursor-default">
                     <div className="size-2.5 rounded-full bg-[#B70000]" />
                     <span className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Sotilgan</span>
                  </div>
                  <div className="flex items-center gap-2.5 whitespace-nowrap group cursor-default">
                     <div className="size-2.5 rounded-full bg-[#90A0B7]" />
                     <span className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Sotilmaydi</span>
                  </div>
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 ml-4 select-none shrink-0" title="Mashtabni o'zgartirish (Zoom)">
                  <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="size-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded transition-all text-slate-500 hover:text-slate-900 focus:outline-none">
                     <Minus className="size-3" />
                  </button>
                  <div className="w-12 text-center text-[10px] font-bold text-slate-600 font-mono cursor-pointer hover:text-slate-900" title="100% ga qaytarish" onClick={() => setScale(1)}>
                     {Math.round(scale * 100)}%
                  </div>
                  <button onClick={() => setScale(s => Math.min(4, s + 0.1))} className="size-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded transition-all text-slate-500 hover:text-slate-900 focus:outline-none">
                     <Plus className="size-3" />
                  </button>
                </div>
              </div>

              <div 
                ref={scrollContainerRef}
                className={cn(
                  "flex-1 overflow-auto relative z-10 p-4 sm:p-6 lg:p-10 flex [scrollbar-gutter:stable]",
                  isSpacePressed || isCtrlPressed || isPanning ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""
                )}
                onPointerDown={handleFigmaCanvasPointer}
              >
                <div style={{ zoom: scale }} className={cn("relative min-w-max m-auto", (isSpacePressed || isCtrlPressed || isPanning) && "pointer-events-none")}>
                {/* Visual Intersect Box */}
                {selectionBox && (
                  <div 
                    className="absolute border-[1.5px] border-primary/50 bg-primary/20 z-50 pointer-events-none rounded-[4px]"
                    style={{
                      left: Math.min(selectionBox.startX, selectionBox.currentX),
                      top: Math.min(selectionBox.startY, selectionBox.currentY),
                      width: Math.abs(selectionBox.currentX - selectionBox.startX),
                      height: Math.abs(selectionBox.currentY - selectionBox.startY),
                    }}
                  />
                )}

                {/* Visual Interactive Builder */}
                <div className="flex flex-col gap-3 pb-24 max-w-full">
                  {floorsConfig.map((row, floorIndex) => {
                    const floorNumber = floor - floorIndex;
                    return (
                      <div key={`floor-${floorNumber}`} className="flex items-center gap-3 min-w-max group/row">
                         {/* Floor Label with Bulk Actions */}
                         <div className="relative group/label flex items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-100 bg-white text-xs font-bold tracking-tighter transition-all hover:border-primary group-hover/label:bg-primary group-hover/label:text-white group-hover/label:border-primary cursor-pointer select-none">
                              {floorNumber}
                            </div>
                            
                            {/* Hover Actions Panel (Manual Floating Popover) */}
                            <div className="absolute left-1/2 -top-12 -translate-x-1/2 flex items-center gap-1 px-1.5 py-1 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl opacity-0 pointer-events-none group-hover/label:opacity-100 group-hover/label:translate-y-[-4px] group-hover/label:pointer-events-auto transition-all duration-200 z-50 before:absolute before:inset-x-0 before:-bottom-4 before:h-6 before:content-['']">
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => copyFloorBelow(floorIndex)}
                                      className="flex items-center justify-center size-8 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
                                      type="button"
                                    >
                                      <ArrowDownToLine className="size-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-[#020617] text-white border-none shadow-xl fill-[#020617] px-3 py-1.5 rounded-lg overflow-visible">Pastdagi barcha qavatlarga nusxalash</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopyFloor(floorIndex)}
                                      className="flex items-center justify-center size-8 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
                                      type="button"
                                    >
                                      <ClipboardCopy className="size-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-[#020617] text-white border-none shadow-xl fill-[#020617] px-3 py-1.5 rounded-lg overflow-visible">Qavat nusxasini olish</TooltipContent>
                                </Tooltip>
                                
                                {clipboardRow && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handlePasteFloor(floorIndex)}
                                        className="flex items-center justify-center size-8 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                        type="button"
                                      >
                                        <ClipboardPaste className="size-4" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-[#020617] text-white border-none shadow-xl fill-[#020617] px-3 py-1.5 rounded-lg overflow-visible">Xotiradagi qavatni joylash</TooltipContent>
                                  </Tooltip>
                                )}
                                
                                <div className="w-px h-5 bg-slate-100 mx-1" />
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => clearFloor(floorIndex)}
                                      className="flex items-center justify-center size-8 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                      type="button"
                                    >
                                      <Eraser className="size-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-[#020617] text-white border border-white/10 px-3 py-1.5 rounded-lg overflow-visible">Qavatni tozalash</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Real SVG Arrow Pointer Bottom (Dumcha) */}
                              <svg 
                                className="absolute top-full left-1/2 -translate-x-1/2 -mt-[0.5px] w-4 h-2 text-white fill-current border-none" 
                                viewBox="0 0 30 10" 
                                preserveAspectRatio="none"
                              >
                                <path d="M0 0 L15 10 L30 0 Z" />
                              </svg>
                            </div>
                          </div>
                         <div className="flex gap-2 min-w-[60px] p-1 border-y border-transparent transition-colors items-center">
                           {row.map((cellObj, roomIndex) => {
                              const homeDetails = previewRows[floorIndex]?.homes[roomIndex];
                              const numRooms = Number(cellObj?.room) || 1;
                              const isSelected = selectedCells.some(p => p.fIdx === floorIndex && p.rIdx === roomIndex);
                              
                              const statusClass = 
                                 cellObj.status === "sold" ? "bg-[#B70000] border-transparent text-white font-bold" :
                                 cellObj.status === "reserved" ? "bg-[#FFBA01] border-transparent text-white font-bold" :
                                 cellObj.status === "not_for_sale" ? "bg-[#90A0B7] border-transparent text-white font-bold" :
                                 "bg-[#00C347] border-transparent text-white font-bold";
                              
                              const isDragging = draggedCell?.fIdx === floorIndex && draggedCell?.rIdx === roomIndex;
                              const dragId = `${floorIndex}-${roomIndex}`;

                              return (
                                  <div 
                                    key={roomIndex}
                                    className={cn(
                                      "relative group/cell",
                                      isDragging ? "opacity-30" : ""
                                    )}
                                    draggable={dragEnabledId === dragId}
                                    onMouseMove={(e) => handleCellMouseMove(e, floorIndex, roomIndex)}
                                    onMouseLeave={() => { if (tooltipRef.current) tooltipRef.current.style.display = 'none'; }}
                                    onDragStart={(e) => {
                                      setDraggedCell({ fIdx: floorIndex, rIdx: roomIndex });
                                      e.dataTransfer.effectAllowed = "move";
                                    }}
                                    onDragEnd={() => {
                                      setDraggedCell(null);
                                      setDragEnabledId(null);
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, floorIndex, roomIndex)}
                                  >
                                         <div 
                                           onMouseEnter={() => setDragEnabledId(dragId)}
                                           onMouseLeave={() => setDragEnabledId(null)}
                                           className={cn(
                                             "absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 cursor-grab text-slate-300 z-30 p-1 bg-white rounded border border-slate-100 transition-all",
                                             isDragging && "cursor-grabbing scale-110 border-primary text-primary opacity-100"
                                           )}
                                         >
                                          <GripVertical className="size-3" />
                                        </div>

                                        <Input 
                                          type={showRoomCount ? "number" : "text"}
                                          min="1"
                                          max="8"
                                          data-floor={floorIndex}
                                          data-room={roomIndex}
                                          onPointerDown={(e) => handleCellPointerDown(e, floorIndex, roomIndex)}
                                          onKeyDown={(e) => handleKeyDown(e, floorIndex, roomIndex)}
                                          className={cn(
                                            "group/cell/input w-16 h-12 text-center text-xs font-bold p-0 transition-all no-spinners border bg-white rounded-xl ring-inset ring-black/5",
                                            statusClass,
                                            isSelected ? "ring-2 ring-primary ring-offset-2 z-20 scale-105" : "",
                                            previewVariant === "expanded" ? "w-24 h-16 text-base" : ""
                                          )}
                                          value={showRoomCount ? (cellObj?.room ?? cellObj) : (cellObj?.customNumber || homeDetails?.houseNumber || "")}
                                          onChange={(e) => updateRoomBox(floorIndex, roomIndex, showRoomCount ? "room" : "customNumber", e.target.value)}
                                        />

                                        <Tooltip delayDuration={0}>
                                          <TooltipTrigger asChild>
                                            <button 
                                              onMouseEnter={() => { suppressDetailsRef.current = `${floorIndex}-${roomIndex}`; if (tooltipRef.current) tooltipRef.current.style.display = 'none'; }}
                                              onMouseLeave={() => { suppressDetailsRef.current = null; }}
                                              onClick={() => {
                                                  removeRoomBox(floorIndex, roomIndex);
                                                  setSelectedCells(prev => prev.filter(p => !(p.fIdx === floorIndex && p.rIdx === roomIndex)));
                                              }}
                                              className="absolute -top-2 -right-2 bg-destructive text-white size-5 rounded-full opacity-0 group-hover/cell:opacity-100 flex items-center justify-center border border-destructive/20 transition-all scale-90 hover:scale-100 z-10 hover:bg-red-600"
                                              type="button"
                                            >
                                              <Minus className="size-3" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="text-white border-none shadow-xl px-3 py-1.5 rounded-lg overflow-visible">Xonadonni o'chirish</TooltipContent>
                                        </Tooltip>

                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/cell:opacity-100 font-mono transition-opacity pointer-events-none z-20 bg-background/95 border border-slate-100 px-1.5 py-0.5 rounded-md">
                                          #{homeDetails?.houseNumber}
                                        </div>
                                  </div>
                               );
                            })}
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <button 
                                  onClick={() => addRoomBox(floorIndex)}
                                  className={cn(
                                    "border-2 border-dashed border-slate-200 hover:border-primary/50 text-slate-300 hover:text-primary rounded-xl flex items-center justify-center transition-all shrink-0 bg-white/50 backdrop-blur-sm group/add-room",
                                    previewVariant === "expanded" ? "w-24 h-16" : "w-16 h-12"
                                  )}
                                >
                                  <PlusCircle className="size-5 group-hover/add-room:scale-110 transition-transform" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="bg-slate-900 text-white rounded-xl px-3 py-1.5 text-[10px] font-bold border-none shadow-2xl">Xonadon qo'shish</TooltipContent>
                            </Tooltip>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Floating Tooltip — DOM directly controlled, zero re-renders */}
            <FloatingTooltip tooltipRef={tooltipRef} />
            </main>

            {/* RIGHT SIDEBAR: Inspector Panel */}
            <aside 
              className={cn(
                "shrink-0 bg-white border-l border-slate-100 flex flex-col transition-all duration-300 relative z-30",
                !rightSidebarOpen && "w-0 opacity-0 translate-x-full overflow-hidden"
              )}
              style={{ width: rightSidebarOpen ? rightWidth : 0 }}
            >
              {/* Resize Handle Right */}
              <div 
                onMouseDown={(e) => { e.preventDefault(); setIsResizingRight(true); }}
                className="absolute top-0 -left-1.5 w-3 h-full cursor-col-resize z-50 group hover:bg-primary/20 transition-all flex items-center justify-center"
              >
                 <div className="h-8 w-1 bg-slate-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center justify-between p-5 border-b border-slate-50">
                <div className="flex items-center gap-2">
                   <Ruler className="size-4 text-slate-400" />
                   <h3 className="text-[11px] font-bold text-slate-400">Inspektor</h3>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCells.length > 0 && (
                    <button 
                      onClick={() => setSelectedCells([])} 
                      className="text-[10px] font-bold text-primary hover:text-primary/70 transition-colors mr-2"
                      type="button"
                    >
                      Tozalash
                    </button>
                  )}
                  <Button variant="ghost" size="icon" className="size-8 rounded-xl text-slate-400 hover:text-slate-900 transition-colors" onClick={() => setRightSidebarOpen(false)}>
                    <PanelRightClose className="size-4" />
                  </Button>
                </div>
              </div>
              
              {selectedCells.length > 0 ? (
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                  {(() => {
                    const firstCellRef = selectedCells[0];
                    if (!firstCellRef) return null;
                    const { fIdx, rIdx } = firstCellRef;
                    
                    const firstCellData = floorsConfig[fIdx]?.[rIdx] || { room: 1, size: "", price: "" };
                    const isMulti = selectedCells.length > 1;
                    const isSameRoom = selectedCells.every(p => floorsConfig[p.fIdx]?.[p.rIdx]?.room === firstCellData.room);
                    const isSameSize = selectedCells.every(p => floorsConfig[p.fIdx]?.[p.rIdx]?.size === firstCellData.size);
                    const isSamePrice = selectedCells.every(p => floorsConfig[p.fIdx]?.[p.rIdx]?.price === firstCellData.price);
                    const isSameCustomNumber = selectedCells.every(p => floorsConfig[p.fIdx]?.[p.rIdx]?.customNumber === firstCellData.customNumber);
                    
                    const displayRoom = isSameRoom ? firstCellData.room : "";
                    const displaySize = isSameSize ? firstCellData.size : "";
                    const displayPrice = isSamePrice ? firstCellData.price : "";
                    const displayCustomNumber = isSameCustomNumber ? firstCellData.customNumber : "";

                    const homeDetails = previewRows[fIdx]?.homes[rIdx];

                    return (
                      <>
                        <div className="relative group p-6 rounded-[24px] border-2 border-slate-100 bg-white text-center space-y-2">
                           <div className="text-[11px] font-bold text-slate-400">
                              {isMulti ? `${selectedCells.length} ta xonadon` : `Xonadon №${homeDetails?.houseNumber ?? "?"}`}
                           </div>
                           <div className="text-3xl font-bold text-slate-900">
                              {isSameRoom ? `${displayRoom} xona` : "Turlicha"}
                           </div>
                           {!isMulti && (
                             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
                                <Layers3 className="size-3" />
                                {floor - fIdx}-qavat • {rIdx + 1}-o'rin
                             </div>
                           )}
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-400 ml-1">Xonadon raqami</Label>
                            <Input
                              type="text"
                              className="h-11 rounded-xl bg-slate-50/50 border-slate-100 font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
                              placeholder={isMulti && !isSameCustomNumber ? "Turlicha" : "Masalan: 12A"}
                              value={displayCustomNumber}
                              onChange={(e) => applyToSelected("customNumber", e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-400 ml-1">Xonalar</Label>
                              <Input
                                type="number"
                                min="1"
                                max="8"
                                className="h-11 rounded-xl bg-slate-50/50 border-slate-100 font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
                                placeholder={isMulti && !isSameRoom ? "0" : ""}
                                value={displayRoom}
                                onChange={(e) => applyToSelected("room", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-400 ml-1">Maydon (m²)</Label>
                              <Input
                                type="number"
                                min="0"
                                className="h-11 rounded-xl bg-slate-50/50 border-slate-100 font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
                                placeholder={isMulti && !isSameSize ? "0" : "0.00"}
                                value={displaySize}
                                onChange={(e) => applyToSelected("size", e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-400 ml-1">1 m² narxi ($/so'm)</Label>
                            <Input
                              type="number"
                              min="0"
                              className="h-11 rounded-xl bg-slate-50/50 border-slate-100 font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
                              placeholder={isMulti && !isSamePrice ? "Turlicha" : "0.00"}
                              value={displayPrice}
                              onChange={(e) => applyToSelected("price", e.target.value)}
                            />
                          </div>

                          <div className="space-y-3 pt-4 border-t border-slate-50">
                             <Label className="text-[11px] font-bold text-slate-400 ml-1">Xonadon holati (Status)</Label>
                             <div className="grid grid-cols-2 gap-2">
                               {[
                                 { id: "available", label: "Bo'sh", color: "bg-[#00C347]" },
                                 { id: "reserved", label: "Bron", color: "bg-[#FFBA01]" },
                                 { id: "sold", label: "Sotilgan", color: "bg-[#B70000]" },
                                 { id: "not_for_sale", label: "Yopiq", color: "bg-[#90A0B7]" },
                               ].map((st) => {
                                 const currentStatus = isMulti 
                                   ? (selectedCells.every(p => (floorsConfig[p.fIdx]?.[p.rIdx]?.status || "available") === st.id) ? st.id : null)
                                   : (firstCellData.status || "available") === st.id ? st.id : null;

                                 const isSelected = currentStatus === st.id;

                                 return (
                                   <button
                                     key={st.id}
                                     type="button"
                                     onClick={() => applyToSelected("status", st.id)}
                                     className={cn(
                                       "flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all",
                                       isSelected 
                                         ? "bg-slate-50 border-primary/40 text-primary" 
                                         : "bg-slate-50/50 border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/80"
                                     )}
                                   >
                                     <div className={cn("size-2 rounded-full shrink-0", st.color)} />
                                     {st.label}
                                   </button>
                                 );
                               })}
                             </div>
                          </div>
                        </div>


                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                  <div className="relative mb-8">
                    <div className="relative size-24 rounded-[32px] bg-white border border-slate-100 flex items-center justify-center group">
                      <MousePointer2 className="size-10 text-primary/40 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                    </div>
                  </div>
                  
                  <div className="max-w-[240px] space-y-3 mb-12">
                    <h3 className="text-sm font-bold text-slate-800">Inspektor tayyor</h3>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed px-2">
                       Chizmadagi istalgan katakchani tanlang va uning xususiyatlarini boshqaring.
                    </p>
                  </div>

                  <div className="mt-auto pt-8" />
                </div>
              )}

              <div className="p-6 border-t border-slate-50 mt-auto">
                {selectedCells.length === 0 && (
                  <Button 
                     variant="outline"
                     onClick={() => setIsShortcutsOpen(true)}
                     className="w-full h-11 rounded-2xl text-slate-400 hover:text-slate-900 border-slate-100 hover:bg-slate-50 transition-all gap-2 text-[11px] font-bold"
                  >
                     <MousePointer2 className="size-4" />
                     Shortcuts
                  </Button>
                )}
              </div>
            </aside>
          </div>
        </section>
        
        {/* Shortcuts Modal (Figma-style Premium) */}
        {isShortcutsOpen && (
           <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[8px] animate-in fade-in duration-500" 
                onClick={() => setIsShortcutsOpen(false)} 
              />
              <div className="relative bg-white rounded-[32px] w-full max-w-xl shadow-[0_32px_128px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                  {/* Header */}
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-b from-slate-50/50 to-transparent">
                     <div className="flex items-center gap-5">
                        <div className="size-14 rounded-[22px] bg-primary/10 flex items-center justify-center ring-8 ring-primary/[0.03]">
                           <MousePointer2 className="size-7 text-primary" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Shortcutlar</h2>
                           <p className="text-sm text-slate-400 font-semibold mt-0.5">Tezkor tugmalar va navigatsiya</p>
                        </div>
                     </div>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="size-10 rounded-full hover:bg-slate-100/80 text-slate-300 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100" 
                       onClick={() => setIsShortcutsOpen(false)}
                     >
                        <Plus className="size-5 rotate-45" />
                     </Button>
                  </div>
                  
                  {/* Content Grid */}
                  <div className="p-10 grid grid-cols-2 gap-x-14 gap-y-10">
                     {/* Navigatsiya */}
                     <div className="space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="size-1.5 rounded-full bg-primary" />
                           <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Navigatsiya</h3>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between group">
                              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Surgich (Pan)</span>
                              <div className="flex gap-1.5">
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm min-w-[42px] text-center">SPACE</kbd>
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm">DRAG</kbd>
                              </div>
                           </div>
                           <div className="flex items-center justify-between group">
                              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Mashtab (Zoom)</span>
                              <div className="flex gap-1.5">
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm min-w-[42px] text-center">CTRL</kbd>
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm">WHEEL</kbd>
                              </div>
                           </div>
                           <div className="flex items-center justify-between group">
                              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Tezkor Pan</span>
                              <div className="flex gap-1.5">
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm min-w-[42px] text-center">CTRL</kbd>
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm">DRAG</kbd>
                              </div>
                           </div>
                        </div>
                     </div>
                     
                     {/* Tahrirlash */}
                     <div className="space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="size-1.5 rounded-full bg-orange-400" />
                           <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Tahrirlash</h3>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between group">
                              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Ko'p tanlash</span>
                              <div className="flex gap-1.5">
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm min-w-[36px] text-center">ALT</kbd>
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm">CLICK</kbd>
                              </div>
                           </div>
                           <div className="flex items-center justify-between group">
                              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Orqaga (Undo)</span>
                              <div className="flex gap-1">
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm">CTRL + Z</kbd>
                              </div>
                           </div>
                           <div className="flex items-center justify-between group">
                              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Oldinga (Redo)</span>
                              <div className="flex gap-1">
                                 <kbd className="px-2 py-1 bg-white border-b-2 border-slate-200 border-x border-t border-slate-100 rounded-lg text-[10px] font-black text-slate-600 shadow-sm">CTRL + Y</kbd>
                              </div>
                           </div>
                        </div>
                     </div>
                     
                     {/* Tip Box */}
                     <div className="col-span-2 p-6 rounded-[24px] bg-slate-50 border border-slate-100 mt-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
                           <Layers3 className="size-16 text-slate-900" />
                        </div>
                        <div className="flex items-start gap-4 h-full">
                           <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                              <Layers3 className="size-5 text-primary" />
                           </div>
                           <p className="text-[12px] text-slate-500 font-bold leading-relaxed pr-8">
                             Sichqonchaning chap tugmasini bo'sh joydan bosib tortish orqali xonadonlarni <span className="text-slate-900 underline decoration-primary/30 decoration-2 underline-offset-2">Lasso Selection</span> (ommaviy belgilash) qilishingiz mumkin.
                           </p>
                        </div>
                     </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="p-8 px-10 bg-slate-50/50 border-t border-slate-50 flex justify-end">
                     <Button 
                       onClick={() => setIsShortcutsOpen(false)} 
                       className="rounded-[20px] px-12 h-14 font-extrabold bg-[#00C347] hover:bg-[#00C347]/90 text-white shadow-[0_12px_24px_rgba(0,195,71,0.25)] transition-all active:scale-[0.97] text-sm"
                     >
                       Tushunarli
                     </Button>
                  </div>
              </div>
           </div>
        )}
        </>
      )}
      </LoadTransition>
    </TooltipProvider>
  );
}
