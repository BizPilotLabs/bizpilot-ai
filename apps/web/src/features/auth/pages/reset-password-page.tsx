import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout, AuthSubmitButton, FormError } from "../components";
import { getAuthErrorMessage, useResetPassword } from "../hooks";
import { resetPasswordFormSchema, type ResetPasswordFormValues } from "../schemas";
import { Input } from "@/components/ui";
import { routePaths } from "@/routes";

export function ResetPasswordPage(): ReactElement {
  const [searchParams] = useSearchParams();
  const resetPassword = useResetPassword();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      token: searchParams.get("token") ?? "",
      password: "",
      confirmPassword: ""
    },
    mode: "onBlur"
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await resetPassword.mutateAsync({ token: values.token, password: values.password });
  });

  return (
    <AuthLayout
      title="Reset password"
      description="Enter your reset token and choose a new password once backend password recovery is enabled."
      footer={<Link className="font-medium text-primary hover:underline" to={routePaths.login}>Back to sign in</Link>}
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        {resetPassword.isError ? <FormError message={getAuthErrorMessage(resetPassword.error)} /> : null}
        <Input autoComplete="one-time-code" autoFocus error={form.formState.errors.token?.message} label="Reset token" {...form.register("token")} />
        <Input autoComplete="new-password" error={form.formState.errors.password?.message} hint="Use at least 12 characters." label="New password" type="password" {...form.register("password")} />
        <Input autoComplete="new-password" error={form.formState.errors.confirmPassword?.message} label="Confirm new password" type="password" {...form.register("confirmPassword")} />
        <AuthSubmitButton isPending={resetPassword.isPending || form.formState.isSubmitting}>Reset password</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}

