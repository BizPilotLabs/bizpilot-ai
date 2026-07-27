import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, type ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Modal, Spinner } from "@/components/ui";
import { useToast } from "@/hooks";
import { updateUserRolesSchema } from "../schemas";
import { getUserErrorMessage, useRoles, useUpdateUser, useUpdateUserRoles } from "../hooks";
import type { UpdateUserInput, UserProfile } from "../types";
import { RoleCheckboxGroup } from "./role-checkbox-group";

export interface EditUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  canManageRoles: boolean;
  onOpenChange: (open: boolean) => void;
}

const editUserFormSchema = updateUserRolesSchema.and(
  z.object({
    firstName: z.string().trim().min(1, "Enter a first name.").max(100, "First name is too long."),
    lastName: z.string().trim().min(1, "Enter a last name.").max(100, "Last name is too long."),
    avatar: z.union([z.string().trim().url("Avatar must be a valid URL.").max(2048, "Avatar URL is too long."), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value))
  })
);

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

const toDefaultValues = (user: UserProfile | null): EditUserFormValues => ({
  firstName: user?.firstName ?? "",
  lastName: user?.lastName ?? "",
  avatar: user?.avatar ?? "",
  roleIds: user?.roles.map((role) => role.id) ?? []
});

const toUpdateInput = (values: EditUserFormValues, user: UserProfile): UpdateUserInput => {
  const input: UpdateUserInput = {};

  if (values.firstName !== user.firstName) input.firstName = values.firstName;
  if (values.lastName !== user.lastName) input.lastName = values.lastName;
  if ((values.avatar ?? null) !== user.avatar) input.avatar = values.avatar ?? null;

  return input;
};

const sameRoleSet = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((roleId) => rightSet.has(roleId));
};

export function EditUserDialog({ user, open, canManageRoles, onOpenChange }: EditUserDialogProps): ReactElement {
  const updateUser = useUpdateUser();
  const updateRoles = useUpdateUserRoles();
  const rolesQuery = useRoles();
  const { addToast } = useToast();
  const defaultValues = useMemo(() => toDefaultValues(user), [user]);
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues,
    mode: "onBlur"
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      updateUser.reset();
      updateRoles.reset();
    }
  }, [defaultValues, form, open, updateRoles, updateUser]);

  const isPending = updateUser.isPending || updateRoles.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    if (user === null) {
      return;
    }

    const profileInput = toUpdateInput(values, user);
    const profileChanged = Object.keys(profileInput).length > 0;
    const rolesChanged = canManageRoles && !sameRoleSet(values.roleIds, user.roles.map((role) => role.id));

    if (!profileChanged && !rolesChanged) {
      onOpenChange(false);
      return;
    }

    if (profileChanged) {
      await updateUser.mutateAsync({ userId: user.id, data: profileInput });
    }

    if (rolesChanged) {
      await updateRoles.mutateAsync({ userId: user.id, roleIds: values.roleIds });
    }

    addToast({
      title: "User updated",
      description: `${values.firstName} ${values.lastName} has been updated.`,
      variant: "success"
    });
    onOpenChange(false);
  });

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!isPending) {
      onOpenChange(nextOpen);
    }
  };

  const roles = rolesQuery.data?.roles ?? [];

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit User"
      description="Update profile details and role assignments supported by the backend."
      footer={
        <>
          <Button disabled={isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="edit-user-form" isLoading={isPending || form.formState.isSubmitting} type="submit" disabled={canManageRoles && rolesQuery.isLoading}>
            Save changes
          </Button>
        </>
      }
    >
      <form className="grid gap-5" id="edit-user-form" onSubmit={onSubmit} noValidate>
        {updateUser.isError ? (
          <Alert variant="danger" title="Unable to update profile">
            {getUserErrorMessage(updateUser.error)}
          </Alert>
        ) : null}
        {updateRoles.isError ? (
          <Alert variant="danger" title="Unable to update roles">
            {getUserErrorMessage(updateRoles.error)}
          </Alert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input autoFocus error={form.formState.errors.firstName?.message} label="First Name" {...form.register("firstName")} />
          <Input error={form.formState.errors.lastName?.message} label="Last Name" {...form.register("lastName")} />
        </div>
        <Input error={form.formState.errors.avatar?.message} label="Avatar URL" placeholder="https://example.com/avatar.png" {...form.register("avatar")} />
        {canManageRoles ? (
          <>
            {rolesQuery.isLoading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/45 p-4 text-sm text-muted-foreground">
                <Spinner size="sm" />
                Loading roles
              </div>
            ) : null}
            {rolesQuery.isError ? (
              <Alert variant="danger" title="Unable to load roles">
                {getUserErrorMessage(rolesQuery.error)}
              </Alert>
            ) : null}
            {roles.length > 0 ? (
              <Controller
                control={form.control}
                name="roleIds"
                render={({ field, fieldState }) => (
                  <RoleCheckboxGroup
                    roles={roles}
                    selectedRoleIds={field.value}
                    disabled={isPending}
                    error={fieldState.error?.message}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : null}
          </>
        ) : null}
      </form>
    </Modal>
  );
}


