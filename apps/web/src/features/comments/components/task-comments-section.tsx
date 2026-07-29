import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, Dropdown, DropdownButton, Modal, Pagination, Skeleton, Textarea } from "@/components/ui";
import { useToast } from "@/hooks";
import { useAuthStore } from "@/store";
import { commentContentSchema } from "../schemas";
import { getCommentErrorMessage, useCreateComment, useDeleteComment, useTaskComments, useUpdateComment } from "../hooks";
import type { TaskComment } from "../types";

export interface TaskCommentsSectionProps {
  commentCount: number;
  taskId: string;
}

const pageSize = 10;

const hasPermission = (permissions: { key: string }[], key: string): boolean => permissions.some((permission) => permission.key === key);
const isOwnerOrAdmin = (roles: { name: string }[]): boolean => roles.some((role) => role.name === "Owner" || role.name === "Admin");

const getAuthorName = (comment: TaskComment): string => {
  if (comment.author.isDeleted) {
    return "Deleted user";
  }

  const name = `${comment.author.firstName} ${comment.author.lastName}`.trim();
  return name.length > 0 ? name : comment.author.email;
};

const formatTimestamp = (value: string): string => new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
}).format(new Date(value));

export function TaskCommentsSection({ commentCount, taskId }: TaskCommentsSectionProps): ReactElement {
  const [page, setPage] = useState(1);
  const [content, setContent] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<TaskComment | null>(null);
  const { addToast } = useToast();
  const currentUser = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const roles = useAuthStore((state) => state.roles);
  const canRead = hasPermission(permissions, "comments.read");
  const canCreate = hasPermission(permissions, "comments.create");
  const canUpdate = hasPermission(permissions, "comments.update");
  const canDelete = hasPermission(permissions, "comments.delete");
  const canModerate = isOwnerOrAdmin(roles);
  const commentsQuery = useTaskComments(canRead ? taskId : undefined, { page, limit: pageSize, sort: "asc" });
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const comments = useMemo(() => commentsQuery.data?.comments ?? [], [commentsQuery.data?.comments]);
  const pagination = commentsQuery.data?.pagination;
  const visibleCount = pagination?.total ?? commentCount;

  const permissionsByCommentId = useMemo(() => {
    const map = new Map<string, { canEdit: boolean; canRemove: boolean }>();
    for (const comment of comments) {
      const isAuthor = currentUser?.id === comment.authorId;
      map.set(comment.id, {
        canEdit: canUpdate && (isAuthor || canModerate),
        canRemove: canDelete && (isAuthor || canModerate)
      });
    }
    return map;
  }, [canDelete, canModerate, canUpdate, comments, currentUser?.id]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setCreateError(null);
    const parsed = commentContentSchema.safeParse({ content });
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? "Comment is invalid.");
      return;
    }

    try {
      await createComment.mutateAsync({ taskId, data: parsed.data });
      setContent("");
      setPage(1);
      addToast({ title: "Comment added", description: "Your comment has been posted.", variant: "success" });
    } catch (error) {
      setCreateError(getCommentErrorMessage(error));
    }
  };

  const startEditing = (comment: TaskComment): void => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setEditError(null);
  };

  const cancelEditing = (): void => {
    setEditingCommentId(null);
    setEditContent("");
    setEditError(null);
  };

  const handleUpdate = async (comment: TaskComment): Promise<void> => {
    setEditError(null);
    const parsed = commentContentSchema.safeParse({ content: editContent });
    if (!parsed.success) {
      setEditError(parsed.error.issues[0]?.message ?? "Comment is invalid.");
      return;
    }

    try {
      await updateComment.mutateAsync({ taskId, commentId: comment.id, data: parsed.data });
      cancelEditing();
      addToast({ title: "Comment updated", description: "Your comment has been saved.", variant: "success" });
    } catch (error) {
      setEditError(getCommentErrorMessage(error));
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (commentToDelete === null) return;

    try {
      await deleteComment.mutateAsync({ taskId, commentId: commentToDelete.id });
      setCommentToDelete(null);
      addToast({ title: "Comment deleted", description: "The comment has been removed.", variant: "success" });
    } catch (error) {
      addToast({ title: "Comment was not deleted", description: getCommentErrorMessage(error), variant: "danger" });
    }
  };

  if (!canRead) {
    return (
      <Card>
        <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">You do not have permission to view comments for this task.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2"><MessageSquare aria-hidden="true" className="h-5 w-5" />Comments</CardTitle>
          <Badge variant="neutral">{visibleCount}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        {canCreate ? (
          <form className="grid gap-3" onSubmit={(event) => void handleCreate(event)}>
            <Textarea aria-label="Add a comment" error={createError ?? undefined} maxLength={5000} placeholder="Share an update or question..." value={content} onChange={(event) => setContent(event.target.value)} />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Plain text only. Line breaks are preserved.</p>
              <Button disabled={createComment.isPending || content.trim().length === 0} isLoading={createComment.isPending} type="submit">Post comment</Button>
            </div>
          </form>
        ) : <p className="text-sm text-muted-foreground">You can view comments, but you do not have permission to add one.</p>}

        {commentsQuery.isLoading ? <div className="grid gap-3" role="status" aria-label="Loading comments"><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : null}
        {commentsQuery.isError ? (
          <div className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger" role="alert">
            <p>{getCommentErrorMessage(commentsQuery.error)}</p>
            <Button className="mt-3" size="sm" type="button" variant="neutral" onClick={() => void commentsQuery.refetch()}>Retry</Button>
          </div>
        ) : null}
        {commentsQuery.isSuccess && comments.length === 0 ? <p className="rounded-xl border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">No comments yet. Start the conversation when there is something to share.</p> : null}
        {comments.length > 0 ? (
          <div className="grid gap-4">
            {comments.map((comment) => {
              const authorName = getAuthorName(comment);
              const permissionsForComment = permissionsByCommentId.get(comment.id) ?? { canEdit: false, canRemove: false };
              const isEditing = editingCommentId === comment.id;
              return (
                <article key={comment.id} className="rounded-2xl border border-border/70 bg-background/45 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={authorName} size="sm" src={comment.author.isDeleted ? undefined : comment.author.avatar ?? undefined} />
                    <div className="grid min-w-0 flex-1 gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{authorName}</p>
                          <p className="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}{comment.edited ? ` · edited ${formatTimestamp(comment.updatedAt)}` : ""}</p>
                        </div>
                        {permissionsForComment.canEdit || permissionsForComment.canRemove ? (
                          <Dropdown align="right" trigger={<Button aria-label="Comment actions" size="icon" type="button" variant="ghost"><MoreHorizontal aria-hidden="true" className="h-4 w-4" /></Button>}>
                            {permissionsForComment.canEdit ? <DropdownButton onClick={() => startEditing(comment)}><Pencil aria-hidden="true" className="h-4 w-4" />Edit</DropdownButton> : null}
                            {permissionsForComment.canRemove ? <DropdownButton className="text-danger" onClick={() => setCommentToDelete(comment)}><Trash2 aria-hidden="true" className="h-4 w-4" />Delete</DropdownButton> : null}
                          </Dropdown>
                        ) : null}
                      </div>
                      {isEditing ? (
                        <div className="grid gap-3">
                          <Textarea autoFocus aria-label="Edit comment" error={editError ?? undefined} maxLength={5000} value={editContent} onChange={(event) => setEditContent(event.target.value)} />
                          <div className="flex justify-end gap-2">
                            <Button disabled={updateComment.isPending} size="sm" type="button" variant="neutral" onClick={cancelEditing}>Cancel</Button>
                            <Button disabled={updateComment.isPending || editContent.trim().length === 0} isLoading={updateComment.isPending} size="sm" type="button" onClick={() => void handleUpdate(comment)}>Save</Button>
                          </div>
                        </div>
                      ) : <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{comment.content}</p>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
        {pagination !== undefined && pagination.totalPages > 1 ? <Pagination className="justify-center" page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} /> : null}
      </CardContent>
      <Modal
        open={commentToDelete !== null}
        onOpenChange={(open) => !deleteComment.isPending && !open && setCommentToDelete(null)}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        footer={
          <>
            <Button disabled={deleteComment.isPending} type="button" variant="neutral" onClick={() => setCommentToDelete(null)}>Cancel</Button>
            <Button isLoading={deleteComment.isPending} type="button" variant="danger" onClick={() => void handleDelete()}>Delete comment</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">The comment will be soft deleted and removed from this task conversation.</p>
      </Modal>
    </Card>
  );
}

