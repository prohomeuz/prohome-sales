# ProHome Sales — To'liq Loyiha Hisoboti

> **Maqsad**: Ushbu hujjat istalgan agentga loyihani tushuntirish uchun yaratilgan.
> Bu hujjatni o'qib, loyihaning arxitekturasi, har bir faylning maqsadi,
> import qoidalari va davom ettirishda nimalarga e'tibor berish kerakligini bilib olasiz.

---

## Mundarija

1. [Texnik stek](#1-texnik-stek)
2. [Arxitektura: FSD](#2-arxitektura-fsd)
3. [To'liq fayl daraxti](#3-toliq-fayl-daraxti)
4. [Qatlam tavsifi](#4-qatlam-tavsifi)
   - [app/](#41-app)
   - [pages/](#42-pages)
   - [widgets/](#43-widgets)
   - [features/](#44-features)
   - [entities/](#45-entities)
   - [shared/](#46-shared)
5. [Routing va rollar](#5-routing-va-rollar)
6. [State management](#6-state-management)
7. [API va autentifikatsiya](#7-api-va-autentifikatsiya)
8. [Muhim qoidalar](#8-muhim-qoidalar)
9. [Keng tarqalgan patternlar](#9-keng-tarqalgan-patternlar)
10. [Muhit o'zgaruvchilari](#10-muhit-ozgaruvchilari)
11. [Build va ishga tushirish](#11-build-va-ishga-tushirish)

---

## 1. Texnik stek

| Texnologiya | Versiya | Maqsad |
|-------------|---------|--------|
| React | 19.0.0 | UI framework |
| Vite | 6.3.x | Build tool + dev server |
| React Router | 6.30.x | Client-side routing |
| Zustand | 5.0.x | Global state (session, valyuta) |
| Tailwind CSS | 4.1.x | Stillar |
| Radix UI | 1.x | Accessibility primitives |
| Sonner | 2.0.x | Toast notifikatsiyalar |
| react-photo-view | 1.2.x | Rasm galereyasi |
| lucide-react | 0.562 | Ikonkalar |
| react-canvas-confetti | 2.0 | Konfetti animatsiyasi |
| motion | 12.x | Animatsiyalar |
| recharts | 2.x | Grafiklar (Dashboard) |

**Path alias**: `@/` → `src/`
**Til**: Barcha UI matni o'zbek tilida

---

## 2. Arxitektura: FSD

Loyiha **Feature-Sliced Design (FSD)** arxitekturasiga asoslangan.

### Import qoidasi (qat'iy)

```
shared → entities → features → widgets → pages → app
```

**Pastki qatlam yuqoriga import qila olmaydi.** Masalan:
- ✅ `shared` → hech narsadan import qilmaydi (faqat tashqi lib)
- ✅ `entities` → faqat `shared` dan import qiladi
- ✅ `features` → `shared` va `entities` dan import qiladi
- ✅ `widgets` → `shared`, `entities`, `features` dan import qiladi
- ✅ `pages` → barcha pastki qatlamlardan import qiladi
- ❌ `shared` → `entities` dan import qila olmaydi
- ❌ `entities` → `widgets` dan import qila olmaydi

### Qatlam maqsadi

| Qatlam | Maqsad |
|--------|--------|
| `app/` | Router, global providerlar |
| `pages/` | Route handler — state + sub-komponentlarni compose qiladi |
| `widgets/` | Qayta ishlatiladigan katta UI bo'limlari |
| `features/` | Biznes logika (CRUD, validatsiya, hisob-kitob) |
| `entities/` | Domain model — API hook, type, constant |
| `shared/` | Generic UI komponentlar, utility hooklar, lib |

---

## 3. To'liq fayl daraxti

**Jami**: ~13,467 qator (JSX + JS)

```
src/
├── main.jsx                                          # Entry point
├── index.css                                         # Global styles (Tailwind v4)
│
├── app/
│   └── router.jsx                          124 ln   # Role-based routing
│
├── pages/
│   ├── Admin.jsx                            10 ln   # → UserManagementPage (role=admin)
│   ├── Rop.jsx                              10 ln   # → UserManagementPage (role=rop)
│   ├── SalesManager.jsx                     10 ln   # → UserManagementPage (role=salesmanager)
│   ├── TjmDetails.jsx                      521 ln   # Bino tafsilot sahifasi (MURAKKAB)
│   ├── CompanyDetails.jsx                  508 ln   # Kompaniya tahrirlash (MURAKKAB)
│   ├── Contracts.jsx                       361 ln   # Shartnomalar jadvali
│   ├── AddCompany.jsx                      345 ln   # Yangi kompaniya qo'shish
│   ├── Login.jsx                           260 ln   # Kirish formasi
│   ├── Settings.jsx                        223 ln   # Tema + parol o'zgartirish
│   ├── Dashboard.jsx                       140 ln   # Statistika grafik
│   ├── Company.jsx                         112 ln   # Kompaniyalar ro'yxati
│   ├── Tjm.jsx                              63 ln   # Loyihalar ro'yxati
│   ├── Crm.jsx                              29 ln   # Coming Soon placeholder
│   ├── Home.jsx                              3 ln   # Placeholder (redirect)
│   ├── NotFound.jsx                         23 ln   # 404 sahifasi
│   ├── Offline.jsx                              ln   # Offline sahifasi
│   └── tjm-details/                              # TjmDetails sub-moduli
│       ├── lib/
│       │   ├── constants.js                 20 ln  # STATUS_CLASS, STATUS_LABEL
│       │   └── filter-utils.js             285 ln  # Filtr utility funksiyalar
│       └── ui/
│           ├── TjmFilterBar.jsx            360 ln  # Filter paneli (presentational)
│           └── TjmFloorGrid.jsx            199 ln  # Qavat/xona grid (presentational)
│
├── widgets/
│   ├── CalculatorTool.jsx                    7 ln   # Re-export bridge → calculator/ui/
│   ├── HomeDetails.jsx                     341 ln   # Xona tafsilot drawer (orchestrator)
│   ├── AppartmentTimeLine.jsx                  ln   # Timeline widget
│   ├── DiscountViewerSlider.jsx                ln   # Chegirma ko'rish (lazy)
│   ├── EmptyData.jsx                           ln   # Bo'sh holat UI
│   ├── GenplanViewerButton.jsx                 ln   # Genplan ko'rish tugmasi (lazy)
│   ├── app-sidebar.jsx                     140 ln   # Asosiy sidebar navigatsiya
│   ├── sidebar-header.jsx                   20 ln   # Sidebar yuqori qismi
│   │
│   ├── calculator/                                  # Kalkulyator widget to'plami
│   │   ├── lib/
│   │   │   ├── constants.js                194 ln  # Status, label, action konstantalar
│   │   │   └── helpers.js                  292 ln  # Hisob funksiyalar, format
│   │   ├── model/
│   │   │   └── calculator-reducer.js       138 ln  # useReducer state
│   │   └── ui/
│   │       ├── CalculatorTool.jsx          860 ln  # ORCHESTRATOR — barcha state va logic
│   │       ├── CalcDrawerHeader.jsx        172 ln  # Drawer sarlavhasi + viewer tugmalar
│   │       ├── CalculatorForm.jsx          233 ln  # Kirish formasi (presentational)
│   │       ├── CalculatorResultPanel.jsx   186 ln  # Natija paneli (presentational)
│   │       ├── StatusChangeDialog.jsx      339 ln  # Status o'zgartirish dialogi
│   │       ├── StatusActionCards.jsx           ln  # Harakat tugmalari
│   │       └── BonusDialog.jsx              86 ln  # Bonus natija dialogi
│   │
│   ├── home-details/                                # HomeDetails sub-moduli
│   │   ├── model/
│   │   │   └── home-details-reducer.js         ln  # useReducer state
│   │   └── ui/
│   │       ├── RoomHeader.jsx              174 ln  # Sticky sarlavha (presentational)
│   │       └── RoomImageTabs.jsx           108 ln  # 2D/3D/PLAN tablar (presentational)
│   │
│   ├── user-table/                                  # Foydalanuvchi boshqaruvi
│   │   ├── lib/
│   │   │   └── user-role-config.js             ln  # Rol konfiguratsiyasi
│   │   └── ui/
│   │       └── UserManagementPage.jsx      397 ln  # Universal user management
│   │
│   ├── loading/
│   │   ├── LoadTransition.jsx             125 ln   # Loading → content transition
│   │   ├── LogoLoader.jsx                     ln   # Logo + spinner
│   │   ├── PageFallback.jsx                   ln   # React.lazy fallback
│   │   └── SurfaceLoader.jsx                  ln   # Panel loading placeholder
│   │
│   ├── error/
│   │   ├── Bug.jsx                            ln   # Xato ko'rsatkichi
│   │   └── GeneralError.jsx                   ln   # Umumiy xato sahifasi
│   │
│   ├── layout/
│   │   └── main-layout.jsx                    ln   # Asosiy layout (Sidebar + outlet)
│   │
│   ├── optics/
│   │   └── table.jsx                      132 ln   # Custom jadval wrapper
│   │
│   └── reui/
│       └── timeline.jsx                   171 ln   # Status tarix timeline
│
├── features/
│   ├── company-form/
│   │   └── lib/
│   │       └── validators.js               55 ln   # Kompaniya forma validatsiyasi
│   ├── contracts/
│   │   └── lib/
│   │       └── contract-utils.js          106 ln   # Shartnoma yordamchi funksiyalar
│   ├── room-status-change/
│   │   └── model/
│   │       └── use-room-status.js         108 ln   # Xona status o'zgartirish hook
│   └── user-crud/
│       ├── lib/
│       │   └── user-validators.js          63 ln   # Foydalanuvchi validatsiyasi
│       └── model/
│           └── use-user-crud.js           148 ln   # User CRUD operatsiyalar hook
│
├── entities/
│   ├── session/
│   │   ├── model/
│   │   │   └── index.js                    47 ln   # Zustand store (user, currencyUsd)
│   │   └── ui/
│   │       └── CurrencyBadge.jsx           73 ln   # Valyuta ko'rsatkichi
│   ├── company/
│   │   └── model/
│   │       ├── use-companies.js            53 ln   # Kompaniyalar ro'yxati hook
│   │       └── use-company-details.js     164 ln   # Kompaniya tafsiloti hook (MURAKKAB)
│   ├── contract/
│   │   └── model/
│   │       └── use-contracts.js           106 ln   # Shartnomalar hook
│   ├── dashboard/
│   │   └── model/
│   │       └── use-dashboard-stats.js      63 ln   # Statistika hook
│   ├── project/
│   │   └── model/
│   │       ├── use-project-structure.js   151 ln   # Bino strukturasi hook (MURAKKAB)
│   │       └── use-projects.js             53 ln   # Loyihalar ro'yxati hook
│   └── room/
│       └── model/
│           └── room-types.js               56 ln   # Xona status konstantalari
│
├── shared/
│   ├── config/
│   │   └── constants.js                        ln  # ROOM_STATUS, USER_ROLE, UZ_PHONE va b.
│   ├── lib/
│   │   ├── api.js                          32 ln   # API client (fetch + token)
│   │   ├── utils.js                        56 ln   # cn, formatNumber, getFormData
│   │   ├── validators.js                   56 ln   # validateUserForm (deprecated wrapper)
│   │   └── create-effect-with-target.js    83 ln   # useEffect DOM target uchun
│   ├── hooks/
│   │   ├── use-boolean.js                       ln  # Boolean toggle
│   │   ├── use-clipboard.js               151 ln   # Clipboard copy + feedback
│   │   ├── use-effect-with-target.js           ln   # DOM target effect
│   │   ├── use-event-listener.js               ln   # Global event binding
│   │   ├── use-isomorphic-layout-effect.js     ln   # SSR-safe layout effect
│   │   ├── use-latest.js                       ln   # useRef latest value
│   │   ├── use-loading-bar.js                  ln   # Top progress bar
│   │   ├── use-memoized-fn.js                  ln   # Stable callback
│   │   ├── use-mobile.js                       ln   # Mobile breakpoint detect
│   │   ├── use-sound.js                        ln   # Audio playback
│   │   ├── use-toggle.js                       ln   # Boolean toggle (oddiy)
│   │   ├── use-unmount.js                      ln   # Unmount detect
│   │   │   — — — (quyidagilar deprecated wrapperlar) — — —
│   │   ├── use-companies.js              → entities/company/model/use-companies
│   │   ├── use-company-details.js        → entities/company/model/use-company-details
│   │   ├── use-contracts.js              → entities/contract/model/use-contracts
│   │   ├── use-dashboard-stats.js        → entities/dashboard/model/use-dashboard-stats
│   │   ├── use-project-structure.js      → entities/project/model/use-project-structure
│   │   ├── use-projects.js               → entities/project/model/use-projects
│   │   ├── use-room-status.js            → features/room-status-change/model/use-room-status
│   │   └── use-user-crud.js              → features/user-crud/model/use-user-crud
│   └── ui/                                          # shadcn/radix asosida komponentlar
│       ├── sidebar.jsx                   693 ln     # Radix sidebar (katta, to'liq)
│       ├── field.jsx                     238 ln     # Label + Input wrapper
│       ├── noise-background.jsx          204 ln     # Animatsiyali fon
│       ├── alert-dialog.jsx              171 ln     # Tasdiqlash dialogi
│       ├── select.jsx                    168 ln     # Dropdown
│       ├── input-group.jsx               160 ln     # Prefix/suffix input
│       ├── sheet.jsx                     140 ln     # Bottom sheet
│       ├── dialog.jsx                    135 ln     # Modal
│       ├── drawer.jsx                    134 ln     # Slide-out panel
│       ├── table.jsx                     101 ln     # Jadval
│       ├── card.jsx                      101 ln     # Karta container
│       ├── tabs.jsx                       93 ln     # Tab navigatsiya
│       ├── popover.jsx                    89 ln     # Floating popover
│       ├── alert.jsx, avatar.jsx, badge.jsx
│       ├── button.jsx, checkbox.jsx, input.jsx
│       ├── label.jsx, native-select.jsx, radio-group.jsx
│       ├── separator.jsx, skeleton.jsx, slider.jsx
│       ├── spinner.jsx, switch.jsx, textarea.jsx
│       ├── toggle.jsx, toggle-group.jsx, tooltip.jsx
│       ├── currency-badge.jsx            → entities/session/ui/CurrencyBadge (wrapper)
│       └── suspense-fallback.jsx         # PanelFallback, OverlayFallback
│
└── workers/                                          # (mavjud emas — TODO)
    └── tjm-filter.worker.js                          # TjmDetails filtering uchun kerak
```

---

## 4. Qatlam tavsifi

### 4.1 app/

**`router.jsx`** (124 qator)

Role-based routing. Foydalanuvchi roli bo'yicha turli route to'plamlari yuklanadi.

```js
// Rollar
SUPERADMIN  // Barcha sahifalarga kirish
ADMIN       // /admin yo'q
ROP         // Cheklangan: dashboard, salesmanager, tjm, contracts, crm
SALESMANAGER // Minimal: home, tjm, crm
```

Barcha sahifalar `lazy()` orqali code-split qilingan.
`/tjm/:id` — TjmDetails alohida, MainLayout tashqarisida.

---

### 4.2 pages/

Sahifalar **orchestrator** pattern bo'yicha ishlaydi:
- State va handlerlarni o'zida saqlaydi
- Sub-komponentlarga faqat props orqali uzatadi
- API hook larni chaqiradi

#### TjmDetails.jsx (521 qator) — ENG MURAKKAB SAHIFA

Bino vizualizatsiyasi: har bir qavatdagi xonalarni rangli kvadratlar sifatida ko'rsatadi.

**State**:
- `selectedBlock` — tanlangan blok filtri
- `filterOpen` — filtr paneli ochiq/yopiq
- `filters` / `draftFilters` — tasdiqlangan va qoralama filtrlar
- `matchedRoomIds` / `isFiltering` — Web Worker natijasi
- URL sync: `?details=`, `?img=`, filtr parametrlari

**Sub-komponentlar** (barcha presentational):
- `TjmFilterBar` — filtr va statistika paneli
- `TjmFloorGrid` — qavat/xona grid
- `HomeDetails` — tanlangan xona tafsiloti (widget)

**Web Worker**: `src/workers/tjm-filter.worker.js` — xonalarni filterlab `matchedRoomIds` qaytaradi. ⚠️ Bu fayl hali mavjud emas (TODO).

**URL struktura**: `/tjm/:id?details=<roomId>&img=2D&block=B1&rooms=2,3&...`

---

#### CompanyDetails.jsx (508 qator)

Kompaniya ma'lumotlarini tahrirlash.

**State** (useReducer):
- `editMode` — tahrirlash rejimi on/off
- `logoPreview` / `logoFile` — yangi logo blob
- `errors` — forma xatolari
- `deleteConfirm` — o'chirish tasdiqlash modali

**Hook**: `useCompanyDetails(id)` — entities/company dan

---

#### Admin.jsx / Rop.jsx / SalesManager.jsx (har biri 10 qator)

Barcha uchta sahifa `UserManagementPage` widgetiga yo'naltiradi:

```jsx
export default function Admin() {
  return <UserManagementPage userRole="admin" />;
}
```

---

### 4.3 widgets/

#### `widgets/calculator/ui/CalculatorTool.jsx` (860 qator) — ENG KATTA WIDGET

Xona narxini hisoblash draweri.

**Props**: `home` (xona ob'ekti), `onStatusUpdated` (callback)

**State** (useReducer + useState):
- Kalkulyator holati: `selectedState`, `downPayment`, `period`, `discount`
- Natija: `calcResult`, `calcLoading`
- Bonus: `paymentBonus`, `hasUmraBonus`, `bonusItems`
- Status o'zgartirish: `statusForm`, `statusErrors`, `activeAction`
- Viewer-lar: `genplanLoaded/Signal`, `discountLoaded/Signal`, `umraLoaded/Signal`

**Sub-komponentlar**:
- `CalcDrawerHeader` — sarlavha + 3 ta lazy viewer tugmalar
- `CalculatorResultPanel` — natija kartalar, bonus, timeline
- `CalculatorForm` — kirish formasi
- `StatusActionCards` — SOLD/RESERVED/NOT/EMPTY tugmalari
- `StatusChangeDialog` — status o'zgartirish modali
- `BonusDialog` — bonus natija

**Lazy komponentlar** (module darajasida):
```js
const LazyGenplanViewerButton = lazy(() => import("@/widgets/GenplanViewerButton"));
const LazyDiscountViewerSlider = lazy(() => import("@/widgets/DiscountViewerSlider"));
```

**`widgets/CalculatorTool.jsx`** (7 qator) — re-export bridge:
```js
export { default } from "./calculator/ui/CalculatorTool";
```

---

#### `widgets/HomeDetails.jsx` (341 qator)

Xona tafsilotlari slide-in paneli.

**Props**: `onRoomStatusUpdated?: (roomId, patch) => void`

**State**: `homeDetailsReducer` + `activeImageTab` (useState)

URL parametrlari: `?details=<id>` va `?img=2D|3D|PLAN`

**Sub-komponentlar**:
- `RoomHeader` — sarlavha (badge, yopish, mijoz popover, narx)
- `RoomImageTabs` — 2D/3D/PLAN rasmlar
- `CalculatorTool` — kalkulyator (home orqali)

---

#### `widgets/user-table/ui/UserManagementPage.jsx` (397 qator)

Admin/ROP/SalesManager uchun yagona foydalanuvchi boshqaruvi.

**Props**: `userRole: "admin" | "rop" | "salesmanager"`

Konfiguratsiya `user-role-config.js` dan yuklanadi — API path, forma maydonlari, sarlavhalar.

---

### 4.4 features/

#### `features/user-crud/model/use-user-crud.js` (148 qator)

```js
const { users, loading, error, add, remove } = useUserCrud(crudType);
// crudType: "admin" | "rop" | "salesmanager"
```

#### `features/room-status-change/model/use-room-status.js` (108 qator)

```js
// Xona statusini server ga yuborish
await submitStatus({ roomId, status, form });
```

#### `features/company-form/lib/validators.js` (55 qator)

`validateCompanyFormData(data)` — kompaniya forma validatsiyasi.

#### `features/user-crud/lib/user-validators.js` (63 qator)

`validateUserForm(data)` — foydalanuvchi forma validatsiyasi.

---

### 4.5 entities/

#### `entities/session/model/index.js` (47 qator)

Zustand store — global state:

```js
const { user, currencyUsd, currencyLoading } = useAppStore();
// Methodlar:
setUser(data)        // Login + localStorage
fetchCurrencyUsd()   // USD/UZS kursini serverdan yuklash
```

Token va user `localStorage` da saqlanadi.

#### `entities/project/model/use-project-structure.js` (151 qator)

```js
const { structure, loading, notFound, error, updateRoomStatus } =
  useProjectStructure(tjmId);

// structure:
// {
//   blocks: { [blockName]: { floor, appartment: Room[][] } },
//   stats: { total, empty, reserved, sold, not }
// }
```

#### `entities/company/model/use-company-details.js` (164 qator)

```js
const { details, loading, editLoading, get, edit, toggleStatus, remove } =
  useCompanyDetails(id);
```

---

### 4.6 shared/

#### `shared/lib/api.js`

```js
getToken()                    // localStorage.getItem("token")
apiUrl(path)                  // VITE_BASE_URL + path
apiRequest(path, options)     // fetch + Authorization header
```

#### `shared/lib/utils.js`

```js
cn(...classes)                // clsx + tailwind-merge
getFormData(formElement)      // FormData → plain object
formatNumber(num)             // 1000000 → "1 000 000"
formatNumberWithPercent(n)    // formatNumber + "%" cap
normalizePeriod(val)          // 12–240 orasiga clamp
```

#### `shared/config/constants.js`

```js
ROOM_STATUS      // EMPTY, SOLD, RESERVED, NOT
USER_ROLE        // ADMIN, SALES_MANAGER, ROP
CURRENCY         // USD, UZS
UZ_PHONE_REGEX   // +998XXXXXXXXX validatsiya
TOAST_OPTS       // { duration: 3000 } — sonner uchun
```

#### `shared/hooks/` — generic hooklar (biznes logikasiz)

| Hook | Qaytaradi |
|------|-----------|
| `use-boolean` | `{ value, toggle, setTrue, setFalse }` |
| `use-clipboard` | `{ copied, copy }` |
| `use-loading-bar` | `{ start, complete }` |
| `use-mobile` | `boolean` |
| `use-sound` | `{ play }` |
| `use-toggle` | `[value, toggle]` |
| `use-event-listener` | Hech narsa (side effect) |
| `use-unmount` | Hech narsa (cleanup) |

**Deprecated wrapperlar** (backward compat):
`use-companies`, `use-company-details`, `use-contracts`, `use-dashboard-stats`,
`use-project-structure`, `use-projects`, `use-room-status`, `use-user-crud`
— bular entities/features ga re-export qiladi.
**Yangi kodda bevosita entities/features dan import qiling.**

---

## 5. Routing va rollar

```
/login          → Login.jsx             (public)
/               → MainLayout → role-based children
  /             → Home.jsx              (index)
  /admin        → Admin.jsx             (SUPERADMIN only)
  /rop          → Rop.jsx               (SUPERADMIN only)
  /salesmanager → SalesManager.jsx      (SUPERADMIN, ROP)
  /company      → Company.jsx           (SUPERADMIN, ADMIN)
  /add/company  → AddCompany.jsx        (SUPERADMIN, ADMIN)
  /company/:id  → CompanyDetails.jsx    (SUPERADMIN, ADMIN)
  /tjm          → Tjm.jsx               (barchaga)
  /contracts    → Contracts.jsx         (SUPERADMIN, ADMIN, ROP)
  /dashboard    → Dashboard.jsx         (SUPERADMIN, ADMIN, ROP)
  /crm          → Crm.jsx               (barchaga)
  /settings     → Settings.jsx          (barchaga)
/tjm/:id        → TjmDetails.jsx        (MainLayout tashqarida!)
*               → NotFound.jsx
```

---

## 6. State management

### Global state (Zustand)

```js
import { useAppStore } from "@/entities/session/model";
const user = useAppStore(s => s.user);
const currencyUsd = useAppStore(s => s.currencyUsd);
```

### Page / Widget state (useReducer)

Murakkab sahifalar va widgetlar `useReducer` ishlatadf:
- `TjmDetails.jsx` — workerReady, filtrlar
- `HomeDetails.jsx` — `home-details-reducer.js`
- `CalculatorTool.jsx` — `calculator-reducer.js`
- `UserManagementPage.jsx` — modal, errors
- `CompanyDetails.jsx` — editMode, logo, errors

### Server state

Entity hooklar (masalan `useCompanies`) ichida `useState` + `fetch` ishlatiladi.
`@tanstack/react-query` o'rnatilgan lekin hozircha to'liq qo'llanilmagan.

---

## 7. API va autentifikatsiya

**Base URL**: `import.meta.env.VITE_BASE_URL`

**Token**: `localStorage.getItem("token")` — har bir so'rovda `Authorization: Bearer <token>`

**Asosiy endpointlar**:

| Method | Path | Maqsad |
|--------|------|--------|
| POST | `/api/v1/auth/login` | Kirish |
| GET | `/api/v1/company` | Kompaniyalar ro'yxati |
| GET | `/api/v1/company/:id` | Kompaniya tafsiloti |
| PUT | `/api/v1/company/:id` | Kompaniyani tahrirlash |
| GET | `/api/v1/project` | Loyihalar ro'yxati |
| GET | `/api/v1/project/structure/:id` | Bino strukturasi |
| GET | `/api/v1/room/by/:id` | Xona tafsiloti |
| PUT | `/api/v1/room/status/:id` | Xona statusini o'zgartirish |
| GET | `/api/v1/contract?projectId=` | Shartnomalar |
| GET | `/api/v1/currency/usd` | USD kursi |
| GET | `/api/v1/user/admin` | Adminlar ro'yxati |
| POST | `/api/v1/user/admin` | Admin qo'shish |
| DELETE | `/api/v1/user/admin/:id` | Adminni o'chirish |

---

## 8. Muhim qoidalar

### ✅ Har doim qilish kerak

1. **FSD import qoidasiga rioya qiling** — pastdan yuqoriga import yo'q
2. **Yangi entity hook → `entities/<domain>/model/` ga** — `shared/hooks/` ga emas
3. **Yangi biznes logika → `features/` ga**
4. **Presentational komponentlar faqat props qabul qiladi** — hook chaqirmaydi
5. **Orchestrator state saqlaydi** — sub-komponentlarga props uzatadi
6. **Komponent 400 qatordan oshmasligi kerak** — oshsa, bo'linadi
7. **`@/shared/ui/` dan import qiling** — Radix UI to'g'ridan-to'g'ri emas
8. **Toast → Sonner `toast()`** — `toast.success()`, `toast.error()`
9. **`formatNumber()` → `@/shared/lib/utils`** — barcha son formatlashda
10. **Ikonlar → `lucide-react`** — boshqa kutubxona emas

### ❌ Qilmaslik kerak

1. `shared/ui/` ga biznes logika (useAppStore, API call) qo'shmaslik
2. `shared/hooks/` ga entity-specific hook qo'shmaslik
3. Radix UI ni to'g'ridan-to'g'ri import qilmaslik (`@radix-ui/react-*`)
4. `deprecated wrapper` hooklar orqali import qilmaslik — bevosita entities/features dan
5. Bir xil konstantani bir necha faylda takrorlamaslik — `shared/config/constants.js`
6. `srcset` o'rniga `srcSet` (React camelCase)

---

## 9. Keng tarqalgan patternlar

### Lazy viewer pattern (CalculatorTool.jsx)

```jsx
// Module darajasida — bir marta yaratiladi
const LazyGenplanViewerButton = lazy(
  () => import("@/widgets/GenplanViewerButton")
);

// State
const [genplanLoaded, setGenplanLoaded] = useState(false);
const [genplanSignal, setGenplanSignal] = useState(0);

// Foydalanish — Suspense bilan
{genplanLoaded ? (
  <Suspense fallback={<Button disabled>...</Button>}>
    <LazyGenplanViewerButton
      openSignal={genplanSignal}
      onVisibleChange={...}
    />
  </Suspense>
) : (
  <Button onClick={() => { setGenplanLoaded(true); setGenplanSignal(s => s+1); }}>
    Genplan
  </Button>
)}
```

### URL sync pattern (TjmDetails.jsx)

```jsx
const l = useLocation();
const navigate = useNavigate();

function handleRoomClick(id) {
  const params = new URLSearchParams(l.search);
  params.set("details", id);
  navigate({ pathname: l.pathname, search: `?${params}` }, { replace: true });
}
```

### Presentational + Orchestrator pattern

```jsx
// Orchestrator — state va handlerlar shu yerda
export default function TjmDetails() {
  const [filterOpen, setFilterOpen] = useState(false);
  // ...barcha state...

  return (
    <TjmFilterBar
      filterOpen={filterOpen}
      onToggleFilter={() => setFilterOpen(v => !v)}
      // ...boshqa props...
    />
  );
}

// Presentational — faqat props, hook yo'q
export default function TjmFilterBar({ filterOpen, onToggleFilter, ... }) {
  return <div>...</div>;
}
```

### Status badge pattern

```jsx
// STATUS_CLASS va STATUS_LABEL har doim pages/tjm-details/lib/constants.js dan
import { STATUS_CLASS, STATUS_LABEL } from "../lib/constants";

<Badge className={STATUS_CLASS[home.status]}>
  {STATUS_LABEL[home.status]}
</Badge>
```

### Toast pattern

```jsx
import { toast } from "sonner";
import { TOAST_OPTS } from "@/shared/config/constants";

toast.success("Muvaffaqiyatli saqlandi", TOAST_OPTS);
toast.error("Xatolik yuz berdi", TOAST_OPTS);
```

---

## 10. Muhit o'zgaruvchilari

| O'zgaruvchi | Maqsad |
|-------------|--------|
| `VITE_BASE_URL` | Backend API asosiy URL (masalan: `http://localhost:8080`) |

`.env` fayli loyiha ildizida. `.gitignore` ga kiritilgan.

---

## 11. Build va ishga tushirish

```bash
# O'rnatish
npm install

# Ishlab chiqish
npm run dev

# Build
npm run build

# Natijani tekshirish
npm run preview
```

**Build muvaffaqiyat belgisi**: `✓ built in N.NNs` — xato yo'q.

---

## Muhim fayllar — tez murojaat

| Fayl | Maqsad |
|------|--------|
| `src/app/router.jsx` | Routing va rollar |
| `src/entities/session/model/index.js` | Global state (Zustand) |
| `src/shared/lib/api.js` | API client |
| `src/shared/lib/utils.js` | cn, formatNumber, getFormData |
| `src/shared/config/constants.js` | Barcha global konstantalar |
| `src/pages/TjmDetails.jsx` | Bino vizualizatsiya sahifasi |
| `src/widgets/calculator/ui/CalculatorTool.jsx` | Kalkulyator orchestrator |
| `src/widgets/HomeDetails.jsx` | Xona tafsilot panel |
| `src/widgets/user-table/ui/UserManagementPage.jsx` | User management |
| `src/pages/tjm-details/lib/filter-utils.js` | TJM filtr logikasi |
| `src/pages/tjm-details/lib/constants.js` | STATUS_CLASS, STATUS_LABEL |

---

*Hisobot yaratilgan: 2026-03-19 | Loyiha: ProHome Sales*
