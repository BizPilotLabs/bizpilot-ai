import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { useUsers } from "@/features/users";
import { useToast } from "@/hooks";
import { createTeamSchema } from "../schemas";
import { getTeamErrorMessage, useUpdateTeam } from "../hooks";
import type { Team, UpdateTeamInput } from "../types";

export interface EditTeamDialogProps {
  task?: never;
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const editTeamFormSchema = createTeamSchema.pick({
  name: true,
  description: true,
  leadId: true
});

type EditTeamFormValues = z.input<typeof editTeamFormSchema>;

const toFormValues = (team: Team | null): EditTeamFormValues => ({
  name: team?.name ?? "",
  description: team?.description ?? "",
  leadId: team?.leadId ?? ""
});

const toUpdateTeamInput = (values: EditTeamFormValues): UpdateTeamInput => {
  const input: UpdateTeamInput = {
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

export function EditTeamDialog({ team, open, onOpenChange }: EditTeamDialogProps): ReactElement {
  const updateTeam = useUpdateTeam();
  const usersQuery = useUsers({ limit: 100 });
  const { addToast } = useToast();
  const form = useForm<EditTeamFormValues>({
    resolver: zodResolver(editTeamFormSchema),
    defaultValues: toFormValues(team),
    mode: "onBlur"
  });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(team));
      updateTeam.reset();
    }
  }, [form, open, team, updateTeam]);

  const users = usersQuery.data?.users ?? [];
  const leadOptions = [
    { label: "No team lead", value: "" },
    ...users.map((user) => ({ label: `${getUserDisplayName(user)} (${user.email})`, value: user.id }))
  ];

  const onSubmit = form.handleSubmit(async (values) => {
    if (team === null) {
      return;
    }

    const updatedTeam = await updateTeam.mutateAsync({
      teamId: team.id,
      data: toUpdateTeamInput(values)
    });

    addToast({
      title: "Team updated",
      description: `${updatedTeam.name} has been saved.`,
      variant: "success"
    });
    onOpenChange(false);
  });

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!updateTeam.isPending) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit team"
      description="Update this team's core details."
      footer={
        <>
          <Button disabled={updateTeam.isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="edit-team-form" isLoading={updateTeam.isPending || form.formState.isSubmitting} type="submit">
            Save changes
          </Button>
        </>
      }
    >
      <form className="grid gap-5" id="edit-team-form" onSubmit={onSubmit} noValidate>
        {updateTeam.isError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {getTeamErrorMessage(updateTeam.error)}
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
          hint={usersQuery.isError ? "Team lead options could not be loaded. You can still save the team without changing the lead." : undefined}
          label="Team Lead"
          options={usersQuery.isLoading ? [{ label: "Loading users...", value: "" }] : leadOptions}
          {...form.register("leadId")}
        />
      </form>
    </Modal>
  );
}

