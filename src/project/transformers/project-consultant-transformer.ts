export function transformProjectConsultant(project_consultants_list: any) {
  let proj_consultants = [];

  for (const pc of project_consultants_list) {
    let modules = { core: '', others: '' };
    const coreModuleIds: number[] = [];
    const otherModuleIds: number[] = [];
    for (const mod of pc.user.modules || []) {
      if(mod.module) {
        if (mod.is_primary) {
          modules.core += mod.module.name + ', ';
          coreModuleIds.push(Number(mod.module.id));
        } else {
          modules.others += mod.module.name + ', ';
          otherModuleIds.push(Number(mod.module.id));
        }
      }
    }
    modules.core = modules.core.replace(/, $/, '');
    modules.others = modules.others.replace(/, $/, '');
    proj_consultants.push({
      project_consultants_id: pc.id,
      status: pc.status,
      role: pc.role,
      decided_rate: pc.decided_rate,
      is_doc_signed: pc.is_doc_signed,
      booking_schedule: pc.booking_schedule,
      requested_hours: pc.requested_hours,
      name: pc.user.username,
      consultant_id: pc.user.id,
      email: pc.user.email,
      phone: pc.user.phone,
      experience: pc.user.consultants.experience,
      rate: pc.user.consultants.rate,
      currency: pc.user.currency || 'USD',
      weekly_available_hours: pc.user.consultants.weekly_available_hours,
      working_schedule: pc.user.consultants.working_schedule,
      modules,
      core_module_ids: coreModuleIds,
      other_module_ids: otherModuleIds,
      interview_date: pc.user.receivedInvites[0]?.meeting?.date_time || null,
      meeting_id: pc.user.receivedInvites[0]?.meeting?.id || null,
    });
  }

  return proj_consultants;
}
