import { z } from "zod";

const nullableUrlSchema = z
  .union([z.string().trim().url().max(2048), z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value));

const countrySchema = z
  .union([z.string().trim().length(2), z.literal(""), z.null()])
  .transform((value) => {
    if (value === "" || value === null) {
      return null;
    }

    return value.toUpperCase();
  });

const currencySchema = z.string().trim().length(3).transform((currency) => currency.toUpperCase());

const requireAtLeastOneField = <T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodEffects<z.ZodObject<T>> => {
  return schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided.",
  });
};

export const updateOrganizationSchema = requireAtLeastOneField(
  z.object({
    name: z.string().trim().min(2).max(160).optional(),
    logo: nullableUrlSchema.optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
    country: countrySchema.optional(),
    currency: currencySchema.optional(),
  }),
);

export const updateOrganizationSettingsSchema = requireAtLeastOneField(
  z.object({
    timezone: z.string().trim().min(1).max(80).optional(),
    currency: currencySchema.optional(),
  }),
);

export type UpdateOrganizationSchema = z.infer<typeof updateOrganizationSchema>;
export type UpdateOrganizationSettingsSchema = z.infer<typeof updateOrganizationSettingsSchema>;