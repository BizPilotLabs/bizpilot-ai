import { z } from "zod";

const optionalUppercaseCode = (length: number, label: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z.string().trim().length(length, `${label} must be ${length} characters.`).transform((value) => value.toUpperCase()).optional()
  );

export const emailSchema = z.string().trim().email("Enter a valid email address.").max(320, "Email is too long.").transform((email) => email.toLowerCase());

export const passwordSchema = z.string().min(12, "Password must be at least 12 characters.").max(72, "Password cannot exceed 72 characters.");

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(72, "Password cannot exceed 72 characters.")
});

export const registerFormSchema = z
  .object({
    organizationName: z.string().trim().min(2, "Organization name must be at least 2 characters.").max(160, "Organization name is too long."),
    organizationSlug: z
      .string()
      .trim()
      .min(2, "Organization slug must be at least 2 characters.")
      .max(120, "Organization slug is too long.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Use lowercase letters, numbers, and hyphens only."),
    firstName: z.string().trim().min(1, "Enter your first name.").max(100, "First name is too long."),
    lastName: z.string().trim().min(1, "Enter your last name.").max(100, "Last name is too long."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
    timezone: z.preprocess((value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value), z.string().trim().min(1).max(80).optional()),
    country: optionalUppercaseCode(2, "Country code"),
    currency: optionalUppercaseCode(3, "Currency code")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export const forgotPasswordFormSchema = z.object({
  email: emailSchema
});

export const resetPasswordFormSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is required."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

