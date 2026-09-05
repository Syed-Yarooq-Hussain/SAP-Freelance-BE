import { matchesConsultantModuleFilters } from './consultant-module-filter.util';

describe('matchesConsultantModuleFilters', () => {
  const assignments = [
    { module_id: 1, is_primary: true },
    { module_id: 10, is_primary: false },
  ];

  it('matches core filters only against primary modules', () => {
    expect(matchesConsultantModuleFilters(assignments, [1], [])).toBe(true);
    expect(matchesConsultantModuleFilters(assignments, [10], [])).toBe(false);
  });

  it('matches other filters only against non-primary modules', () => {
    expect(matchesConsultantModuleFilters(assignments, [], [10])).toBe(true);
    expect(matchesConsultantModuleFilters(assignments, [], [1])).toBe(false);
  });

  it('uses OR when core and other filters are both supplied', () => {
    expect(matchesConsultantModuleFilters(assignments, [999], [10])).toBe(true);
    expect(matchesConsultantModuleFilters(assignments, [1], [999])).toBe(true);
    expect(matchesConsultantModuleFilters(assignments, [999], [998])).toBe(false);
  });

  it('does not filter when neither group is supplied', () => {
    expect(matchesConsultantModuleFilters(assignments, [], [])).toBe(true);
  });
});
