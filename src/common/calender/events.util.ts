function mapAnyToEvent(item: any) {
  // MEETING (from meetings table)
  if (item.date_time && item.duration) {
    const start = new Date(item.date_time);
    const end = new Date(start.getTime() + item.duration * 60000);

    return {
      id: item.id,
      title: item.project?.name || 'Meeting',
      type: item.event_type?.toUpperCase() || 'MEETING',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      all_day: false,
      meeting_link: item.meeting_link || item.meeting_url || null, // 👈 ADD
      status: item.status
    };
  }

  // STORED EVENT (manual / project)
  if (item.start_time) {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      start_time: item.start_time,
      end_time: item.end_time,
      all_day: item.all_day ?? false,
      meeting_link: item.meeting_link ?? null, // 👈 ADD
      status: item.status
    };
  }

  return null;
}

export function groupEventsByDate(items: any[]) {
  const map: Record<string, any[]> = {};

  items.forEach(item => {
    const dateSource =
      item.date_time ||
      item.start_time ||
      item.start_date;

    if (!dateSource) return;

    const date = getDateKey(dateSource);

    if (!map[date]) map[date] = [];

    const event = mapAnyToEvent(item);
    if (event) map[date].push(event);
  });

  return map;
}


export function mergeEventsIntoSchedule(
  monthlySchedule: any,
  eventsByDate: Record<string, any[]>
) {
  monthlySchedule.days = monthlySchedule.days.map(day => ({
    ...day,
    events: eventsByDate[day.date] || []
  }));

  return monthlySchedule;
}

function getDateKey(date: string | Date): string {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date.split('T')[0];
}