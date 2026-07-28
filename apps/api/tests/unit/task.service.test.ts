import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppError } from "../../src/core/errors/index.js";
import type { TaskRecord } from "../../src/modules/tasks/task.types.js";
import { ids } from "../helpers/fixtures.js";

const taskRepositoryMock = vi.hoisted(() => ({
  findProjectInOrganization: vi.fn(),
  findUserInOrganization: vi.fn(),
  findTasks: vi.fn(),
  findTaskByIdInOrganization: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  updateTaskAssignee: vi.fn(),
  softDeleteTask: vi.fn()
}));

vi.mock("../../src/modules/tasks/task.repository.js", () => ({ taskRepository: taskRepositoryMock }));

const { taskService } = await import("../../src/modules/tasks/task.service.js");

const now = new Date("2026-01-01T00:00:00.000Z");
const taskRecord = (overrides: Partial<TaskRecord> = {}): TaskRecord => ({
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  title: "Prepare rollout",
  description: "Task description",
  status: "IN_PROGRESS",
  priority: "HIGH",
  dueDate: null,
  assigneeId: ids.memberUser,
  createdById: ids.ownerUser,
  estimatedHours: new Prisma.Decimal(4),
  actualHours: null,
  archived: false,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  project: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Customer Launch", status: "ACTIVE", archived: false },
  assignee: { id: ids.memberUser, email: "member@example.com", firstName: "Maya", lastName: "Member", avatar: null, status: "ACTIVE" },
  createdBy: { id: ids.ownerUser, email: "owner@example.com", firstName: "Olivia", lastName: "Owner", avatar: null, status: "ACTIVE" },
  _count: { comments: 2, attachments: 1 },
  ...overrides
});

describe("TaskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    taskRepositoryMock.findProjectInOrganization.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    taskRepositoryMock.findUserInOrganization.mockResolvedValue({ id: ids.memberUser });
    taskRepositoryMock.findTasks.mockResolvedValue({ tasks: [taskRecord()], total: 1 });
    taskRepositoryMock.createTask.mockResolvedValue(taskRecord());
  });

  it("returns task relation summaries and comment/attachment counts", async () => {
    const result = await taskService.listTasks({ organizationId: ids.organizationA, query: { page: 1, limit: 20, sort: "desc" } });

    expect(result.tasks[0]?.project.name).toBe("Customer Launch");
    expect(result.tasks[0]?.assignee?.email).toBe("member@example.com");
    expect(result.tasks[0]?.commentCount).toBe(2);
    expect(result.tasks[0]?.attachmentCount).toBe(1);
    expect(result.tasks[0]?.estimatedHours).toBe("4");
  });

  it("rejects creating a task for an assignee outside the organization", async () => {
    taskRepositoryMock.findUserInOrganization.mockResolvedValue(null);

    await expect(taskService.createTask({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      data: { projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", title: "Unsafe", assigneeId: ids.targetUser },
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "TASK_ASSIGNEE_NOT_FOUND" });
  });
});