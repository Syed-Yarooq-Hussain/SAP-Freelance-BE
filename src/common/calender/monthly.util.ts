export async function buildMonthlySchedule(
  year: number,
  month: number,
  scheduleConfig: any
) {
  const dates = getDatesOfMonth(year, month);

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    days: dates.map(date => {
      const dayName = getDayName(date);

      // 1️⃣ custom override
      const custom = findCustomSchedule(scheduleConfig.custom || [], date);

      if (custom) {
        return {
          date,
          day_name: dayName, 
          availability: {
            available: custom.active,
            slots: (custom.slot || []).map(s => ({
              start_time: s.start,
              end_time: s.end
            }))
          },
          events: []
        };
      }

      // 2️⃣ weekly fallback
      const weekly = findWeeklySchedule(scheduleConfig.weekly || [], dayName);

      return {
        date,
        day_name: dayName, 
        availability: {
          available: weekly?.active ?? false,
          slots: weekly?.active
            ? (weekly.slot || []).map(s => ({
                start_time: s.start,
                end_time: s.end
              }))
            : []
        },
        events: []
      };
    })
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
  return custom.find(c => c.date === date);
}

function findWeeklySchedule(weekly: any[], dayName: string) {
  return weekly.find(w => w.day === dayName);
}
