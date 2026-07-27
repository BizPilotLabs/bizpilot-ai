import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { Alert, Button, Input, Modal, Spinner } from "@/components/ui";
import { useToast } from "@/hooks";
import { createUserSchema } from "../schemas";
import { getUserErrorCode, getUserErrorMessage, useCreateUser, useRoles } from "../hooks";
import type { CreateUserInput } from "../types";
import { RoleCheckboxGroup } from "./role-checkbox-group";

export interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CreateUserFormValues = z.infer<typeof createUserSchema>;

const defaultValues: CreateUserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  roleIds: []
};

const toCreateUserInput = (values: CreateUserFormValues): CreateUserInput => ({
  firstName: values.firstName,
  lastName: values.lastName,
  email: values.email,
  password: values.password,
  roleIds: values.roleIds
});

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps): ReactElement {
  const createUser = useCreateUser();
  const rolesQuery = useRoles();
  const { addToast } = useToast();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues,
    mode: "onBlur"
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      createUser.reset();
      setPasswordVisible(false);
    }
  }, [createUser, form, open]);

  useEffect(() => {
    if (createUser.isError && getUserErrorCode(createUser.error) === "USER_EMAIL_CONFLICT") {
      form.setError("email", { message: "A user with this email already exists." });
    }
  }, [createUser.error, createUser.isError, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const user = await createUser.mutateAsync(toCreateUserInput(values));
    addToast({
      title: "User created",
      description: `${user.firstName} ${user.lastName} has been added to your organization.`,
      variant: "success"
    });
    form.reset(defaultValues);
    onOpenChange(false);
  });

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!createUser.isPending) {
      onOpenChange(nextOpen);
    }
  };

  const roles = rolesQuery.data?.roles ?? [];

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Invite User"
      description="Create an organization user with an initial password and assigned role."
      footer={
        <>
          <Button disabled={createUser.isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="create-user-form" isLoading={createUser.isPending || form.formState.isSubmitting} type="submit" disabled={rolesQuery.isLoading || roles.length === 0}>
            Create user
          </Button>
        </>
      }
    >
      <form className="grid gap-5" id="create-user-form" onSubmit={onSubmit} noValidate>
        {createUser.isError ? (
          <Alert variant="danger" title="Unable to create user">
            {getUserErrorMessage(createUser.error)}
          </Alert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input autoFocus error={form.formState.errors.firstName?.message} label="First Name" placeholder="Jane" {...form.register("firstName")} />
          <Input error={form.formState.errors.lastName?.message} label="Last Name" placeholder="Doe" {...form.register("lastName")} />
        </div>
        <Input error={form.formState.errors.email?.message} label="Email" placeholder="jane@example.com" type="email" {...form.register("email")} />
        <div className="relative">
          <Input
            error={form.formState.errors.password?.message}
            label="Initial Password"
            placeholder="Minimum 12 characters"
            type={passwordVisible ? "text" : "password"}
            {...form.register("password")}
          />
          <Button
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            className="absolute right-2 top-8"
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => setPasswordVisible((current) => !current)}
          >
            {passwordVisible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
          </Button>
        </div>
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
                disabled={createUser.isPending}
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
