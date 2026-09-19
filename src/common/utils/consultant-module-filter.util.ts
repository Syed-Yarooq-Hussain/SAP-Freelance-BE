export interface ConsultantModuleSelection {
  module_id: number | string;
  is_primary?: boolean;
}

export function matchesConsultantModuleFilters(
  consultantModules: ConsultantModuleSelection[] = [],
  coreModuleIds: number[] = [],
  otherModuleIds: number[] = [],
): boolean {
  if (!coreModuleIds.length && !otherModuleIds.length) return true;

  const matchesCore =
    coreModuleIds.length > 0 &&
    consultantModules.some(
      item =>
        item.is_primary === true &&
        coreModuleIds.includes(Number(item.module_id)),
    );
  const matchesOther =
    otherModuleIds.length > 0 &&
    consultantModules.some(
      item =>
        item.is_primary !== true &&
        otherModuleIds.includes(Number(item.module_id)),
    );

  return matchesCore || matchesOther;
}
