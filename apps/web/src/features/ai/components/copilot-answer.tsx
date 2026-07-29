import { Copy, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { type ReactElement, useState } from "react";
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { AiCopilotResponse } from "../types";

export function CopilotAnswer({ response }: { response: AiCopilotResponse }): ReactElement {
  const [copied, setCopied] = useState(false);

  const copyAnswer = async (): Promise<void> => {
    await navigator.clipboard.writeText(response.answer);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-surface/80 shadow-[0_18px_70px_hsl(var(--shadow-color)/0.14)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="grid gap-2">
          <Badge variant="primary" className="w-fit"><Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Generated answer</Badge>
          <CardTitle>Copilot response</CardTitle>
        </div>
        <Button aria-label="Copy AI answer" size="sm" variant="neutral" onClick={() => void copyAnswer()} leftIcon={<Copy aria-hidden="true" className="h-4 w-4" />}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="whitespace-pre-wrap rounded-2xl border border-border/70 bg-background/55 p-4 text-sm leading-7 text-foreground">{response.answer}</div>
        {response.sources.length > 0 ? (
          <div className="grid gap-3">
            <p className="text-sm font-medium text-foreground">Sources</p>
            <div className="grid gap-2">
              {response.sources.map((source) => (
                <div key={`${source.type}-${source.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/45 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground"><span className="text-primary">{source.marker}</span> {source.label}</p>
                    <p className="text-xs capitalize text-muted-foreground">{source.type}{source.updatedAt ? ` - ${new Date(source.updatedAt).toLocaleDateString()}` : ""}</p>
                  </div>
                  {source.appRoute ? <Link className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" to={source.appRoute}>Open <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></Link> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <Alert variant="warning" title="Accuracy notice">AI output is generated from bounded authorized context. Verify important decisions against source records.</Alert>
      </CardContent>
    </Card>
  );
}

