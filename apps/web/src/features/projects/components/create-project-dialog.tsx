import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { useToast } from "@/hooks";
import { createProjectSchema } from "../schemas";
import { getProjectErrorMessage, useCreateProject } from "../hooks";
import type { CreateProjectInput } from "../types";

export interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createProjectFormSchema = createProjectSchema.pick({
  name: true,
  description: true,
  status: true
});

type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;

const statusOptions = [
  { label: "Planned", value: "PLANNED" },
  { label: "Active", value: "ACTIVE" },
  { label: "On hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" }
];

const defaultValues: CreateProjectFormValues = {
  name: "",
  description: "",
  status: "PLANNED"
};

const toCreateProjectInput = (values: CreateProjectFormValues): CreateProjectInput => {
  const input: CreateProjectInput = {
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

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps): ReactElement {
  const createProject = useCreateProject();
  const { addToast } = useToast();
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues,
    mode: "onBlur"
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      createProject.reset();
    }
  }, [createProject, form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    const project = await createProject.mutateAsync(toCreateProjectInput(values));
    addToast({
      title: "Project created",
      description: `${project.name} has been added to your workspace.`,
      variant: "success"
    });
    form.reset(defaultValues);
    onOpenChange(false);
  });

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!createProject.isPending) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Create project"
      description="Add a project so your team can start organizing work."
      footer={
        <>
          <Button disabled={createProject.isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="create-project-form" isLoading={createProject.isPending || form.formState.isSubmitting} type="submit">
            Create project
          </Button>
        </>
      }
    >
      <form className="grid gap-5" id="create-project-form" onSubmit={onSubmit} noValidate>
        {createProject.isError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {getProjectErrorMessage(createProject.error)}
          </div>
        ) : null}
        <Input
          autoFocus
          error={form.formState.errors.name?.message}
          label="Project Name"
          placeholder="Customer onboarding"
          {...form.register("name")}
        />
        <Textarea
          error={form.formState.errors.description?.message}
          label="Description"
          maxLength={5000}
          placeholder="What should this project help the team accomplish?"
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

