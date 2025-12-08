export function getConsultantProjectsResponse(list: any[]) {

    let projects = [];

    for (const item of list) {

        projects.push({
            requested_hours: item.requested_hours ?? null,

            project_id: item.project?.id ?? null,
            project_name: item.project?.name ?? null,
            project_status: item.project?.status ?? null,

            client_id: item.project?.client?.id ?? null,
            client_name: item.project?.client?.username ?? null,

            start_date: item.project?.projectDetails.start_date ?? null,
        });
    }

    return projects;
}
