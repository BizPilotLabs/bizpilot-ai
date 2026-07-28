import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectRecord } from "../../src/modules/projects/project.types.js";
import type { AppError } from "../../src/core/errors/index.js";
import { ids } from "../helpers/fixtures.js";

const projectRepositoryMock = vi.hoisted(() => ({
  findProjects: vi.fn(),
  findProjectByIdInOrganization: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  softDeleteProject: vi.fn()
}));

vi.mock("../../src/modules/projects/project.repository.js", () => ({ projectRepository: projectRepositoryMock }));

const { projectService } = await import("../../src/modules/projects/project.service.js");

const now = new Date("2026-01-01T00:00:00.000Z");
const projectRecord = (overrides: Partial<ProjectRecord> = {}): ProjectRecord => ({
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  organizationId: ids.organizationA,
  name: "Customer Launch",
  description: "Launch project",
  status: "ACTIVE",
  startDate: null,
  endDate: null,
  color: null,
  archived: false,
  createdById: ids.ownerUser,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  createdBy: {
    id: ids.ownerUser,
    email: "owner@example.com",
    firstName: "Olivia",
    lastName: "Owner",
    avatar: null
  },
  taskCount: 4,
  completedTaskCount: 3,
  ...overrides
});

describe("ProjectService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectRepositoryMock.findProjects.mockResolvedValue({ projects: [projectRecord()], total: 1 });
    projectRepositoryMock.createProject.mockImplementation((input) => Promise.resolve(projectRecord({ name: input.data.name, startDate: input.data.startDate ?? null, endDate: input.data.endDate ?? null })));
  });

  it("returns backend-derived project progress from non-deleted task totals", async () => {
    const result = await projectService.listProjects({ organizationId: ids.organizationA, query: { page: 1, limit: 20, sort: "desc" } });

    expect(result.projects[0]?.taskCount).toBe(4);
    expect(result.projects[0]?.completedTaskCount).toBe(3);
    expect(result.projects[0]?.progressPercentage).toBe(75);
  });

  it("handles zero-task projects without dividing by zero", async () => {
    projectRepositoryMock.findProjects.mockResolvedValue({ projects: [projectRecord({ taskCount: 0, completedTaskCount: 0 })], total: 1 });

    const result = await projectService.listProjects({ organizationId: ids.organizationA, query: { page: 1, limit: 20, sort: "desc" } });

    expect(result.projects[0]?.progressPercentage).toBe(0);
  });

  it("rejects project date ranges where end date is before start date", async () => {
    await expect(projectService.createProject({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      data: { name: "Invalid", startDate: new Date("2026-02-01T00:00:00.000Z"), endDate: new Date("2026-01-01T00:00:00.000Z") },
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "PROJECT_INVALID_DATE_RANGE" });
  });
});