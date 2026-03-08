// search.worker.js
self.onmessage = ({ data: { leads, query } }) => {
  const q = query.trim().toLowerCase();
  if (!q) { self.postMessage([]); return; }

  const results = leads.filter((l) => {
    const hay = [
      l.title, l.phone, l.email, l.address,
      l.status, String(l.id ?? ''),
      l.budget != null ? String(l.budget) : null,
      l.rooms != null ? `${l.rooms} xona` : null,
      l.buildingType, l.paymentType, l.notes, l.text,
    ].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });

  self.postMessage(results.slice(0, 50));
};
