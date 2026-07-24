import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, AuthSubmitButton, FormError } from "../components";
import { getAuthErrorMessage, useRegister } from "../hooks";
import { registerFormSchema, type RegisterFormValues } from "../schemas";
import type { RegisterOrganizationInput } from "../types";
import { Input } from "@/components/ui";
import { routePaths } from "@/routes";

const setOptionalField = <TKey extends keyof RegisterOrganizationInput>(
  input: RegisterOrganizationInput,
  key: TKey,
  value: RegisterOrganizationInput[TKey] | undefined
): void => {
  if (value !== undefined) {
    input[key] = value;
  }
};

const toRegisterInput = (values: RegisterFormValues): RegisterOrganizationInput => {
  const input: RegisterOrganizationInput = {
    organizationName: values.organizationName,
    organizationSlug: values.organizationSlug,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    password: values.password
  };

  setOptionalField(input, "timezone", values.timezone);
  setOptionalField(input, "country", values.country);
  setOptionalField(input, "currency", values.currency);

  return input;
};

export function RegisterOrganizationPage(): ReactElement {
  const navigate = useNavigate();
  const registerOrganization = useRegister();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      organizationName: "",
      organizationSlug: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: "",
      currency: "USD"
    },
    mode: "onBlur"
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await registerOrganization.mutateAsync(toRegisterInput(values));
    navigate(routePaths.app, { replace: true });
  });

  return (
    <AuthLayout
      title="Register organization"
      description="Create the first owner account for your BizPilot AI workspace."
      footer={<>Already have an account? <Link className="font-medium text-primary hover:underline" to={routePaths.login}>Sign in</Link></>}
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        {registerOrganization.isError ? <FormError message={getAuthErrorMessage(registerOrganization.error)} /> : null}
        <Input autoFocus error={form.formState.errors.organizationName?.message} label="Organization name" {...form.register("organizationName")} />
        <Input autoCapitalize="none" autoCorrect="off" error={form.formState.errors.organizationSlug?.message} hint="Use lowercase letters, numbers, and hyphens." label="Organization slug" {...form.register("organizationSlug")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input autoComplete="given-name" error={form.formState.errors.firstName?.message} label="First name" {...form.register("firstName")} />
          <Input autoComplete="family-name" error={form.formState.errors.lastName?.message} label="Last name" {...form.register("lastName")} />
        </div>
        <Input autoComplete="email" error={form.formState.errors.email?.message} label="Email" type="email" {...form.register("email")} />
        <Input autoComplete="new-password" error={form.formState.errors.password?.message} hint="Use at least 12 characters." label="Password" type="password" {...form.register("password")} />
        <Input autoComplete="new-password" error={form.formState.errors.confirmPassword?.message} label="Confirm password" type="password" {...form.register("confirmPassword")} />
        <div className="grid gap-5 sm:grid-cols-3">
          <Input error={form.formState.errors.timezone?.message} label="Timezone" {...form.register("timezone")} />
          <Input autoCapitalize="characters" error={form.formState.errors.country?.message} label="Country" maxLength={2} {...form.register("country")} />
          <Input autoCapitalize="characters" error={form.formState.errors.currency?.message} label="Currency" maxLength={3} {...form.register("currency")} />
        </div>
        <AuthSubmitButton isPending={registerOrganization.isPending || form.formState.isSubmitting}>Create workspace</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}

