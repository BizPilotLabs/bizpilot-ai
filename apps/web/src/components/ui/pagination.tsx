import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactElement } from "react";
import { Button } from "./button";
import { cn } from "@/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps): ReactElement {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-2", className)}>
      <Button aria-label="Previous page" size="icon" variant="neutral" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft aria-hidden="true" className="h-4 w-4" /></Button>
      {pages.map((item) => (
        <Button key={item} aria-current={item === page ? "page" : undefined} variant={item === page ? "primary" : "neutral"} size="sm" onClick={() => onPageChange(item)}>{item}</Button>
      ))}
      <Button aria-label="Next page" size="icon" variant="neutral" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight aria-hidden="true" className="h-4 w-4" /></Button>
    </nav>
  );
}

