import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { useUsers } from "@/features/users";
import { useToast } from "@/hooks";
import { createTeamSchema } from "../schemas";
import { getTeamErrorMessage, useCreateTeam } from "../hooks";
import type { CreateTeamInput } from "../types";

export interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createTeamFormSchema = createTeamSchema.pick({
  name: true,
  description: true,
  leadId: true
});

type CreateTeamFormValues = z.input<typeof createTeamFormSchema>;

const defaultValues: CreateTeamFormValues = {
  name: "",
  description: "",
  leadId: ""
};

const toCreateTeamInput = (values: CreateTeamFormValues): CreateTeamInput => {
  const input: CreateTeamInput = {
    name: values.name
  };

  if (values.description !== undefined) {
    input.description = values.description === "" ? null : values.description;
  }

  if (values.leadId !== undefined) {
    input.leadId = values.leadId === "" ? null : values.leadId;
  }

  return input;
};

const getUserDisplayName = (user: { email: string; firstName: string; lastName: string }): string => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name.length > 0 ? name : user.email;
};

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps): ReactElement {
  const createTeam = useCreateTeam();
  const usersQuery = useUsers({ limit: 100 });
  const { addToast } = useToast();
  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamFormSchema),
    defaultValues,
    mode: "onBlur"
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      createTeam.reset();
    }
  }, [createTeam, form, open]);

  const users = usersQuery.data?.users ?? [];
  const leadOptions = [
    { label: "No team lead", value: "" },
    ...users.map((user) => ({ label: `${getUserDisplayName(user)} (${user.email})`, value: user.id }))
  ];

  const onSubmit = form.handleSubmit(async (values) => {
    const team = await createTeam.mutateAsync(toCreateTeamInput(values));
    addToast({
      title: "Team created",
      description: `${team.name} has been added to your workspace.`,
      variant: "success"
    });
    form.reset(defaultValues);
    onOpenChange(false);
  });

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!createTeam.isPending) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Create team"
      description="Create a team to organize collaboration across your workspace."
      footer={
        <>
          <Button disabled={createTeam.isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="create-team-form" isLoading={createTeam.isPending || form.formState.isSubmitting} type="submit">
            Create team
          </Button>
        </>
      }
    >
      <form className="grid gap-5" id="create-team-form" onSubmit={onSubmit} noValidate>
        {createTeam.isError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {getTeamErrorMessage(createTeam.error)}
          </div>
        ) : null}
        <Input
          autoFocus
          error={form.formState.errors.name?.message}
          label="Team Name"
          placeholder="Product Operations"
          {...form.register("name")}
        />
        <Textarea
          error={form.formState.errors.description?.message}
          label="Description"
          maxLength={5000}
          placeholder="What collaboration area does this team own?"
          {...form.register("description")}
        />
        <Select
          disabled={usersQuery.isLoading}
          error={form.formState.errors.leadId?.message}
          hint={usersQuery.isError ? "Team lead options could not be loaded. You can still create the team without a lead." : undefined}
          label="Team Lead"
          options={usersQuery.isLoading ? [{ label: "Loading users...", value: "" }] : leadOptions}
          {...form.register("leadId")}
        />
      </form>
    </Modal>
  );
}
