function mapMeetingToEvent(meeting: any) {
  const start = new Date(meeting.date_time);
  const end = new Date(start.getTime() + meeting.duration * 60000);

  return {
    id: meeting.id,
    title: meeting.project?.name || 'Meeting',
    type: meeting.event_type?.toUpperCase(),
    start_time: start.toISOString().slice(11, 16), // HH:mm
    end_time: end.toISOString().slice(11, 16),
    all_day: false,
    status: meeting.status
  };
}

export function groupEventsByDate(meetings: any[]) {
  const map: Record<string, any[]> = {};

  meetings.forEach(meeting => {
    const date = getDateKey(meeting.date_time);

    if (!map[date]) map[date] = [];

    map[date].push(mapMeetingToEvent(meeting));
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