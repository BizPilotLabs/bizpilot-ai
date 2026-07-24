import { type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui";

export interface AuthSubmitButtonProps {
  isPending: boolean;
  children: ReactNode;
}

export function AuthSubmitButton({ isPending, children }: AuthSubmitButtonProps): ReactElement {
  return (
    <Button className="w-full" isLoading={isPending} type="submit">
      {children}
    </Button>
  );
}

