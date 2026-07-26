import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import { TeamCard } from "./team-card";
import type { Team } from "../types";

export interface TeamsListProps {
  teams: Team[];
  onEditTeam: (team: Team) => void;
}

export function TeamsList({ teams, onEditTeam }: TeamsListProps): ReactElement {
  return (
    <motion.section aria-label="Teams" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" variants={staggerChildren} initial="hidden" animate="visible">
      {teams.map((team) => <TeamCard key={team.id} team={team} onEditTeam={onEditTeam} />)}
    </motion.section>
  );
}
