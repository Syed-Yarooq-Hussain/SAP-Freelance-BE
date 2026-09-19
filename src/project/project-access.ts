import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from 'constant/enums';

export function validateProjectId(projectId: number | string): number {
  const id = Number(projectId);
  if (!Number.isSafeInteger(id) || id < 1)
    throw new BadRequestException('Project ID must be a positive integer');
  return id;
}

/** Shared ownership check; management routes deliberately exclude assigned consultants. */
export function assertProjectAccess(
  project: { client_id: number; deleted_at?: Date } | null,
  user: any,
) {
  if (!project || project.deleted_at)
    throw new NotFoundException('Project not found');
  if (
    Number(user?.role) === UserRole.ADMIN ||
    (Number(user?.role) === UserRole.CLIENT &&
      Number(project.client_id) === Number(user?.id))
  )
    return;
  throw new ForbiddenException('You are not allowed to manage this project');
}
