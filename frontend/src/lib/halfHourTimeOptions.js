function formatLabel(h, m) {
  const isPm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = isPm ? 'PM' : 'AM';
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const list = [];
for (let total = 0; total < 24 * 60; total += 30) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  list.push({ value, label: formatLabel(h, m) });
}

export const HALF_HOUR_TIME_OPTIONS = list;

export function minutesFromHHMM(t) {
  const [hh, mm] = String(t || '').split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}
