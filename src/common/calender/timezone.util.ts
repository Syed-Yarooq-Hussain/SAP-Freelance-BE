const DEFAULT_TIMEZONE = 'Asia/Karachi';

function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
}

function zonedLocalToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let result = new Date(desired);

  // Two passes also handle DST offsets around the selected date.
  for (let i = 0; i < 2; i++) {
    const p = partsAt(result, timeZone);
    const represented = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    result = new Date(result.getTime() + desired - represented);
  }
  return result;
}

function formatInZone(date: Date, timeZone: string) {
  const p = partsAt(date, timeZone);
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
  };
}

export function convertMonthlyScheduleTimezone(
  monthlySchedule: any,
  sourceTimezone?: string,
  targetTimezone?: string,
) {
  const source = sourceTimezone || DEFAULT_TIMEZONE;
  const target = targetTimezone || DEFAULT_TIMEZONE;
  if (source === target) return monthlySchedule;

  const days = (monthlySchedule?.days || []).map((day: any) => ({
    ...day,
    availability: { ...day.availability, slots: [] },
  }));
  const byDate = new Map(days.map((day: any) => [day.date, day]));

  for (const sourceDay of monthlySchedule?.days || []) {
    for (const slot of sourceDay.availability?.slots || []) {
      const start = formatInZone(
        zonedLocalToUtc(sourceDay.date, slot.start_time, source), target,
      );
      const end = formatInZone(
        zonedLocalToUtc(sourceDay.date, slot.end_time, source), target,
      );
      const targetDay: any = byDate.get(start.date);
      if (!targetDay) continue;
      targetDay.availability.available = true;
      targetDay.availability.slots.push({
        start_time: start.time,
        end_time: end.time,
        ...(end.date !== start.date ? { end_date: end.date } : {}),
      });
    }
  }

  for (const day of days as any[]) {
    if (!day.availability.slots.length) day.availability.available = false;
  }
  return { ...monthlySchedule, timezone: target, days };
}
