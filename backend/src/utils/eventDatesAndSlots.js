/**
 * Calendar-day comparison in local-ish UTC date strings YYYY-MM-DD
 */
function parseDay(s) {
  if (!s || !String(s).trim()) return null;
  const d = new Date(String(s).trim());
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function addDays(dayStr, days) {
  const d = new Date(dayStr + 'T12:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getTomorrowDayString() {
  const t = new Date();
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
}

export function getTodayDayString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Validate event window + registration deadline. Returns { ok: true } or { ok: false, message }.
 */
export function validateEventDateRules({
  eventStartDate,
  eventEndDate,
  registrationDeadline,
}) {
  const start = eventStartDate ? parseDay(eventStartDate) : null;
  const end = eventEndDate ? parseDay(eventEndDate) : null;
  const reg = registrationDeadline ? parseDay(registrationDeadline) : null;
  const tomorrow = getTomorrowDayString();
  const today = getTodayDayString();

  if (start) {
    if (start < tomorrow) {
      return { ok: false, message: 'Event start date must be tomorrow or later.' };
    }
  }
  if (start && end) {
    const endMin = addDays(start, 1);
    if (end < endMin) {
      return {
        ok: false,
        message: 'Event end date must be at least one day after the start date.',
      };
    }
  }
  if (start && reg) {
    const regMax = addDays(start, -1);
    if (reg > regMax) {
      return {
        ok: false,
        message: 'Registration deadline must be on or before the day before the event start date.',
      };
    }
  }
  if (reg && reg < today) {
    return { ok: false, message: 'Registration deadline cannot be before today.' };
  }

  return { ok: true };
}

/** "HH:MM" 24h → minutes from midnight */
function timeToMinutes(t) {
  const [h, m] = String(t).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Slot date must fall within [eventStart, eventEnd] inclusive (by calendar day).
 * endTime must be after startTime on the same calendar day.
 */
export function validateSlotsForEvent(slots, eventStartDate, eventEndDate) {
  const startDay = eventStartDate ? parseDay(eventStartDate) : null;
  const endDay = eventEndDate ? parseDay(eventEndDate) : null;

  if (!startDay || !endDay) {
    return { ok: false, message: 'Event start and end dates are required to validate judging slots.' };
  }

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const slotDay = s?.date ? parseDay(s.date) : null;
    if (!slotDay) {
      return { ok: false, message: `Slot ${i + 1}: date is required.` };
    }
    if (slotDay < startDay || slotDay > endDay) {
      return {
        ok: false,
        message: `Slot ${i + 1}: date must be between event start and end dates (inclusive).`,
      };
    }
    const sm = timeToMinutes(s.startTime);
    const em = timeToMinutes(s.endTime);
    if (sm == null || em == null) {
      return { ok: false, message: `Slot ${i + 1}: start and end times must be valid HH:MM values.` };
    }
    if (em <= sm) {
      return {
        ok: false,
        message: `Slot ${i + 1}: end time must be after start time on the same date.`,
      };
    }
  }

  return { ok: true };
}
