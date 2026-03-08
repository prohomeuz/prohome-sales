// crm-api.js — Mock API (localStorage)
const LS_V = "crm_voronka_v5";
const LS_L = "crm_leads_v5";
const PAGE_SIZE = 20;
const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));

const COLORS = [
  "#f43f5e","#fb7185","#f472b6","#e879f9","#a855f7","#8b5cf6","#6366f1",
  "#818cf8","#3b82f6","#0ea5e9","#06b6d4","#22d3ee","#10b981","#14b8a6",
  "#65a30d","#84cc16","#f59e0b","#f97316","#fb923c","#fbbf24","#475569",
  "#64748b","#6b7280","#9ca3af","#ec4899","#c084fc","#60a5fa","#34d399",
  "#fde68a","#fca5a5","#a78bfa","#7dd3fc","#6ee7b7","#fcd34d","#d1d5db",
  "#f9a8d4","#86efac","#93c5fd","#c4b5fd","#fda4af",
];
const ICONS = [
  "Target","Zap","Star","Flame","Gem","Rocket","Trophy","DollarSign",
  "BarChart2","TrendingUp","Gift","Sparkles","Shield","Key","Users",
  "Building2","Phone","Mail","Globe","Tag","Flag","Archive","Clock",
  "Heart","Briefcase","MessageCircle","Send","Eye","CheckCircle2","Layers",
  "Cpu","Database","Code2","FileText","Lightbulb","Megaphone","Handshake","BookOpen",
];
const STATUSES = [
  "Yangi","Muloqot","Taklif","Muzokara","Kelishuv","To'lov","Yetkazish",
  "Yakunlandi","Bekor","Kechiktirildi","Qayta aloqa","Tekshiruv","Tasdiqlash",
  "Imzolash","Arxiv","Istiqbol","Kutilmoqda","Faol","Sovuq","Issiq",
  "Premium","VIP","Demo","Pilot","Beta","Ko'rib chiqilmoqda","Rejalashtirildi",
  "Boshlandi","Davom etmoqda","Tugatildi","Yopildi","Rad etildi","Yuborildi",
  "Qabul qilindi","Qaytarildi","Eskirdi","Zaxira","Kuzatuvda","Muhim","Shoshilinch",
];
const NAMES = [
  "Abdullayev Jasur","Toshmatov Bobur","Karimova Nilufar","Rahimov Sanjar",
  "Yusupova Feruza","Mirzayev Otabek","Hasanov Dilshod","Ergasheva Malika",
  "Normatov Ulugbek","Qodirov Sherzod","Nazarov Akbar","Xolmatova Zulfiya",
  "Ismoilov Davron","Tursunova Mohira","Alimov Nodir","Bekova Sarvinoz",
  "Zokirov Mansur","Sultonova Dildora","Rustamov Rustam","Qosimova Gulnora",
  "Hamidov Shuhrat","Rajabova Nozima","Umarov Eldor","Sobirov Firdavs",
];
const PHONES = [
  "+998901234567","+998711234568","+998901234569","+998931234570",
  "+998951234571","+998881234572","+998771234573","+998901234574",
];
const BUDGETS = [35000,50000,75000,100000,150000,200000,45000,85000,120000,60000];
const ADDRESSES = [
  "Toshkent, Yunusobod","Toshkent, Chilonzor","Toshkent, Mirzo Ulug'bek",
  "Toshkent, Shayxontohur","Toshkent, Uchtepa","Toshkent, Yakkasaroy",
  "Samarqand shahri","Buxoro shahri","Namangan shahri","Andijon shahri",
];
const BUILDING_TYPES = ["Yangi bino","Eski bino","Privatizatsiya","Idora"];
const PAYMENT_TYPES = ["Naqd","Ipoteka","Muddatli to'lov","Almashtirish"];

function buildMock() {
  const voronka = STATUSES.map((s, i) => ({
    id: i + 1, status: s, color: COLORS[i % COLORS.length],
    icon: ICONS[i % ICONS.length], order: i, collapsed: false,
  }));
  const leads = Array.from({ length: 300 }, (_, i) => ({
    id: i + 1,
    title: NAMES[(i * 7) % NAMES.length],
    phone: PHONES[i % PHONES.length],
    budget: BUDGETS[i % BUDGETS.length],
    address: ADDRESSES[i % ADDRESSES.length],
    email: i % 3 === 0 ? `user${i}@example.com` : undefined,
    rooms: [1,2,3,4,5][i % 5],
    floor: [2,3,5,7,9,12][i % 6],
    area: [45,60,75,90,110,140][i % 6],
    buildingType: BUILDING_TYPES[i % BUILDING_TYPES.length],
    paymentType: PAYMENT_TYPES[i % PAYMENT_TYPES.length],
    notes: i % 4 === 0 ? "Tez ko'rib chiqish kerak" : undefined,
    status: STATUSES[i % 40],
    order: Math.floor(i / 40),
  }));
  return { voronka, leads };
}

function getStore() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_V));
    const l = JSON.parse(localStorage.getItem(LS_L));
    if (v?.length && l?.length) return { voronka: v, leads: l };
  } catch {}
  const mock = buildMock();
  localStorage.setItem(LS_V, JSON.stringify(mock.voronka));
  localStorage.setItem(LS_L, JSON.stringify(mock.leads));
  return mock;
}
function saveV(v) { localStorage.setItem(LS_V, JSON.stringify(v)); }
function saveL(l) { localStorage.setItem(LS_L, JSON.stringify(l)); }

export async function fetchVoronka() {
  await wait();
  return [...getStore().voronka].sort((a, b) => a.order - b.order);
}

export async function fetchLeads(status, page = 1, pageSize = PAGE_SIZE) {
  await wait();
  const col = getStore().leads
    .filter((l) => l.status === status)
    .sort((a, b) => a.order - b.order);
  const start = (page - 1) * pageSize;
  return {
    items: col.slice(start, start + pageSize),
    hasMore: start + pageSize < col.length,
    total: col.length,
  };
}

export async function addLead(leadData) {
  await wait(80);
  const { leads } = getStore();
  const newLead = {
    id: Date.now(),
    ...leadData,
    order: leads.filter((l) => l.status === leadData.status).length,
  };
  saveL([...leads, newLead]);
  return newLead;
}

export async function patchCollapseState(colId, collapsed) {
  await wait(60);
  const { voronka } = getStore();
  saveV(voronka.map((v) => (v.id === colId ? { ...v, collapsed } : v)));
  return { ok: true };
}

export async function patchVoronkaOrder(orderedIds) {
  await wait(60);
  const { voronka } = getStore();
  saveV(voronka.map((v) => ({ ...v, order: orderedIds.indexOf(v.id) })));
  return { ok: true };
}

export async function patchLeadStatus(leadId, status, order) {
  await wait(60);
  const { leads } = getStore();
  saveL(leads.map((l) => (l.id === leadId ? { ...l, status, order } : l)));
  return { ok: true };
}

export async function insertVoronkaAt(insertIdx, data) {
  await wait(80);
  const { voronka } = getStore();
  const sorted = [...voronka].sort((a, b) => a.order - b.order);
  const shifted = sorted.map((v) =>
    v.order >= insertIdx ? { ...v, order: v.order + 1 } : v,
  );
  const newCol = {
    id: Date.now(), status: data.status,
    color: data.color ?? "#8b5cf6", icon: data.icon ?? "Target",
    order: insertIdx, collapsed: false,
  };
  saveV([...shifted, newCol]);
  return newCol;
}
