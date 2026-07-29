import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { env } from "@/lib";
import { ids, now } from "@/test/factories";
import { renderWithProviders } from "@/test/render-with-providers";
import { server } from "@/test/server";
import { TaskCommentsSection } from "./task-comments-section";
import type { TaskComment } from "../types";

const taskId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const commentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const createComment = (overrides: Partial<TaskComment> = {}): TaskComment => ({
  id: commentId,
  taskId,
  organizationId: ids.organization,
  authorId: ids.user,
  author: {
    id: ids.user,
    email: "ava@example.com",
    firstName: "Ava",
    lastName: "Owner",
    avatar: null,
    isDeleted: false
  },
  content: "First line\nSecond line",
  edited: false,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const permissions = ["comments.read", "comments.create", "comments.update", "comments.delete"];

const mockComments = (comments: TaskComment[] = [createComment()]): void => {
  server.use(
    http.get(`${env.apiBaseUrl}/tasks/:taskId/comments`, () => HttpResponse.json({
      success: true,
      data: {
        comments,
        pagination: { page: 1, limit: 10, total: comments.length, totalPages: 1 }
      }
    }))
  );
};

describe("TaskCommentsSection", () => {
  it("shows a permission message when comments cannot be read", () => {
    renderWithProviders(<TaskCommentsSection commentCount={0} taskId={taskId} />, { permissions: [] });

    expect(screen.getByText("You do not have permission to view comments for this task.")).toBeInTheDocument();
  });

  it("renders comments with author, timestamps, edited state and multiline content", async () => {
    mockComments([createComment({ edited: true })]);

    renderWithProviders(<TaskCommentsSection commentCount={1} taskId={taskId} />, { permissions });

    expect(await screen.findByText("Ava Owner")).toBeInTheDocument();
    expect(screen.getByText(/edited/)).toBeInTheDocument();
    expect(screen.getByText(/First line/)).toHaveTextContent("First line Second line");
  });

  it("renders deleted-author fallback safely", async () => {
    mockComments([createComment({ author: { id: ids.user, email: "removed@example.com", firstName: "", lastName: "", avatar: null, isDeleted: true } })]);

    renderWithProviders(<TaskCommentsSection commentCount={1} taskId={taskId} />, { permissions });

    expect(await screen.findByText("Deleted user")).toBeInTheDocument();
    expect(screen.queryByText("removed@example.com")).not.toBeInTheDocument();
  });

  it("validates, links textarea errors and posts a new plain-text comment", async () => {
    const user = userEvent.setup();
    const createHandler = vi.fn(async () => HttpResponse.json({ success: true, data: { comment: createComment({ content: "New update" }) } }, { status: 201 }));
    mockComments([]);
    server.use(http.post(`${env.apiBaseUrl}/tasks/:taskId/comments`, createHandler));

    renderWithProviders(<TaskCommentsSection commentCount={0} taskId={taskId} />, { permissions });

    await user.type(screen.getByLabelText("Add a comment"), "   ");
    expect(screen.getByRole("button", { name: "Post comment" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Add a comment"), { target: { value: "x".repeat(5001) } });
    await user.click(screen.getByRole("button", { name: "Post comment" }));
    const textarea = screen.getByLabelText("Add a comment");
    const errorId = textarea.getAttribute("aria-describedby");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(errorId ?? "")).toHaveTextContent("Comment must be 5,000 characters or fewer.");

    await user.clear(textarea);
    await user.type(textarea, "New update");
    await user.click(screen.getByRole("button", { name: "Post comment" }));

    await waitFor(() => expect(createHandler).toHaveBeenCalledTimes(1));
  });

  it("edits an owned comment from the keyboard-operable action menu", async () => {
    const user = userEvent.setup();
    const updateHandler = vi.fn(async () => HttpResponse.json({ success: true, data: { comment: createComment({ content: "Edited update", edited: true }) } }));
    mockComments([createComment()]);
    server.use(http.patch(`${env.apiBaseUrl}/comments/:id`, updateHandler));

    renderWithProviders(<TaskCommentsSection commentCount={1} taskId={taskId} />, { permissions });

    await user.click(await screen.findByRole("button", { name: "Comment actions" }));
    await user.keyboard("{Tab}{Enter}");
    await user.clear(screen.getByLabelText("Edit comment"));
    await user.type(screen.getByLabelText("Edit comment"), "Edited update");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateHandler).toHaveBeenCalledTimes(1));
  });

  it("soft deletes an owned comment from an accessible confirmation dialog", async () => {
    const user = userEvent.setup();
    const deleteHandler = vi.fn(() => HttpResponse.json({ success: true, data: { deleted: true } }));
    mockComments([createComment()]);
    server.use(http.delete(`${env.apiBaseUrl}/comments/:id`, deleteHandler));

    renderWithProviders(<TaskCommentsSection commentCount={1} taskId={taskId} />, { permissions });

    await user.click(await screen.findByRole("button", { name: "Comment actions" }));
    await user.click(screen.getByRole("menuitem", { name: /Delete/ }));
    const dialog = screen.getByRole("dialog", { name: "Delete Comment" });
    expect(dialog).toHaveAccessibleDescription("This comment will be soft deleted and removed from this task conversation.");
    expect(within(dialog).getByRole("button", { name: "Delete comment" })).not.toHaveFocus();
    await user.click(within(dialog).getByRole("button", { name: "Delete comment" }));

    await waitFor(() => expect(deleteHandler).toHaveBeenCalledTimes(1));
  });
});

