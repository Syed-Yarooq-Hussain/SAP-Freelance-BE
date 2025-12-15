import { stat } from "fs";

export function getAdminsClientResponse(list: any[]) {
  let clients = [];

  for (const client of list) {
    const projects = client.projects || [];

    let draft_count = 0;
    let inprogress_count = 0;
    let completed_count = 0;

    for (const p of projects) {
      const status = p.status?.toLowerCase();

      if (status === 'initiated' || status === 'draft') {
        draft_count++;
      }
      else if (status === 'in_progress') {
        inprogress_count++;
      }
      else if (status === 'completed') {
        completed_count++;
      }
    }

    clients.push({
      id: client.id,
      username: client.username,
      status: client.status,
      draft_count,
      inprogress_count,
      completed_count,
    });
  }

  return clients;
}
