import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, RotateCcw, Send, ShieldAlert } from "lucide-react";
import { type ReactElement, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { useAuthStore } from "@/store";
import { aiQuestionSchema, type AiQuestionFormValues } from "../schemas";
import { getAiErrorCode, getAiErrorMessage, getAiRetryAfterSeconds, isAiRetryableError, useAiHealth, useAskCopilot } from "../hooks";
import { AiStatusIndicator, CopilotAnswer } from "../components";
import type { AiCopilotResponse, AiScopeType } from "../types";

const suggestedQuestions = [
  "Which tasks look overdue or urgent?",
  "Summarize current project progress.",
  "What changed recently in this workspace?",
  "Which high-priority tasks need attention?",
  "Summarize recent task comments."
] as const;

const hasElevatedRole = (roleNames: string[]): boolean => roleNames.includes("Owner") || roleNames.includes("Admin");
const hasPermission = (permissionKeys: string[], permissionKey: string): boolean => permissionKeys.includes(permissionKey);

const buildScope = (type: AiScopeType, entityId: string): AiQuestionFormValues["scope"] => {
  if (type === "organization") return { type: "organization" };
  return { type, entityId };
};

export function AiCopilotPage(): ReactElement {
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const roleNames = useMemo(() => roles.map((role) => role.name), [roles]);
  const permissionKeys = useMemo(() => permissions.map((permission) => permission.key), [permissions]);
  const canUseAi = hasElevatedRole(roleNames) || hasPermission(permissionKeys, "ai.use");
  const healthQuery = useAiHealth();
  const askCopilot = useAskCopilot();
  const [response, setResponse] = useState<AiCopilotResponse | null>(null);
  const [scopeType, setScopeType] = useState<AiScopeType>("organization");
  const form = useForm<AiQuestionFormValues>({
    resolver: zodResolver(aiQuestionSchema),
    defaultValues: { question: "", scope: { type: "organization" } }
  });

  const submitQuestion = async (values: AiQuestionFormValues): Promise<void> => {
    try {
      const result = await askCopilot.mutateAsync(values);
      setResponse(result);
    } catch {
      return;
    }
  };

  const applySuggestion = (question: string): void => {
    form.setValue("question", question, { shouldValidate: true, shouldDirty: true });
  };

  const clearConversation = (): void => {
    setResponse(null);
    askCopilot.reset();
    form.reset({ question: "", scope: { type: "organization" } });
    setScopeType("organization");
  };

  if (!canUseAi) {
    return <Alert variant="danger" title="AI access unavailable">You do not have permission to use BizPilot AI Copilot.</Alert>;
  }

  const healthUnavailable = healthQuery.data?.available === false;
  const rateLimitedForSeconds = askCopilot.isError ? getAiRetryAfterSeconds(askCopilot.error) : undefined;
  const retryable = askCopilot.isError && isAiRetryableError(askCopilot.error);
  const errorCode = askCopilot.isError ? getAiErrorCode(askCopilot.error) : undefined;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-primary"><Bot aria-hidden="true" className="h-4 w-4" /> Business Copilot</div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">Ask read-only questions about your workspace</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Copilot uses authorized BizPilot records only. It cannot create, update, delete, assign, upload, or change anything.</p>
        </div>
        <Button type="button" variant="neutral" onClick={clearConversation} leftIcon={<RotateCcw aria-hidden="true" className="h-4 w-4" />}>Clear</Button>
      </div>

      {healthQuery.isLoading ? <Skeleton className="h-16 rounded-2xl" /> : null}
      {healthQuery.isSuccess ? <AiStatusIndicator health={healthQuery.data} /> : null}
      {healthQuery.isSuccess && healthUnavailable ? <Alert variant="warning" title="Copilot is not ready">{healthQuery.data.reason ?? "AI is unavailable right now. The rest of BizPilot remains available."}</Alert> : null}
      {healthQuery.isError ? <Alert variant="warning" title="AI health unavailable">{getAiErrorMessage(healthQuery.error)}</Alert> : null}

      <Card className="border-primary/15 bg-surface/85 shadow-[0_18px_70px_hsl(var(--shadow-color)/0.12)]">
        <CardHeader>
          <CardTitle>Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={(event) => void form.handleSubmit(submitQuestion)(event)}>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <Select
                label="Scope"
                value={scopeType}
                options={[{ label: "Organization", value: "organization" }, { label: "Project", value: "project" }, { label: "Task", value: "task" }]}
                onChange={(event) => {
                  const nextType = event.target.value as AiScopeType;
                  setScopeType(nextType);
                  form.setValue("scope", buildScope(nextType, ""), { shouldValidate: false });
                }}
              />
              {scopeType !== "organization" ? (
                <Input
                  label={scopeType === "project" ? "Project ID" : "Task ID"}
                  placeholder="Paste an authorized UUID"
                  error={form.formState.errors.scope && "entityId" in form.formState.errors.scope ? form.formState.errors.scope.entityId?.message : undefined}
                  onChange={(event) => form.setValue("scope", buildScope(scopeType, event.target.value), { shouldValidate: true, shouldDirty: true })}
                />
              ) : null}
            </div>
            <Textarea autoFocus label="Ask Copilot" placeholder="Which tasks are overdue?" error={form.formState.errors.question?.message} rows={5} {...form.register("question")} />
            <div className="flex flex-wrap gap-2" aria-label="Suggested read-only questions">
              {suggestedQuestions.map((question) => <Button key={question} type="button" size="sm" variant="subtle" onClick={() => applySuggestion(question)}>{question}</Button>)}
            </div>
            {askCopilot.isError ? (
              <Alert variant={errorCode === "AI_RATE_LIMIT_EXCEEDED" ? "warning" : "danger"} title="Copilot could not answer" role="alert">
                <div className="grid gap-3">
                  <p>{getAiErrorMessage(askCopilot.error)}</p>
                  {retryable && rateLimitedForSeconds === undefined ? <Button type="button" size="sm" variant="neutral" className="w-fit" onClick={() => askCopilot.reset()}>Dismiss and retry</Button> : null}
                </div>
              </Alert>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldAlert aria-hidden="true" className="h-4 w-4" /> Retrieved workspace content is treated as untrusted data.</p>
              <Button type="submit" isLoading={askCopilot.isPending} disabled={askCopilot.isPending || healthUnavailable || rateLimitedForSeconds !== undefined} leftIcon={<Send aria-hidden="true" className="h-4 w-4" />}>Ask Copilot</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {askCopilot.isPending ? <Skeleton className="h-72 rounded-2xl" /> : null}
      {response !== null ? <CopilotAnswer response={response} /> : null}
    </div>
  );
}


