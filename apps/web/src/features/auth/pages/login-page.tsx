import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout, AuthSubmitButton, FormError } from "../components";
import { getAuthErrorMessage, useLogin } from "../hooks";
import { loginFormSchema, type LoginFormValues } from "../schemas";
import { Input } from "@/components/ui";
import { routePaths } from "@/routes";

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const locationState = location.state as LocationState | null;
  const redirectTo = locationState?.from?.pathname ?? routePaths.app;
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur"
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await login.mutateAsync(values);
    navigate(redirectTo, { replace: true });
  });

  return (
    <AuthLayout
      title="Sign in"
      description="Use your BizPilot AI workspace credentials to continue."
      footer={<>New to BizPilot AI? <Link className="font-medium text-primary hover:underline" to={routePaths.register}>Register your organization</Link></>}
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        {login.isError ? <FormError message={getAuthErrorMessage(login.error)} /> : null}
        <Input autoComplete="email" autoFocus error={form.formState.errors.email?.message} label="Email" placeholder="you@company.com" type="email" {...form.register("email")} />
        <div className="grid gap-2">
          <Input autoComplete="current-password" error={form.formState.errors.password?.message} label="Password" type="password" {...form.register("password")} />
          <Link className="justify-self-end text-sm font-medium text-primary hover:underline" to={routePaths.forgotPassword}>Forgot password?</Link>
        </div>
        <AuthSubmitButton isPending={login.isPending || form.formState.isSubmitting}>Sign in</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}

