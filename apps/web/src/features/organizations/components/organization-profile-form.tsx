import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { useToast } from "@/hooks";
import { organizationProfileFormSchema, type OrganizationProfileFormValues } from "../schemas";
import { getOrganizationErrorMessage, useUpdateOrganization, useUpdateOrganizationLogo } from "../hooks";
import type { OrganizationProfile, UpdateOrganizationInput } from "../types";

export interface OrganizationProfileFormProps {
  organization: OrganizationProfile;
  canManage: boolean;
}

const toFormValues = (organization: OrganizationProfile): OrganizationProfileFormValues => ({
  name: organization.name,
  logo: organization.logo ?? "",
  country: organization.country ?? ""
});

const toUpdateInput = (values: OrganizationProfileFormValues, organization: OrganizationProfile): UpdateOrganizationInput => {
  const input: UpdateOrganizationInput = {};
  const logo = values.logo === "" ? null : values.logo;
  const country = values.country === "" ? null : values.country;

  if (values.name !== organization.name) input.name = values.name;
  if (logo !== organization.logo) input.logo = logo;
  if (country !== organization.country) input.country = country;

  return input;
};

export function OrganizationProfileForm({ organization, canManage }: OrganizationProfileFormProps): ReactElement {
  const updateOrganization = useUpdateOrganization();
  const updateLogo = useUpdateOrganizationLogo();
  const { addToast } = useToast();
  const form = useForm<OrganizationProfileFormValues>({
    resolver: zodResolver(organizationProfileFormSchema),
    defaultValues: toFormValues(organization),
    mode: "onBlur"
  });

  useEffect(() => {
    form.reset(toFormValues(organization));
    updateOrganization.reset();
    updateLogo.reset();
  }, [form, organization, updateLogo, updateOrganization]);

  const isPending = updateOrganization.isPending || updateLogo.isPending || form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    const input = toUpdateInput(values, organization);

    if (Object.keys(input).length === 0) {
      addToast({ title: "No changes", description: "Organization profile is already up to date.", variant: "info" });
      return;
    }

    const updated = await updateOrganization.mutateAsync(input);
    addToast({ title: "Organization updated", description: `${updated.name} profile settings have been saved.`, variant: "success" });
  });

  const handleRemoveLogo = async (): Promise<void> => {
    const updated = await updateLogo.mutateAsync(null);
    form.setValue("logo", "", { shouldDirty: false });
    addToast({ title: "Logo removed", description: `${updated.name} no longer has a logo URL configured.`, variant: "success" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Profile</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">Only fields supported by the backend schema are editable here.</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={onSubmit} noValidate>
          {updateOrganization.isError ? <Alert variant="danger" title="Unable to update organization">{getOrganizationErrorMessage(updateOrganization.error)}</Alert> : null}
          {updateLogo.isError ? <Alert variant="danger" title="Unable to update logo">{getOrganizationErrorMessage(updateLogo.error)}</Alert> : null}
          <Input autoFocus disabled={!canManage || isPending} error={form.formState.errors.name?.message} label="Organization Name" {...form.register("name")} />
          <Input disabled={!canManage || isPending} error={form.formState.errors.logo?.message} label="Logo URL" placeholder="https://example.com/logo.png" {...form.register("logo")} />
          <Input disabled={!canManage || isPending} error={form.formState.errors.country?.message} label="Country Code" placeholder="US" maxLength={2} {...form.register("country")} />
          <div className="flex flex-wrap justify-end gap-3">
            {organization.logo ? (
              <Button disabled={!canManage || isPending} type="button" variant="neutral" onClick={() => void handleRemoveLogo()}>
                Remove logo
              </Button>
            ) : null}
            <Button disabled={!canManage} isLoading={isPending} type="submit">
              Save profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
