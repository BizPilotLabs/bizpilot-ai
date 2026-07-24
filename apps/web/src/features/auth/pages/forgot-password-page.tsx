import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { AuthLayout, AuthSubmitButton, FormError } from "../components";
import { getAuthErrorMessage, useForgotPassword } from "../hooks";
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from "../schemas";
import { Input } from "@/components/ui";
import { routePaths } from "@/routes";

export function ForgotPasswordPage(): ReactElement {
  const forgotPassword = useForgotPassword();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: "" },
    mode: "onBlur"
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await forgotPassword.mutateAsync(values);
  });

  return (
    <AuthLayout
      title="Forgot password"
      description="Password recovery is ready in the interface and will activate when the backend endpoint is available."
      footer={<Link className="font-medium text-primary hover:underline" to={routePaths.login}>Back to sign in</Link>}
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        {forgotPassword.isError ? <FormError message={getAuthErrorMessage(forgotPassword.error)} /> : null}
        <Input autoComplete="email" autoFocus error={form.formState.errors.email?.message} label="Email" placeholder="you@company.com" type="email" {...form.register("email")} />
        <AuthSubmitButton isPending={forgotPassword.isPending || form.formState.isSubmitting}>Continue</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}

