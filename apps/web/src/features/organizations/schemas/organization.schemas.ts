import { z } from "zod";

const nullableUrlSchema = z
  .union([z.string().trim().url("Logo must be a valid URL.").max(2048, "Logo URL is too long."), z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value));

const countrySchema = z
  .union([z.string().trim().length(2, "Country must be a 2-letter code."), z.literal(""), z.null()])
  .transform((value) => {
    if (value === "" || value === null) {
      return null;
    }

    return value.toUpperCase();
  });

const currencySchema = z.string().trim().length(3, "Currency must be a 3-letter code.").transform((currency) => currency.toUpperCase());

const requireAtLeastOneField = <TShape extends z.ZodRawShape>(schema: z.ZodObject<TShape>) =>
  schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided."
  });

export const organizationProfileFormSchema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters.").max(160, "Organization name is too long."),
  logo: nullableUrlSchema,
  country: countrySchema
});

export const organizationSettingsFormSchema = z.object({
  timezone: z.string().trim().min(1, "Timezone is required.").max(80, "Timezone is too long."),
  currency: currencySchema
});

export const updateOrganizationSchema = requireAtLeastOneField(
  z.object({
    name: z.string().trim().min(2).max(160).optional(),
    logo: nullableUrlSchema.optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
    country: countrySchema.optional(),
    currency: currencySchema.optional()
  })
);

export const updateOrganizationSettingsSchema = requireAtLeastOneField(
  z.object({
    timezone: z.string().trim().min(1).max(80).optional(),
    currency: currencySchema.optional()
  })
);

export type OrganizationProfileFormValues = z.input<typeof organizationProfileFormSchema>;
export type OrganizationSettingsFormValues = z.input<typeof organizationSettingsFormSchema>;
