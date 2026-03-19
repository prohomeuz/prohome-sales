# CLAUDE.md — ProHome Sales

Ushbu fayl har bir Claude sessiyasida avtomatik o'qiladi.
Loyihada ishlashdan oldin ushbu qoidalarni to'liq o'qib chiqing.

---

## Loyiha haqida

**ProHome Sales** — ko'p qavatli uy-joy komplekslari (TJM) sotuvini boshqarish paneli.
**Til**: O'zbek tili (barcha UI matni o'zbekcha)
**Framework**: React 19 + Vite + Tailwind CSS v4
**Arxitektura**: Feature-Sliced Design (FSD)

To'liq tavsif: `docs/project-report.md`

---

## 1. FSD Import qoidasi — QAT'IY

```
shared → entities → features → widgets → pages → app
```

**Pastki qatlam yuqoriga import qila olmaydi.**

```js
// ✅ To'g'ri
// widgets/ → shared/ dan import
import { cn } from "@/shared/lib/utils";

// ✅ To'g'ri
// features/ → entities/ dan import
import { useAppStore } from "@/entities/session/model";

// ❌ XATO — shared/ entities/ dan import qila olmaydi
// shared/ui/SomeComponent.jsx:
import { useAppStore } from "@/entities/session/model"; // FORBIDDEN

// ❌ XATO — entities/ widgets/ dan import qila olmaydi
import SomeWidget from "@/widgets/SomeWidget"; // FORBIDDEN
```

---

## 2. Yangi fayl qo'shayotganda — qaerga?

| Nima qo'shyapsan? | Qaerga? |
|-------------------|---------|
| Yangi sahifa (route) | `src/pages/<page-name>/ui/<PageName>.jsx` |
| Katta qayta ishlatiladigan UI bo'lim | `src/widgets/<widget-name>/ui/` |
| Biznes logika (CRUD, validatsiya) | `src/features/<feature-name>/` |
| Domain model / API hook | `src/entities/<domain>/model/` |
| Domain UI (CurrencyBadge kabi) | `src/entities/<domain>/ui/` |
| Generic UI komponent (shadcn) | `src/shared/ui/` |
| Generic utility hook | `src/shared/hooks/` |
| Umumiy yordamchi funksiya | `src/shared/lib/utils.js` |
| Global konstanta | `src/shared/config/constants.js` |

---

## 3. Komponent yozish qoidalari

### Hajm chegarasi
- **Har bir komponent ≤ 400 qator**
- Oshsa — sub-komponentlarga bo'l

### Presentational vs Orchestrator

```jsx
// ORCHESTRATOR — state va handlers bu yerda
// pages/ va asosiy widget fayllarida
export default function TjmDetails() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({...});

  return (
    <TjmFilterBar
      filterOpen={filterOpen}
      onToggleFilter={() => setFilterOpen(v => !v)}
      filters={filters}
    />
  );
}

// PRESENTATIONAL — faqat props, hook chaqirmaydi
// ui/ papkadagi sub-komponentlar
export default function TjmFilterBar({ filterOpen, onToggleFilter }) {
  return <div>...</div>; // hooks yo'q, faqat props
}
```

### JSDoc yozing (public komponentlar uchun)

```jsx
/**
 * @param {{
 *   home: object,
 *   onClose: () => void,
 * }} props
 */
export default function RoomHeader({ home, onClose }) { ... }
```

---

## 4. Muhim import yo'llari

```js
// ✅ Har doim shu yo'llardan foydalaning

// Global state
import { useAppStore } from "@/entities/session/model";

// UI komponentlar (FAQAT shared/ui/ dan)
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import { formatNumber } from "@/shared/lib/utils";

// API client
import { apiRequest, apiUrl } from "@/shared/lib/api";

// Konstantalar
import { TOAST_OPTS, UZ_PHONE_REGEX } from "@/shared/config/constants";

// Toast
import { toast } from "sonner";

// Ikonlar (FAQAT lucide-react)
import { ArrowLeft, Check } from "lucide-react";

// ❌ TO'G'RIDAN-TO'G'RI IMPORT QILMASLIK
import { Label } from "@radix-ui/react-label"; // XATO — @/shared/ui/label ishlatish
import { Button } from "@radix-ui/react-button"; // XATO
```

---

## 5. Entity hooklar — qayerdan import qilish

```js
// ✅ TO'G'RI — bevosita entities/features dan
import { useCompanies } from "@/entities/company/model/use-companies";
import { useProjectStructure } from "@/entities/project/model/use-project-structure";
import { useUserCrud } from "@/features/user-crud/model/use-user-crud";
import { useRoomStatus } from "@/features/room-status-change/model/use-room-status";

// ⚠️ DEPRECATED — shared/hooks/ wrapperlar (backward compat uchun bor, yangi kodda ishlatmaslik)
import { useCompanies } from "@/shared/hooks/use-companies"; // deprecated
```

---

## 6. STATUS konstantalar

```js
// TJM sahifasi uchun
import { STATUS_CLASS, STATUS_LABEL } from "@/pages/tjm-details/lib/constants";
// { SOLD: "bg-red-700", RESERVED: "bg-yellow-400", EMPTY: "bg-green-500", NOT: "bg-slate-400" }

// Kalkulyator uchun
import { statusBadgeClass, statusLabels } from "@/widgets/calculator/lib/constants";
```

---

## 7. Toast pattern

```js
import { toast } from "sonner";
import { TOAST_OPTS } from "@/shared/config/constants";

toast.success("Muvaffaqiyatli saqlandi", TOAST_OPTS);
toast.error("Xatolik yuz berdi", TOAST_OPTS);
toast.loading("Yuklanmoqda...", TOAST_OPTS);
```

---

## 8. Lazy komponent pattern

```jsx
import { lazy, Suspense, useState } from "react";

// Module darajasida — komponent tashqarida, bir marta yaratiladi
const LazyGenplanViewerButton = lazy(
  () => import("@/widgets/GenplanViewerButton")
);

// Komponent ichida
const [loaded, setLoaded] = useState(false);
const [signal, setSignal] = useState(0);

// Trigger
function handleOpen() {
  setLoaded(true);
  setSignal(s => s + 1);
}

// Render
{loaded ? (
  <Suspense fallback={<Button disabled>...</Button>}>
    <LazyGenplanViewerButton openSignal={signal} onVisibleChange={...} />
  </Suspense>
) : (
  <Button onClick={handleOpen}>Genplan</Button>
)}
```

---

## 9. URL sync pattern

```jsx
import { useLocation, useNavigate } from "react-router-dom";

const l = useLocation();
const navigate = useNavigate();

// Parametr qo'shish
function handleSelect(id) {
  const params = new URLSearchParams(l.search);
  params.set("details", id);
  navigate({ pathname: l.pathname, search: `?${params}` }, { replace: true });
}

// Parametr o'chirish
function handleClose() {
  const params = new URLSearchParams(l.search);
  params.delete("details");
  const nextSearch = params.toString();
  navigate({
    pathname: l.pathname,
    search: nextSearch ? `?${nextSearch}` : "",
  }, { replace: true });
}
```

---

## 10. Mavjud sahifalar va widgetlar — o'zgartirish oldidan o'qi

| Fayl | Qator | Oldin o'qish shart? |
|------|-------|---------------------|
| `widgets/calculator/ui/CalculatorTool.jsx` | 860 | ✅ HA — murakkab state |
| `pages/TjmDetails.jsx` | 521 | ✅ HA — URL sync, worker |
| `pages/CompanyDetails.jsx` | 508 | ✅ HA — reducer, logo |
| `widgets/HomeDetails.jsx` | 341 | ✅ HA — URL sync |
| `widgets/user-table/ui/UserManagementPage.jsx` | 397 | ✅ HA — role config |
| `pages/tjm-details/lib/filter-utils.js` | 285 | ✅ HA — filter logika |
| `widgets/calculator/lib/helpers.js` | 292 | ✅ HA — hisob logika |

---

## 11. Build tekshirish

Har qanday o'zgartirish yakunida:

```bash
npm run build
```

**Muvaffaqiyat belgisi**: `✓ built in N.NNs` (xatosiz)

---

## 12. Rollar

| Rol | Kirish imkoniyati |
|-----|-------------------|
| `SUPERADMIN` | Barcha sahifalar |
| `ADMIN` | Company, TJM, Contracts, Dashboard, CRM, Settings |
| `ROP` | SalesManager, TJM, Contracts, Dashboard, CRM |
| `SALESMANAGER` | TJM, CRM |

`app/router.jsx` → `getRoleRoutes(role)` funksiyasi.

---

## 13. Nima qilmaslik

```
❌ shared/ui/ ga useAppStore yoki API call qo'shmaslik
❌ shared/hooks/ ga entity-specific hook qo'shmaslik
❌ Radix UI to'g'ridan-to'g'ri import (@radix-ui/react-*)
❌ Bir xil konstantani bir necha faylda takrorlash
❌ Komponentni 400 qatordan oshirish
❌ srcset (HTML) o'rniga srcSet (React) ni unutmaslik
❌ npm run build ni tekshirmay commit qilmaslik
```

---

## 14. Tez murojaat

```
docs/project-report.md  ← To'liq loyiha tavsifi
src/shared/lib/utils.js  ← cn, formatNumber, getFormData
src/shared/lib/api.js    ← apiRequest, apiUrl
src/shared/config/constants.js  ← Barcha global konstantalar
src/entities/session/model/index.js  ← useAppStore (Zustand)
src/app/router.jsx  ← Routing va rollar
```
