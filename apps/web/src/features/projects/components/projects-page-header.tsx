import { Plus } from "lucide-react";
import { type ReactElement } from "react";
import { Button } from "@/components/ui";

export interface ProjectsPageHeaderProps {
  onCreateProject: () => void;
}

export function ProjectsPageHeader({ onCreateProject }: ProjectsPageHeaderProps): ReactElement {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="grid gap-1">
        <h2 className="text-h3">Projects</h2>
        <p className="text-sm text-muted-foreground">View projects from your organization.</p>
      </div>
      <Button leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={onCreateProject}>
        Create Project
      </Button>
    </div>
  );
}

