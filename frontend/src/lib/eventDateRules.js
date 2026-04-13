/** Calendar rules aligned with backend `eventDatesAndSlots.js` (UTC date strings). */

export function getTomorrowYmdUTC() {
  const t = new Date();
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
}

export function getTodayYmdUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysYmd(ymd, days) {
  const d = new Date(`${ymd}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * @returns {{ ok: true } | { ok: false, message: string, fields?: Record<string, string> }}
 */
export function validateEventFormDates({ eventStartDate, eventEndDate, registrationDeadline }) {
  const tomorrow = getTomorrowYmdUTC();
  const today = getTodayYmdUTC();
  const fields = {};

  if (eventStartDate) {
    if (eventStartDate < tomorrow) {
      fields.eventStartDate = 'Event start must be tomorrow or later.';
    }
  }
  if (eventStartDate && eventEndDate) {
    const endMin = addDaysYmd(eventStartDate, 1);
    if (eventEndDate < endMin) {
      fields.eventEndDate = 'End date must be at least one day after the start date.';
    }
  }
  if (eventStartDate && registrationDeadline) {
    const regMax = addDaysYmd(eventStartDate, -1);
    if (registrationDeadline > regMax) {
      fields.registrationDeadline =
        'Registration deadline must be on or before the day before the event starts.';
    }
  }
  if (registrationDeadline && registrationDeadline < today) {
    fields.registrationDeadline = 'Registration deadline cannot be before today.';
  }

  const first = Object.values(fields)[0];
  if (first) {
    return { ok: false, message: first, fields };
  }
  return { ok: true };
}
