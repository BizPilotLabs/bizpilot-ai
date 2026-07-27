import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { Alert, Button, Input, Modal, Spinner, Textarea } from "@/components/ui";
import { useToast } from "@/hooks";
import { createRoleSchema } from "../schemas";
import { getRbacErrorCode, getRbacErrorMessage, useCreateRole, usePermissions, useUpdateRole, useUpdateRolePermissions } from "../hooks";
import type { CreateRoleInput, Role, UpdateRoleInput } from "../types";
import { PermissionSelector } from "./permission-selector";

export interface RoleFormDialogProps {
  mode: "create" | "edit";
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RoleFormValues = z.infer<typeof createRoleSchema>;

const defaultValues: RoleFormValues = {
  name: "",
  description: "",
  permissionIds: []
};

const toFormValues = (role: Role | null): RoleFormValues => ({
  name: role?.name ?? "",
  description: role?.description ?? "",
  permissionIds: role?.permissions.map((permission) => permission.id) ?? []
});

const toCreateInput = (values: RoleFormValues): CreateRoleInput => ({
  name: values.name,
  description: values.description ?? null,
  permissionIds: values.permissionIds
});

const toUpdateInput = (values: RoleFormValues, role: Role): UpdateRoleInput => {
  const input: UpdateRoleInput = {};
  const description = values.description ?? null;

  if (values.name !== role.name) input.name = values.name;
  if (description !== role.description) input.description = description;

  return input;
};

const sameSet = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
};

export function RoleFormDialog({ mode, role, open, onOpenChange }: RoleFormDialogProps): ReactElement {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const updatePermissions = useUpdateRolePermissions();
  const permissionsQuery = usePermissions();
  const { addToast } = useToast();
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues,
    mode: "onBlur"
  });

  useEffect(() => {
    if (open) {
      form.reset(mode === "edit" ? toFormValues(role) : defaultValues);
      createRole.reset();
      updateRole.reset();
      updatePermissions.reset();
    }
  }, [createRole, form, mode, open, role, updatePermissions, updateRole]);

  useEffect(() => {
    const error = createRole.error ?? updateRole.error;
    const isError = createRole.isError || updateRole.isError;

    if (isError && getRbacErrorCode(error) === "ROLE_NAME_CONFLICT") {
      form.setError("name", { message: "A role with this name already exists." });
    }
  }, [createRole.error, createRole.isError, form, updateRole.error, updateRole.isError]);

  const isPending = createRole.isPending || updateRole.isPending || updatePermissions.isPending || form.formState.isSubmitting;
  const permissions = permissionsQuery.data?.permissions ?? [];

  const onSubmit = form.handleSubmit(async (values) => {
    if (mode === "create") {
      const createdRole = await createRole.mutateAsync(toCreateInput(values));
      addToast({ title: "Role created", description: `${createdRole.name} has been added.`, variant: "success" });
      onOpenChange(false);
      return;
    }

    if (role === null) return;

    const profileInput = toUpdateInput(values, role);
    const nextPermissionIds = values.permissionIds;
    const currentPermissionIds = role.permissions.map((permission) => permission.id);
    const permissionsChanged = !sameSet(nextPermissionIds, currentPermissionIds);

    if (Object.keys(profileInput).length > 0) {
      await updateRole.mutateAsync({ roleId: role.id, data: profileInput });
    }

    if (permissionsChanged) {
      await updatePermissions.mutateAsync({ roleId: role.id, permissionIds: nextPermissionIds });
    }

    addToast({ title: "Role updated", description: `${values.name} has been saved.`, variant: "success" });
    onOpenChange(false);
  });

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}
      title={mode === "create" ? "Create Role" : "Edit Role"}
      description={mode === "create" ? "Create a custom organization role." : "Update custom role details. System roles are read-only."}
      className="w-[min(94vw,48rem)]"
      footer={
        <>
          <Button disabled={isPending} type="button" variant="neutral" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button form="role-form" isLoading={isPending} type="submit" disabled={permissionsQuery.isLoading || (mode === "edit" && role?.isSystem === true)}>
            {mode === "create" ? "Create role" : "Save role"}
          </Button>
        </>
      }
    >
      <form className="grid gap-5" id="role-form" onSubmit={onSubmit} noValidate>
        {createRole.isError ? <Alert variant="danger" title="Unable to create role">{getRbacErrorMessage(createRole.error)}</Alert> : null}
        {updateRole.isError ? <Alert variant="danger" title="Unable to update role">{getRbacErrorMessage(updateRole.error)}</Alert> : null}
        {updatePermissions.isError ? <Alert variant="danger" title="Unable to update permissions">{getRbacErrorMessage(updatePermissions.error)}</Alert> : null}
        {mode === "edit" && role?.isSystem === true ? <Alert variant="warning" title="System role">System roles cannot be edited by this interface or backend.</Alert> : null}
        <Input autoFocus disabled={isPending || (mode === "edit" && role?.isSystem === true)} error={form.formState.errors.name?.message} label="Role Name" {...form.register("name")} />
        <Textarea disabled={isPending || (mode === "edit" && role?.isSystem === true)} error={form.formState.errors.description?.message} label="Description" maxLength={500} {...form.register("description")} />
        {permissionsQuery.isLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner size="sm" />Loading permissions</div> : null}
        {permissionsQuery.isError ? <Alert variant="danger" title="Unable to load permissions">{getRbacErrorMessage(permissionsQuery.error)}</Alert> : null}
        {permissions.length > 0 ? (
          <Controller
            control={form.control}
            name="permissionIds"
            render={({ field, fieldState }) => (
              <PermissionSelector
                permissions={permissions}
                selectedPermissionIds={field.value}
                disabled={isPending || (mode === "edit" && role?.isSystem === true)}
                error={fieldState.error?.message}
                onChange={field.onChange}
              />
            )}
          />
        ) : null}
      </form>
    </Modal>
  );
}

