"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useCopyButton } from "./copy-button.ux";

type CopyButtonProps = { value: string; labels: { copy: string; copied: string } };

/** A small icon button that copies a value (tracking number, order number) and confirms it for two seconds. */
export function CopyButton({ value, labels }: CopyButtonProps) {
  const button = useCopyButton(value);
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={button.copy} aria-label={button.copied ? labels.copied : labels.copy} title={labels.copy}>
      {button.copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}
