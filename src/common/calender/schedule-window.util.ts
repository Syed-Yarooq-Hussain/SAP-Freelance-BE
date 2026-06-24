export function formatScheduleDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function createThreeMonthScheduleWindow() {
  const effectiveFrom = new Date();
  effectiveFrom.setDate(effectiveFrom.getDate() + 1);

  const effectiveTo = new Date(effectiveFrom);
  effectiveTo.setMonth(effectiveTo.getMonth() + 3);

  return {
    effective_from: formatScheduleDate(effectiveFrom),
    effective_to: formatScheduleDate(effectiveTo),
  };
}
