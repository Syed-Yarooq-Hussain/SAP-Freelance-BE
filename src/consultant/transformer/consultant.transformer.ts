export function getConsultantProjectsResponse(list: any[]) {
  return list.map((item) => ({
    requested_hours: item.requested_hours ?? null,

    duration: item.user?.consultant?.working_schedule ?? null,

    project_id: item.project?.id ?? null,
    project_name: item.project?.name ?? null,
    project_status: item.project?.status ?? null,

    client_id: item.project?.client?.id ?? null,
    client_name: item.project?.client?.username ?? null,

    modules:
      item.user?.consultantModules?.map((cm) => ({
        id: cm.module?.id ?? null,
        name: cm.module?.name ?? null,
        is_core: cm.module?.is_core ?? null,
      })) ?? [],

    start_date: item.project?.projectDetails?.start_date ?? null,
  }));
}
