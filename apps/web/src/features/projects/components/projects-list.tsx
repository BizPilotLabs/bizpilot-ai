import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import { ProjectCard } from "./project-card";
import type { Project } from "../types";

export interface ProjectsListProps {
  projects: Project[];
  onEditProject: (project: Project) => void;
}

export function ProjectsList({ projects, onEditProject }: ProjectsListProps): ReactElement {
  return (
    <motion.section aria-label="Projects" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" variants={staggerChildren} initial="hidden" animate="visible">
      {projects.map((project) => <ProjectCard key={project.id} project={project} onEditProject={onEditProject} />)}
    </motion.section>
  );
}

