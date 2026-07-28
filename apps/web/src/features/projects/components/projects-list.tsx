import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import { ProjectCard } from "./project-card";
import type { Project } from "../types";

export interface ProjectsListProps {
  canDeleteProject?: boolean;
  canUpdateProject?: boolean;
  projects: Project[];
  onArchiveProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onViewProject: (project: Project) => void;
}

export function ProjectsList({ canDeleteProject = true, canUpdateProject = true, projects, onArchiveProject, onDeleteProject, onEditProject, onViewProject }: ProjectsListProps): ReactElement {
  return (
    <motion.div animate="show" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" initial="hidden" variants={staggerChildren}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          canDeleteProject={canDeleteProject}
          canUpdateProject={canUpdateProject}
          project={project}
          onArchiveProject={onArchiveProject}
          onDeleteProject={onDeleteProject}
          onEditProject={onEditProject}
          onViewProject={onViewProject}
        />
      ))}
    </motion.div>
  );
}