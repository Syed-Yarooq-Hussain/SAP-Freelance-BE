import { stat } from "fs";
import { end } from "pdfkit";

export function getAdminsClientResponse(list: any[]) {
  let clients = [];

  for (const client of list) {
    const projects = client.projects || [];

    let draft_count = 0;
    let active_count = 0;
    let completed_count = 0;

    for (const p of projects) {
      const status = p.status?.toLowerCase();

      if (status === 'initiated' || status === 'draft') {
        draft_count++;
      }
      else if (status === 'in_progress') {
        active_count++;
      }
      else if (status === 'completed') {
        completed_count++;
      }
    }

    clients.push({
      id: client.id,
      username: client.username,
      email: client.email,
      phone: client.phone,
      status: client.status,
      draft_count,
      active_count,
      completed_count,
    });
  }

  return clients;
}

export function getAdminsConsultantResponse(list: any[]) {
  let consultants = [];

  for (const consuntant of list) {
    const module = {core: '', others: ''};
    for(const mod of consuntant.modules){
      if(mod.module.is_core) 
        module.core += mod.module.name + ', ';
      if(!mod.module.is_core)
        module.others += mod.module.name + ', ';
    }
    consultants.push({
      id: consuntant.id,
      username: consuntant.username,
      email: consuntant.email,
      phone: consuntant.phone,
      status: consuntant.status,
      experience: consuntant.consultants?.experience ?? null,
      rate: consuntant.consultants?.rate ?? null,
      weekly_available_hours: consuntant.consultants?.weekly_available_hours ?? null,
      modules: module,
    });
  }
  return consultants;
}

export function getAdminsProjectResponse(list: any[]) {
  let projects = [];
  const modules = {core: '', others: ''};
  for (const project of list) {
    projects.push({
      id: project.id,
      name: project.name,
      status: project.status,
      client_name: project.client?.username ?? null,
      start_date: project.projectDetails?.start_date ?? null,
      duration: project.projectDetails?.duration ?? null,
      modules
    });
  }
  return projects;
}
