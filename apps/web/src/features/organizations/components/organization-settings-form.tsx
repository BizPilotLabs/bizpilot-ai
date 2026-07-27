import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { useToast } from "@/hooks";
import { organizationSettingsFormSchema, type OrganizationSettingsFormValues } from "../schemas";
import { getOrganizationErrorMessage, useUpdateOrganizationSettings } from "../hooks";
import type { OrganizationProfile, UpdateOrganizationSettingsInput } from "../types";

export interface OrganizationSettingsFormProps {
  organization: OrganizationProfile;
  canManage: boolean;
}

const toFormValues = (organization: OrganizationProfile): OrganizationSettingsFormValues => ({
  timezone: organization.timezone,
  currency: organization.currency
});

const toSettingsInput = (values: OrganizationSettingsFormValues, organization: OrganizationProfile): UpdateOrganizationSettingsInput => {
  const input: UpdateOrganizationSettingsInput = {};

  if (values.timezone !== organization.timezone) input.timezone = values.timezone;
  if (values.currency !== organization.currency) input.currency = values.currency;

  return input;
};

export function OrganizationSettingsForm({ organization, canManage }: OrganizationSettingsFormProps): ReactElement {
  const updateSettings = useUpdateOrganizationSettings();
  const { addToast } = useToast();
  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsFormSchema),
    defaultValues: toFormValues(organization),
    mode: "onBlur"
  });

  useEffect(() => {
    form.reset(toFormValues(organization));
    updateSettings.reset();
  }, [form, organization, updateSettings]);

  const onSubmit = form.handleSubmit(async (values) => {
    const input = toSettingsInput(values, organization);

    if (Object.keys(input).length === 0) {
      addToast({ title: "No changes", description: "Localization settings are already up to date.", variant: "info" });
      return;
    }

    const updated = await updateSettings.mutateAsync(input);
    addToast({ title: "Settings updated", description: `${updated.name} localization settings have been saved.`, variant: "success" });
  });

  const isPending = updateSettings.isPending || form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Localization</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">Timezone and currency are the currently supported organization settings.</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={onSubmit} noValidate>
          {updateSettings.isError ? <Alert variant="danger" title="Unable to update settings">{getOrganizationErrorMessage(updateSettings.error)}</Alert> : null}
          <Input disabled={!canManage || isPending} error={form.formState.errors.timezone?.message} label="Timezone" placeholder="UTC" {...form.register("timezone")} />
          <Input disabled={!canManage || isPending} error={form.formState.errors.currency?.message} label="Currency" placeholder="USD" maxLength={3} {...form.register("currency")} />
          <div className="flex justify-end">
            <Button disabled={!canManage} isLoading={isPending} type="submit">
              Save settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
