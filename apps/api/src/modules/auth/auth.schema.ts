import { z } from "zod";

const emailSchema = z.string().trim().email().max(320).transform((email) => email.toLowerCase());

export const registerSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  organizationSlug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Organization slug must be lowercase, URL-safe, and hyphen separated."),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: z.string().min(12).max(72),
  timezone: z.string().trim().min(1).max(80).optional(),
  country: z.string().trim().length(2).transform((country) => country.toUpperCase()).optional(),
  currency: z.string().trim().length(3).transform((currency) => currency.toUpperCase()).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;