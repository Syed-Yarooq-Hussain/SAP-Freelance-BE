import { convertMonthlyScheduleTimezone } from './timezone.util';

describe('convertMonthlyScheduleTimezone', () => {
  it('converts a Berlin winter slot to Karachi using the date-specific offset', () => {
    const schedule = {
      month: '2026-01',
      days: [{
        date: '2026-01-12',
        day_name: 'Monday',
        availability: {
          available: true,
          slots: [{ start_time: '09:00', end_time: '17:00' }],
        },
        events: [],
      }],
    };

    const result = convertMonthlyScheduleTimezone(
      schedule,
      'Europe/Berlin',
      'Asia/Karachi',
    );

    expect(result.timezone).toBe('Asia/Karachi');
    expect(result.days[0].availability.slots).toEqual([
      { start_time: '13:00', end_time: '21:00' },
    ]);
  });
});
