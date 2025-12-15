export function transformProjectConsultant(project_consultants_list: any) {
  let proj_consultants = [];

  for (const pc of project_consultants_list) {
    let modules = { core: '', others: '' };
    if (!pc.user) continue;
    for (const mod of pc.user.modules) {
      if (!mod) continue;
      if (mod.module.is_core) modules.core += mod.module.name + ', ';
      else modules.others += mod.module.name + ' ';
    }
    proj_consultants.push({
      project_consultants_id: pc.id,
      status: pc.status,
      role: pc.role,
      decided_rate: pc.decided_rate,
      is_doc_signed: pc.is_doc_signed,
      booking_schedule: pc.booking_schedule,
      name: pc.user.username,
      consultant_id: pc.user.id,
      experience: pc.user.consultants.experience,
      rate: pc.user.consultants.rate,
      weekly_available_hours: pc.user.consultants.weekly_available_hours,
      working_schedule: pc.user.consultants.working_schedule,
      modules,
      interview_date: '2026-02-28T14:30:00.000Z'
    });
  }

  return proj_consultants;
}
