import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { getProjectErrorMessage, useProjects } from "@/features/projects";
import { useToast } from "@/hooks";
import { createTaskSchema } from "../schemas";
import { getTaskErrorMessage, useUpdateTask } from "../hooks";
import type { Task, UpdateTaskInput } from "../types";

export interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const editTaskFormSchema = createTaskSchema.pick({
  title: true,
  description: true,
  priority: true,
  dueDate: true,
  estimatedHours: true,
  actualHours: true
});

type EditTaskFormValues = z.infer<typeof editTaskFormSchema>;

const priorityOptions = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" }
];

const toDateTimeLocalValue = (value: string | null): string | undefined => {
  if (value === null) {
    return undefined;
  }

  return value.slice(0, 16);
};

const toFormValues = (task: Task | null): EditTaskFormValues => ({
  title: task?.title ?? "",
  description: task?.description ?? "",
  priority: task?.priority ?? "MEDIUM",
  dueDate: task?.dueDate === undefined ? undefined : toDateTimeLocalValue(task.dueDate),
  estimatedHours: task?.estimatedHours ?? undefined,
  actualHours: task?.actualHours ?? undefined
});

const toDateInputValue = (value: Date | string | null | undefined): string | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
};

const toUpdateTaskInput = (values: EditTaskFormValues): UpdateTaskInput => {
  const input: UpdateTaskInput = {
    title: values.title
  };

  if (values.description !== undefined) {
    input.description = values.description;
  }

  if (values.priority !== undefined) {
    input.priority = values.priority;
  }

  const dueDate = toDateInputValue(values.dueDate);
  if (dueDate !== undefined) {
    input.dueDate = dueDate;
  }

  if (values.estimatedHours !== undefined) {
    input.estimatedHours = values.estimatedHours;
  }

  if (values.actualHours !== undefined) {
    input.actualHours = values.actualHours;
  }

  return input;
};

const toDateValue = (value: unknown): Date | undefined => {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return new Date(value);
};

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return Number(value);
};

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps): ReactElement {
  const updateTask = useUpdateTask();
  const projectsQuery = useProjects({ limit: 100, archived: false });
  const { addToast } = useToast();
  const form = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskFormSchema),
    defaultValues: toFormValues(task),
    mode: "onBlur"
  });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(task));
      updateTask.reset();
    }
  }, [form, open, task, updateTask]);

  const projects = projectsQuery.data?.projects ?? [];
  const projectOptions = [
    { label: projectsQuery.isLoading ? "Loading projects..." : "Project unavailable", value: "", disabled: true },
    ...projects.map((project) => ({ label: project.name, value: project.id }))
  ];

  const onSubmit = form.handleSubmit(async (values) => {
    if (task === null) {
      return;
    }

    const updatedTask = await updateTask.mutateAsync({
      taskId: task.id,
      data: toUpdateTaskInput(values)
    });

    addToast({
      title: "Task updated",
      description: `${updatedTask.title} has been saved.`,
      variant: "success"
    });
    onOpenChange(false);
  });

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!updateTask.isPending) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit task"
      description="Update this task's core details."
      footer={
        <>
          <Button disabled={updateTask.isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="edit-task-form" isLoading={updateTask.isPending || form.formState.isSubmitting} type="submit">
            Save changes
          </Button>
        </>
      }
    >
      <form className="grid gap-5" id="edit-task-form" onSubmit={onSubmit} noValidate>
        {updateTask.isError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {getTaskErrorMessage(updateTask.error)}
          </div>
        ) : null}
        {projectsQuery.isError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {getProjectErrorMessage(projectsQuery.error)}
          </div>
        ) : null}
        <Select
          disabled
          label="Project"
          options={projectOptions}
          value={task?.projectId ?? ""}
        />
        <Input autoFocus error={form.formState.errors.title?.message} label="Title" {...form.register("title")} />
        <Textarea error={form.formState.errors.description?.message} label="Description" maxLength={5000} {...form.register("description")} />
        <Select error={form.formState.errors.priority?.message} label="Priority" options={priorityOptions} {...form.register("priority")} />
        <div className="grid gap-5 sm:grid-cols-3">
          <Input error={form.formState.errors.dueDate?.message} label="Due Date" type="datetime-local" {...form.register("dueDate", { setValueAs: toDateValue })} />
          <Input error={form.formState.errors.estimatedHours?.message} label="Estimated Hours" min={0} step="0.25" type="number" {...form.register("estimatedHours", { setValueAs: toNumberValue })} />
          <Input error={form.formState.errors.actualHours?.message} label="Actual Hours" min={0} step="0.25" type="number" {...form.register("actualHours", { setValueAs: toNumberValue })} />
        </div>
      </form>
    </Modal>
  );
}

