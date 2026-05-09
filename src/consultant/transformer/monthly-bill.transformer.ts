// monthly-bill.transformer.ts

export function groupBillsByMonth(bills: any[]) {
  const grouped: Record<string, any> = {};

  for (const bill of bills) {
    const key = bill.month;

    if (!grouped[key]) {
      grouped[key] = {
        month: bill.month,
        total_hours: 0,
        total_amount: 0,
        is_paid: bill.is_paid,
        project: bill.project,
        bills: [],
      };
    }

    grouped[key].total_hours += bill.hours;
    grouped[key].total_amount += bill.amount;
    grouped[key].bills.push({
      id: bill.id,
      milestone_id: bill.milestone_id,
      hours: bill.hours,
      amount: bill.amount,
      is_paid: bill.is_paid,
      pdf_url: bill.pdf_url,
    });
  }

  return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
}