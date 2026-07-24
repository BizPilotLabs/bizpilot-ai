import { type ReactElement } from "react";
import { Alert } from "@/components/ui";

export interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps): ReactElement {
  return <Alert variant="danger">{message}</Alert>;
}

