import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/lib";
import { server } from "@/test/server";
import { commentService } from "./comment.service";

const taskId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const comment = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  taskId,
  organizationId: "11111111-1111-4111-8111-111111111111",
  authorId: "33333333-3333-4333-8333-333333333333",
  author: {
    id: "33333333-3333-4333-8333-333333333333",
    email: "owner@example.com",
    firstName: "Olivia",
    lastName: "Owner",
    avatar: null,
    isDeleted: false
  },
  content: "Looks good for launch.",
  edited: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

describe("commentService", () => {
  it("loads task comments with pagination", async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/tasks/:taskId/comments`, ({ request, params }) => {
        expect(params.taskId).toBe(taskId);
        expect(new URL(request.url).searchParams.get("limit")).toBe("10");
        return HttpResponse.json({ success: true, data: { comments: [comment], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } });
      })
    );

    const result = await commentService.getTaskComments(taskId, { limit: 10 });

    expect(result.comments[0]?.author.email).toBe("owner@example.com");
  });

  it("creates a comment using the task comments endpoint", async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/tasks/:taskId/comments`, async ({ request }) => {
        await expect(request.json()).resolves.toEqual({ content: "New update" });
        return HttpResponse.json({ success: true, data: { comment: { ...comment, content: "New update" } } }, { status: 201 });
      })
    );

    const result = await commentService.createComment(taskId, { content: "New update" });

    expect(result.content).toBe("New update");
  });

  it("updates and deletes comments by comment id", async () => {
    server.use(
      http.patch(`${env.apiBaseUrl}/comments/:id`, async ({ params, request }) => {
        expect(params.id).toBe(comment.id);
        await expect(request.json()).resolves.toEqual({ content: "Edited update" });
        return HttpResponse.json({ success: true, data: { comment: { ...comment, content: "Edited update", edited: true } } });
      }),
      http.delete(`${env.apiBaseUrl}/comments/:id`, ({ params }) => {
        expect(params.id).toBe(comment.id);
        return HttpResponse.json({ success: true, data: { deleted: true } });
      })
    );

    await expect(commentService.updateComment(comment.id, { content: "Edited update" })).resolves.toMatchObject({ content: "Edited update", edited: true });
    await expect(commentService.deleteComment(comment.id)).resolves.toEqual({ deleted: true });
  });
});