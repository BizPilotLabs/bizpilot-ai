import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { useToast } from "@/hooks";
import { createProjectSchema } from "../schemas";
import { getProjectErrorMessage, useUpdateProject } from "../hooks";
import type { Project, UpdateProjectInput } from "../types";

export interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const editProjectFormSchema = createProjectSchema.pick({
  name: true,
  description: true,
  status: true
});

type EditProjectFormValues = z.infer<typeof editProjectFormSchema>;

const statusOptions = [
  { label: "Planned", value: "PLANNED" },
  { label: "Active", value: "ACTIVE" },
  { label: "On hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" }
];

const toFormValues = (project: Project | null): EditProjectFormValues => ({
  name: project?.name ?? "",
  description: project?.description ?? "",
  status: project?.status ?? "PLANNED"
});

const toUpdateProjectInput = (values: EditProjectFormValues): UpdateProjectInput => {
  const input: UpdateProjectInput = {
    name: values.name
  };

  if (values.description !== undefined) {
    input.description = values.description;
  }

  if (values.status !== undefined) {
    input.status = values.status;
  }

  return input;
};

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps): ReactElement {
  const updateProject = useUpdateProject();
  const { addToast } = useToast();
  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectFormSchema),
    defaultValues: toFormValues(project),
    mode: "onBlur"
  });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(project));
      updateProject.reset();
    }
  }, [form, open, project, updateProject]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (project === null) {
      return;
    }

    const updatedProject = await updateProject.mutateAsync({
      projectId: project.id,
      data: toUpdateProjectInput(values)
    });

    addToast({
      title: "Project updated",
      description: `${updatedProject.name} has been saved.`,
      variant: "success"
    });
    onOpenChange(false);
  });

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!updateProject.isPending) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit project"
      description="Update this project's core details."
      footer={
        <>
          <Button disabled={updateProject.isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="edit-project-form" isLoading={updateProject.isPending || form.formState.isSubmitting} type="submit">
            Save changes
          </Button>
        </>
      }
    >
      <form className="grid gap-5" id="edit-project-form" onSubmit={onSubmit} noValidate>
        {updateProject.isError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {getProjectErrorMessage(updateProject.error)}
          </div>
        ) : null}
        <Input
          autoFocus
          error={form.formState.errors.name?.message}
          label="Project Name"
          {...form.register("name")}
        />
        <Textarea
          error={form.formState.errors.description?.message}
          label="Description"
          maxLength={5000}
          {...form.register("description")}
        />
        <Select
          error={form.formState.errors.status?.message}
          label="Status"
          options={statusOptions}
          {...form.register("status")}
        />
      </form>
    </Modal>
  );
}

