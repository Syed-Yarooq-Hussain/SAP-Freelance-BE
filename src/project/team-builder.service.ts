import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Op, Transaction } from 'sequelize';
import { Project } from 'models/project.model';
import { ProjectConsultant } from 'models/project-consultant.model';
import { User } from 'models/user.model';
import { Consultant } from 'models/consultant.model';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';
import { ConsultantStatus, UserRole, UserStatus } from 'constant/enums';
import { applyClientProfitMargin } from 'src/common/utils/client-rate.util';
import { SaveTeamBuilderDto, TeamBuilderRoleDto } from './dto/team-builder.dto';
import { assertProjectAccess, validateProjectId } from './project-access';

export function validateTeamHierarchy(dto: SaveTeamBuilderDto) {
  const members = new Set(
    dto.consultants.map((item) => String(item.consultant_id)),
  );
  if (members.size !== dto.consultants.length)
    throw new BadRequestException('Duplicate consultant IDs');
  const roles = new Map(dto.roles.map((role) => [role.id, role]));
  if (roles.size !== dto.roles.length)
    throw new BadRequestException('Duplicate position IDs');
  for (const role of dto.roles) {
    if (!role.placed && role.parentId !== null)
      throw new BadRequestException('Unplaced positions cannot have a parent');
    if (role.personIds.some((id) => !members.has(id)))
      throw new BadRequestException(
        'Position assignees must belong to the submitted team',
      );
    const visited = new Set([role.id]);
    let parentId = role.parentId;
    while (parentId !== null) {
      const parent = roles.get(parentId);
      if (!parent?.placed)
        throw new BadRequestException(
          'Parent must reference a placed position',
        );
      if (visited.has(parentId))
        throw new BadRequestException('Position hierarchy contains a cycle');
      visited.add(parentId);
      parentId = parent.parentId;
    }
  }
}

const active = (member: ProjectConsultant) =>
  !member.deleted_at &&
  member.status?.toLowerCase() !== ConsultantStatus.REJECTED;
const protectedMember = (member: ProjectConsultant) =>
  [ConsultantStatus.OFFERED, ConsultantStatus.HIRED].includes(
    member.status?.toLowerCase() as ConsultantStatus,
  ) ||
  member.is_doc_signed ||
  member.booking_schedule != null;
const amount = (value: unknown) =>
  Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;

@Injectable()
export class TeamBuilderService {
  async locked<T>(
    projectId: number,
    user: any,
    work: (project: Project, transaction: Transaction) => Promise<T>,
  ) {
    validateProjectId(projectId);
    if (![UserRole.ADMIN, UserRole.CLIENT].includes(Number(user?.role)))
      throw new ForbiddenException(
        'Only clients and admins can manage the team',
      );
    return Project.sequelize.transaction(async (transaction) => {
      const project = await Project.findByPk(projectId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      assertProjectAccess(project, user);
      return work(project, transaction);
    });
  }

  async get(projectId: number, user: any) {
    validateProjectId(projectId);
    return Project.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
        readOnly: true,
      },
      async (transaction) => {
        const project = await Project.findByPk(projectId, { transaction });
        assertProjectAccess(project, user);
        return {
          message: 'Team builder loaded',
          data: await this.snapshot(project, transaction),
        };
      },
    );
  }

  async save(
    projectId: number,
    user: any,
    dto: SaveTeamBuilderDto,
    sync: (transaction: Transaction) => Promise<void>,
  ) {
    return this.locked(projectId, user, (project, transaction) =>
      this.replace(project, transaction, dto, sync),
    );
  }

  async replace(
    project: Project,
    transaction: Transaction,
    input: SaveTeamBuilderDto,
    sync: (transaction: Transaction) => Promise<void>,
  ) {
    const dto = plainToInstance(SaveTeamBuilderDto, input);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) throw new BadRequestException(errors);
    if (dto.revision !== project.team_builder_revision)
      throw new ConflictException(
        'Team builder changed. Reload the project before saving your draft.',
      );
    validateTeamHierarchy(dto);
    const existing = await ProjectConsultant.findAll({
      where: { project_id: project.id },
      transaction,
    });
    const submitted = new Map(
      dto.consultants.map((member) => [String(member.consultant_id), member]),
    );
    for (const member of existing.filter(active)) {
      const next = submitted.get(String(member.consultant_id));
      if (
        !next &&
        [
          ConsultantStatus.INTERVIEW_SCHEDULED,
          ConsultantStatus.INTERVIEW_DONE,
        ].includes(member.status?.toLowerCase() as ConsultantStatus)
      ) {
        throw new ConflictException(
          `Consultant ${member.consultant_id} has interview history; reject the assignment explicitly before removal.`,
        );
      }
      if (
        protectedMember(member) &&
        (!next || next.requested_hours !== Number(member.requested_hours))
      ) {
        throw new ConflictException(
          `Consultant ${member.consultant_id} has an offer, contract or booking; removal and hour changes require the explicit workflow.`,
        );
      }
    }
    // Lock consultant profiles in a stable order across projects before checking capacity.
    const profiles = dto.consultants.length
      ? await Consultant.findAll({
          where: {
            user_id: {
              [Op.in]: dto.consultants.map((item) => item.consultant_id),
            },
          },
          order: [['user_id', 'ASC']],
          transaction,
          lock: transaction.LOCK.UPDATE,
        })
      : [];
    const users = dto.consultants.length
      ? await User.findAll({
          where: {
            id: { [Op.in]: dto.consultants.map((item) => item.consultant_id) },
            role: UserRole.CONSULTANT,
            status: UserStatus.ACTIVE,
            deleted_at: null,
          },
          attributes: ['id'],
          transaction,
        })
      : [];
    const selectable = new Set(users.map((user) => Number(user.id)));
    const capacities = await this.capacities(
      profiles.map((profile) => ({
        id: Number(profile.user_id),
        weeklyHours: profile.weekly_available_hours,
      })),
      project.id,
      transaction,
    );
    for (const item of dto.consultants) {
      const profile = profiles.find(
        (profile) => Number(profile.user_id) === item.consultant_id,
      );
      if (!selectable.has(item.consultant_id) || !profile)
        throw new BadRequestException(
          `User ${item.consultant_id} is not a selectable consultant`,
        );
      const member = existing.find(
        (member) => Number(member.consultant_id) === item.consultant_id,
      );
      if (member?.status?.toLowerCase() === ConsultantStatus.REJECTED)
        throw new ConflictException(
          `Rejected consultant ${item.consultant_id} must be explicitly re-shortlisted first`,
        );
      if (member && !active(member) && protectedMember(member))
        throw new ConflictException(
          `Consultant ${item.consultant_id} has protected workflow data`,
        );
      const capacity = capacities.get(item.consultant_id);
      if (item.requested_hours > capacity)
        throw new BadRequestException(
          `Consultant ${item.consultant_id} has only ${capacity} allocatable hours for this project`,
        );
    }
    // Validation completes before the first write; all writes still roll back together.
    for (const member of existing.filter(active)) {
      if (!submitted.has(String(member.consultant_id)))
        await member.update({ deleted_at: new Date() }, { transaction });
    }
    for (const item of dto.consultants) {
      const member = existing.find(
        (member) => Number(member.consultant_id) === item.consultant_id,
      );
      if (member) {
        await member.update(
          {
            requested_hours: item.requested_hours,
            ...(member.deleted_at
              ? { deleted_at: null, status: ConsultantStatus.SHORTLISTED }
              : {}),
          },
          { transaction },
        );
      } else {
        const profile = profiles.find(
          (profile) => Number(profile.user_id) === item.consultant_id,
        );
        await ProjectConsultant.create(
          {
            project_id: project.id,
            ...item,
            status: ConsultantStatus.SHORTLISTED,
            decided_rate: amount(profile.rate),
            is_doc_signed: false,
            booking_schedule: null,
          },
          { transaction },
        );
      }
    }
    await sync(transaction);
    // Member triggers may have advanced the revision within this transaction.
    // A replacement is one logical edit, so publish exactly the next revision.
    await project.update(
      {
        team_builder_roles: dto.roles,
        team_builder_revision: dto.revision + 1,
      },
      { transaction },
    );
    return {
      message: 'Team builder saved',
      data: await this.snapshot(project, transaction),
    };
  }

  private async capacities(
    profiles: { id: number; weeklyHours: unknown }[],
    projectId: number,
    transaction: Transaction,
  ) {
    const result = new Map(
      profiles.map((profile) => [profile.id, amount(profile.weeklyHours)]),
    );
    if (!profiles.length) return result;
    const bookings = await ProjectConsultant.findAll({
      where: {
        consultant_id: { [Op.in]: profiles.map((profile) => profile.id) },
        project_id: { [Op.ne]: projectId },
        deleted_at: null,
        status: { [Op.in]: ['hired', 'Hired'] },
      },
      attributes: ['consultant_id', 'requested_hours'],
      include: [
        {
          model: Project,
          attributes: [],
          required: true,
          where: {
            deleted_at: null,
            status: {
              [Op.in]: [
                'initiated',
                'Initiated',
                'completed',
                'Completed',
                'complete',
                'Complete',
              ],
            },
          },
        },
      ],
      transaction,
    });
    for (const member of bookings) {
      const id = Number(member.consultant_id);
      result.set(
        id,
        Math.max(0, result.get(id) - amount(member.requested_hours)),
      );
    }
    return result;
  }

  async snapshot(project: Project, transaction: Transaction) {
    const members = (
      await ProjectConsultant.findAll({
        where: { project_id: project.id, deleted_at: null },
        order: [['id', 'ASC']],
        transaction,
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'currency'],
            include: [
              {
                model: Consultant,
                attributes: [
                  'rate',
                  'experience',
                  'weekly_available_hours',
                  'working_schedule',
                ],
              },
              {
                model: ConsultantModule,
                attributes: ['is_primary'],
                include: [{ model: ModuleEntity, attributes: ['name'] }],
              },
            ],
          },
        ],
      })
    ).filter(active);
    const client = await User.findByPk(project.client_id, {
      attributes: ['profit_margin_percentage'],
      transaction,
    });
    const capacities = await this.capacities(
      members.map((member) => ({
        id: Number(member.consultant_id),
        weeklyHours: member.user?.consultants?.weekly_available_hours,
      })),
      project.id,
      transaction,
    );
    const consultants = [];
    for (const member of members) {
      const user = member.user;
      const profile = user?.consultants;
      if (!user || !profile)
        throw new ConflictException(
          `Consultant ${member.consultant_id} has no profile; repair the membership before editing`,
        );
      const modules = { core: '', others: '' };
      for (const key of ['core', 'others']) {
        modules[key] = (user.modules || [])
          .filter((item) => Boolean(item.is_primary) === (key === 'core'))
          .map((item) => item.module?.name)
          .filter(Boolean)
          .join(', ');
      }
      consultants.push({
        id: Number(user.id),
        name: user.username,
        modules,
        experience: profile.experience,
        rate: applyClientProfitMargin(
          amount(profile.rate),
          client?.profit_margin_percentage,
        ),
        currency: user.currency,
        weekly_available_hours: capacities.get(Number(user.id)),
        requested_hours: Math.max(
          1,
          Math.trunc(amount(member.requested_hours)),
        ),
        working_schedule: profile.working_schedule,
        role: member.role || null,
        status: member.status,
      });
    }
    return {
      revision: project.team_builder_revision,
      roles: project.team_builder_roles as TeamBuilderRoleDto[],
      consultants,
    };
  }
}
