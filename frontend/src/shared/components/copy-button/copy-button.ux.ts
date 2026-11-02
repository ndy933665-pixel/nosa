"use client";

import { useState } from "react";

const RESET_MS = 2000;

export function useCopyButton(value: string) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), RESET_MS);
    } catch {
      // Clipboard blocked (old browser or no permission): the value is still selectable on the page.
    }
  };

  return { copied, copy };
}
