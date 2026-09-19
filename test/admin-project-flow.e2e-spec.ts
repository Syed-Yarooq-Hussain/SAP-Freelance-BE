import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { UserRole } from '../constant/enums';
import { ConsultantMonthlyBillRepository } from '../repository/consultant-monthly-bill.repository';
import { ConsultantRepository } from '../repository/consultant.repository';
import { ProjectConsultantRepository } from '../repository/project-consultant.repository';
import { ProjectDetailRepository } from '../repository/project-detail.repository';
import { ProjectDocumentRepository } from '../repository/project-document.repository';
import { ProjectIndustriesRepository } from '../repository/project-indestries.repository';
import { ProjectMilestoneRepository } from '../repository/project-milestone.repository';
import { ProjectPaymentRepository } from '../repository/project-payment.repository';
import { ProjectRepository } from '../repository/project.repository';
import { ProjectTaskRepository } from '../repository/project-task.repository';
import { UserRepository } from '../repository/user.repository';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ProjectController } from '../src/project/project.controller';
import { ProjectService } from '../src/project/project.service';
import { TeamBuilderService } from '../src/project/team-builder.service';
import { ProjectConsultant } from '../models/project-consultant.model';
import { assertProjectAccess } from '../src/project/project-access';
import { CommonService } from '../src/utility/common.service';
import { User } from '../models/user.model';

class HeaderAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: Number(request.headers['x-user-id']),
      role: Number(request.headers['x-user-role']),
      username: request.headers['x-user-name'] || 'Authenticated User',
    };
    return true;
  }
}

describe('Admin project-on-behalf flow (integration)', () => {
  let app: INestApplication;
  let projects: any[];
  let milestones: any[];
  let assignments: any[];
  let payments: any[];
  let tasks: any[];

  const users: Record<number, any> = {
    123: { id: 123, username: 'Active Client', role: UserRole.CLIENT, status: 'active', deleted_at: null },
    124: { id: 124, username: 'Locked Client', role: UserRole.CLIENT, status: 'locked', deleted_at: null },
    125: { id: 125, username: 'Other Client', role: UserRole.CLIENT, status: 'active', deleted_at: null },
    200: { id: 200, username: 'Consultant', role: UserRole.CONSULTANT, status: 'active', deleted_at: null },
    201: { id: 201, username: 'Unassigned Consultant', role: UserRole.CONSULTANT, status: 'active', deleted_at: null },
  };

  const model = (values: any) => ({
    ...values,
    toJSON() {
      const { toJSON, ...plain } = this as any;
      return plain;
    },
  });

  beforeEach(async () => {
    projects = [];
    milestones = [];
    assignments = [];
    payments = [];
    tasks = [];

    const projectRepo = {
      create: jest.fn(async (data: any) => {
        const project = model({ id: projects.length + 1, deleted_at: null, team_builder_roles: [], team_builder_revision: 0, ...data });
        projects.push(project);
        return project;
      }),
      findById: jest.fn(async (id: number) => projects.find(item => item.id === id) || null),
      update: jest.fn(async (id: number, data: any) => {
        const project = projects.find(item => item.id === id);
        if (!project) return [0, []];
        Object.assign(project, data);
        return [1, [project]];
      }),
      delete: jest.fn(async (id: number) => {
        const index = projects.findIndex(item => item.id === id);
        if (index < 0) return 0;
        projects.splice(index, 1);
        return 1;
      }),
    };

    const milestoneRepo = {
      bulkCreateMilestones: jest.fn(async (items: any[]) => {
        const created = items.map(item => model({ id: milestones.length + 1, deleted_at: null, ...item }));
        milestones.push(...created);
        return created;
      }),
      create: jest.fn(async (data: any) => {
        const milestone = model({ id: milestones.length + 1, deleted_at: null, ...data });
        milestones.push(milestone);
        return milestone;
      }),
      findAll: jest.fn(async ({ where }: any) => milestones.filter(item => item.project_id === where.project_id)),
      findByProjectId: jest.fn(async (projectId: number) => milestones.filter(item => item.project_id === projectId)),
      findOverlapping: jest.fn(async () => null),
      findById: jest.fn(async (id: number) => milestones.find(item => item.id === id) || null),
      update: jest.fn(async (id: number, data: any) => {
        const milestone = milestones.find(item => item.id === id);
        if (!milestone) return null;
        Object.assign(milestone, data);
        return milestone;
      }),
    };

    const projectConsultantRepo = {
      findByProjectIdConsultantId: jest.fn(async (projectId: number, consultantId: number) =>
        assignments.find(item => item.project_id === Number(projectId) && item.consultant_id === Number(consultantId)) || null,
      ),
      findOneByProjectAndConsultant: jest.fn(async (projectId: number, consultantId: number) =>
        assignments.find(item => item.project_id === Number(projectId) && item.consultant_id === Number(consultantId)) || null,
      ),
      create: jest.fn(async (data: any) => {
        const assignment = model({ id: assignments.length + 1, deleted_at: null, ...data });
        assignments.push(assignment);
        return assignment;
      }),
      findByProjectId: jest.fn(async (projectId: number) => assignments.filter(item => item.project_id === projectId && !item.deleted_at)),
      update: jest.fn(async (where: any, data: any) => {
        const assignment = assignments.find(item => item.project_id === Number(where.project_id) && item.consultant_id === Number(where.consultant_id));
        if (!assignment) return [0, []];
        Object.assign(assignment, data);
        return [1, [assignment]];
      }),
      softDeleteNotIn: jest.fn(async () => [0]),
      softDeleteOne: jest.fn(async () => [0]),
      findAll: jest.fn(async () => []),
    };

    const paymentRepo = {
      findById: jest.fn(async (id: number) => payments.find(item => item.id === id) || null),
      findAll: jest.fn(async ({ where }: any) => payments.filter(item => item.project_id === where.project_id)),
      update: jest.fn(async (id: number, data: any) => {
        const payment = payments.find(item => item.id === id);
        if (!payment) return [0, []];
        Object.assign(payment, data);
        return [1, [payment]];
      }),
      hasPaidByMilestoneId: jest.fn(async () => false),
      deleteUnpaidByMilestoneId: jest.fn(async () => undefined),
      create: jest.fn(async (data: any) => {
        const payment = model({ id: payments.length + 1, deleted_at: null, ...data });
        payments.push(payment);
        return payment;
      }),
    };

    // This suite isolates project orchestration; the real persistence path is
    // exercised in team-builder.e2e-spec.ts against PostgreSQL.
    jest.spyOn(ProjectConsultant, 'findAll').mockImplementation(async () => assignments as any);
    const moduleBuilder = Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        ProjectService,
        { provide: TeamBuilderService, useValue: {
          locked: async (id: number, user: any, work: any) => {
            const project = await projectRepo.findById(id);
            assertProjectAccess(project, user);
            return work(project, undefined);
          },
          replace: async (project: any, _transaction: any, dto: any, sync: any) => {
            for (const item of dto.consultants) await projectConsultantRepo.create({ project_id: project.id, ...item, status: 'shortlisted' });
            await sync(undefined);
          },
        } },
        RolesGuard,
        Reflector,
        JwtAuthGuard,
        { provide: ProjectRepository, useValue: projectRepo },
        { provide: ProjectConsultantRepository, useValue: projectConsultantRepo },
        { provide: ProjectIndustriesRepository, useValue: { findAll: jest.fn(async () => []) } },
        { provide: ProjectMilestoneRepository, useValue: milestoneRepo },
        { provide: ProjectPaymentRepository, useValue: paymentRepo },
        { provide: ProjectDetailRepository, useValue: {
          findByProjectId: jest.fn(async () => null),
          create: jest.fn(async (data: any) => data),
          update: jest.fn(async () => [1, []]),
        } },
        { provide: ProjectTaskRepository, useValue: { create: jest.fn(async (data: any) => { tasks.push(data); return data; }) } },
        { provide: ConsultantRepository, useValue: { findByUserId: jest.fn(async (id: number) => id === 200 ? { rate: 100 } : null) } },
        { provide: ConsultantMonthlyBillRepository, useValue: {} },
        { provide: ProjectDocumentRepository, useValue: {} },
        { provide: CommonService, useValue: {} },
        { provide: UserRepository, useValue: {
          findClientCandidateById: jest.fn(async (id: number) => users[id] || null),
          findById: jest.fn(async (id: number) => users[id] || null),
        } },
      ],
    });
    const moduleRef = await moduleBuilder
      .overrideGuard(JwtAuthGuard)
      .useClass(HeaderAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  const asUser = (req: request.Test, id: number, role: UserRole) =>
    req.set('x-user-id', String(id)).set('x-user-role', String(role));

  it('creates for an active client and retains the admin audit actor', async () => {
    const response = await asUser(
      request(app.getHttpServer()).post('/projects/create').send({ client_id: 123 }),
      900,
      UserRole.ADMIN,
    ).expect(201);

    expect(response.body).toMatchObject({
      status: 'success',
      data: {
        id: 1,
        client_id: 123,
        created_by: 900,
        created_on_behalf: true,
        name: 'New Project for Active Client',
        status: 'Initiated',
      },
    });
    expect(response.body.data.client_id).not.toBe(900);
    expect(tasks).toHaveLength(0);
  });

  it.each([
    [{}, 400],
    [{ client_id: 999 }, 404],
    [{ client_id: 124 }, 400],
    [{ client_id: 200 }, 400],
  ])('rejects a missing, invalid, locked, or non-client selection', async (body, status) => {
    await asUser(
      request(app.getHttpServer()).post('/projects/create').send(body),
      900,
      UserRole.ADMIN,
    ).expect(status);
  });

  it('prevents client impersonation and preserves normal client creation', async () => {
    await asUser(
      request(app.getHttpServer()).post('/projects/create').send({ client_id: 123 }),
      125,
      UserRole.CLIENT,
    ).expect(403);

    const response = await asUser(
      request(app.getHttpServer()).post('/projects/create').send({ client_id: 125 }),
      125,
      UserRole.CLIENT,
    ).expect(201);

    expect(response.body.data).toMatchObject({
      client_id: 125,
      created_by: 125,
      created_on_behalf: false,
      status: 'Initiated',
    });
  });

  it('lets an admin shortlist, add a milestone, review payment, and start the project', async () => {
    await asUser(
      request(app.getHttpServer()).post('/projects/create').send({ client_id: 123 }),
      900,
      UserRole.ADMIN,
    ).expect(201);

    await asUser(
      request(app.getHttpServer()).post('/projects/1/consultants').send([{ consultant_id: 200, requested_hours: 20 }]),
      900,
      UserRole.ADMIN,
    ).expect(201);
    expect(assignments[0]).toMatchObject({ project_id: 1, consultant_id: 200, status: 'shortlisted' });

    await asUser(
      request(app.getHttpServer()).post('/projects/1/milestones').send({ name: 'Go live', description: '', status: 'Pending' }),
      900,
      UserRole.ADMIN,
    ).expect(201);
    expect(milestones.some(item => item.project_id === 1 && item.name === 'Go live')).toBe(true);

    payments.push(model({ id: 1, project_id: 1, amount: 1000, is_paid: false }));
    await asUser(
      request(app.getHttpServer()).put('/projects/payments/1').send({ is_paid: true }),
      900,
      UserRole.ADMIN,
    ).expect(200);

    await asUser(
      request(app.getHttpServer()).put('/projects/1').send({ status: 'in_progress' }),
      900,
      UserRole.ADMIN,
    ).expect(200);

    expect(payments[0].is_paid).toBe(true);
    expect(projects[0].status).toBe('in_progress');
    expect(tasks).toHaveLength(0);
  });

  it('includes the selected client whole-number margin in milestone cost', async () => {
    await asUser(
      request(app.getHttpServer()).post('/projects/create').send({ client_id: 123 }),
      900,
      UserRole.ADMIN,
    ).expect(201);

    projects[0].client = { id: 123, profit_margin_percentage: 20 };
    assignments.push(model({
      id: 1,
      project_id: 1,
      consultant_id: 200,
      requested_hours: 40,
      decided_rate: 100,
      status: 'hired',
      deleted_at: null,
    }));

    await asUser(
      request(app.getHttpServer()).post('/projects/1/milestones').send({
        name: 'Margin milestone',
        description: '',
        start_date: '2026-09-07',
        due_date: '2026-09-07',
        status: 'Pending',
      }),
      900,
      UserRole.ADMIN,
    ).expect(201);

    expect(payments[0]).toMatchObject({
      project_id: 1,
      amount: 960,
      is_paid: false,
    });
  });

  it('resolves GET /projects/milestones/:id as a milestone route', async () => {
    await asUser(
      request(app.getHttpServer()).post('/projects/create').send({ client_id: 123 }),
      900,
      UserRole.ADMIN,
    ).expect(201);

    const response = await asUser(
      request(app.getHttpServer()).get('/projects/milestones/1'),
      900,
      UserRole.ADMIN,
    ).expect(200);

    expect(response.body.data).toMatchObject({
      id: 1,
      project_id: 1,
      name: 'Planning',
    });
  });

  it('resolves PUT /projects/milestones/:id as a milestone update route', async () => {
    await asUser(
      request(app.getHttpServer()).post('/projects/create').send({ client_id: 123 }),
      900,
      UserRole.ADMIN,
    ).expect(201);

    // PostgreSQL BIGINT values are commonly returned as strings by the pg driver.
    milestones[0].project_id = '1';

    const response = await asUser(
      request(app.getHttpServer())
        .put('/projects/milestones/1')
        .send({ name: 'Updated planning', description: '', status: 'Pending' }),
      900,
      UserRole.ADMIN,
    ).expect(200);

    expect(response.body.data).toMatchObject({
      id: 1,
      project_id: '1',
      name: 'Updated planning',
    });
  });

  it('blocks another client and an unassigned consultant from modifying the project', async () => {
    await asUser(
      request(app.getHttpServer()).post('/projects/create').send({ client_id: 123 }),
      900,
      UserRole.ADMIN,
    ).expect(201);

    await asUser(
      request(app.getHttpServer()).put('/projects/1').send({ status: 'in_progress' }),
      125,
      UserRole.CLIENT,
    ).expect(403);

    await asUser(
      request(app.getHttpServer()).put('/projects/1').send({ status: 'in_progress' }),
      201,
      UserRole.CONSULTANT,
    ).expect(403);
  });

  it('uses the owned-project alias in admin client and consultant queries', async () => {
    const findAll = jest.spyOn(User, 'findAll').mockResolvedValue([] as any);
    const repository = new UserRepository({} as any);

    await repository.getAllClientsWithProjectstatus('active');
    expect((findAll.mock.calls[0][0] as any).include[0].as).toBe('projects');

    await repository.findAllUsersWithConsultants();
    expect((findAll.mock.calls[1][0] as any).include[2].as).toBe('projects');

    findAll.mockRestore();
  });
});
