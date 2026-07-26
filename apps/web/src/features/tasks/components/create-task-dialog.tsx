import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { useToast } from "@/hooks";
import { getProjectErrorMessage, useProjects } from "@/features/projects";
import { createTaskSchema } from "../schemas";
import { getTaskErrorMessage, useCreateTask } from "../hooks";
import type { CreateTaskInput } from "../types";

export interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createTaskFormSchema = createTaskSchema.pick({
  projectId: true,
  title: true,
  description: true,
  priority: true,
  dueDate: true,
  estimatedHours: true
});

type CreateTaskFormValues = z.infer<typeof createTaskFormSchema>;

const priorityOptions = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" }
];

const defaultValues: CreateTaskFormValues = {
  projectId: "",
  title: "",
  description: "",
  priority: "MEDIUM"
};

const toDateInputValue = (value: Date | string | null | undefined): string | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
};

const toCreateTaskInput = (values: CreateTaskFormValues): CreateTaskInput => {
  const input: CreateTaskInput = {
    projectId: values.projectId,
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

  return input;
};

const toDateValue = (value: unknown): Date | undefined => {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`);
};

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return Number(value);
};

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps): ReactElement {
  const createTask = useCreateTask();
  const projectsQuery = useProjects({ limit: 100, archived: false });
  const { addToast } = useToast();
  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues,
    mode: "onBlur"
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      createTask.reset();
    }
  }, [createTask, form, open]);

  const projects = projectsQuery.data?.projects ?? [];
  const projectOptions = [
    { label: projectsQuery.isLoading ? "Loading projects..." : "Select a project", value: "", disabled: true },
    ...projects.map((project) => ({ label: project.name, value: project.id }))
  ];

  const onSubmit = form.handleSubmit(async (values) => {
    const task = await createTask.mutateAsync(toCreateTaskInput(values));
    addToast({
      title: "Task created",
      description: `${task.title} has been added.`,
      variant: "success"
    });
    form.reset(defaultValues);
    onOpenChange(false);
  });

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!createTask.isPending) {
      onOpenChange(nextOpen);
    }
  };

  const submitDisabled = createTask.isPending || form.formState.isSubmitting || projectsQuery.isLoading || projects.length === 0;

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Create task"
      description="Add a task to an existing project."
      footer={
        <>
          <Button disabled={createTask.isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={submitDisabled} form="create-task-form" isLoading={createTask.isPending || form.formState.isSubmitting} type="submit">
            Create task
          </Button>
        </>
      }
    >
      <form className="grid gap-5" id="create-task-form" onSubmit={onSubmit} noValidate>
        {createTask.isError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {getTaskErrorMessage(createTask.error)}
          </div>
        ) : null}
        {projectsQuery.isError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {getProjectErrorMessage(projectsQuery.error)}
          </div>
        ) : null}
        <Select
          autoFocus
          disabled={projectsQuery.isLoading || projects.length === 0}
          error={form.formState.errors.projectId?.message}
          hint={projects.length === 0 && !projectsQuery.isLoading ? "Create a project before adding tasks." : undefined}
          label="Project"
          options={projectOptions}
          {...form.register("projectId")}
        />
        <Input
          error={form.formState.errors.title?.message}
          label="Title"
          placeholder="Prepare onboarding checklist"
          {...form.register("title")}
        />
        <Textarea
          error={form.formState.errors.description?.message}
          label="Description"
          maxLength={5000}
          placeholder="What needs to be done?"
          {...form.register("description")}
        />
        <Select
          error={form.formState.errors.priority?.message}
          label="Priority"
          options={priorityOptions}
          {...form.register("priority")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            error={form.formState.errors.dueDate?.message}
            label="Due Date"
            type="date"
            {...form.register("dueDate", { setValueAs: toDateValue })}
          />
          <Input
            error={form.formState.errors.estimatedHours?.message}
            label="Estimated Hours"
            min={0}
            step="0.25"
            type="number"
            {...form.register("estimatedHours", { setValueAs: toNumberValue })}
          />
        </div>
      </form>
    </Modal>
  );
}

