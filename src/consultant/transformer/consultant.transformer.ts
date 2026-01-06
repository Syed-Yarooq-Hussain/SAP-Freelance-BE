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


export function getConsultantProfile(list: any[]) {
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

export function getConsultantleftSideBar(data: any) {
  
  let module = { core: '', others: '' };
  for (const mod of data.consultants?.user?.modules || []) {
      if (!mod?.module) continue;

     if (mod.is_primary) {
       module.core += mod.module.name + ', ';
     } else {
       module.others += mod.module.name + ', ';
     }
   }

   const mappedProject = getTopEmployers(data.projects || []);
  let sidebar = {
    skills: [
      {
        primary_modules : module.core,
        exp : data.consultants.experience,
      },
      {
        other_modules : module.others,
        rate : data.consultants.rate,
      }
    ],
    engagements : {
      Projects : mappedProject,
    }
  }

  return sidebar;
}

function getTopEmployers(projects: any[]) {
  const now = new Date();
  console.log('Projects:', projects.length);
  const sortedProjects = projects
    .filter(p => p.project?.projectDetails)
    .sort(
      (a, b) =>
        new Date(a.project.projectDetails.start_date).getTime() -
        new Date(b.project.projectDetails.start_date).getTime(),
    );

  const current = sortedProjects.find(p => {
    const start = new Date(p.project.projectDetails.start_date);
    const end = new Date(p.project.projectDetails.end_date);
    return start <= now && end >= now;
  });

  const upcoming = sortedProjects
    .filter(p => new Date(p.project.projectDetails.start_date) > now)
    .slice(0, 4); // total top-5 incl current

  return {
    current_employer: current
      ? formatEmployer(current)
      : null,

    upcoming_employers: upcoming.map(formatEmployer),
  };
}

/* =========================
   Helpers
========================= */

function formatEmployer(item: any) {
  const start = new Date(item.project.projectDetails.start_date);
  const end = new Date(item.project.projectDetails.end_date);

  const months =
    Math.max(
      1,
      Math.round(
        (end.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      ),
    );

  return {
    company: item.project.name,
    duration: `${months} months`,
    role: formatRole(item.role),
  };
}

function formatRole(role: string) {
  const roleMap: Record<string, string> = {
    junior: 'Junior Consultant',
    mid: 'Lead Consultant SAP SD, S/4HANA',
    senior: 'Team Lead SAP SD, Fiori',
  };

  return roleMap[role] || role;
}
