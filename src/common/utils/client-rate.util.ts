export function normalizeProfitMargin(value: unknown): number {
  const percentage = Number(value || 0);
  return Number.isInteger(percentage) && percentage >= 0 ? percentage : 0;
}

export function applyClientProfitMargin(
  hourlyRate: unknown,
  profitMarginPercentage: unknown,
): number {
  const rate = Number(hourlyRate || 0);
  const margin = normalizeProfitMargin(profitMarginPercentage);
  return Number((rate * (1 + margin / 100)).toFixed(2));
}
