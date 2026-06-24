export async function buildMonthlySchedule(
  year: number,
  month: number,
  scheduleConfig: any,
) {
  const config = scheduleConfig || {};
  const dates = getDatesOfMonth(year, month);

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    days: dates.map((date) => {
      const dayName = getDayName(date);
      const custom = findCustomSchedule(config.custom || [], date);

      if (custom) {
        return {
          date,
          day_name: dayName,
          availability: {
            available: custom.active,
            slots: (custom.slot || []).map((slot) => ({
              start_time: slot.start,
              end_time: slot.end,
            })),
          },
          events: [],
        };
      }

      if (!isWithinScheduleWindow(config, date)) {
        return {
          date,
          day_name: dayName,
          availability: {
            available: false,
            slots: [],
          },
          events: [],
        };
      }

      const weekly = findWeeklySchedule(config.weekly || [], dayName);

      return {
        date,
        day_name: dayName,
        availability: {
          available: weekly?.active ?? false,
          slots: weekly?.active
            ? (weekly.slot || []).map((slot) => ({
                start_time: slot.start,
                end_time: slot.end,
              }))
            : [],
        },
        events: [],
      };
    }),
  };
}

function getDatesOfMonth(year: number, month: number): string[] {
  const dates: string[] = [];
  const date = new Date(year, month - 1, 1);

  while (date.getMonth() === month - 1) {
    dates.push(date.toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

function getDayName(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
}

function findCustomSchedule(custom: any[], date: string) {
  return custom.find((item) => item.date === date);
}

function findWeeklySchedule(weekly: any[], dayName: string) {
  return weekly.find((item) => item.day === dayName);
}

function isWithinScheduleWindow(scheduleConfig: any, date: string) {
  const effectiveFrom = scheduleConfig?.effective_from;
  const effectiveTo = scheduleConfig?.effective_to;

  if (!effectiveFrom && !effectiveTo) return true;
  if (effectiveFrom && date < effectiveFrom) return false;
  if (effectiveTo && date > effectiveTo) return false;

  return true;
}
