import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getDraft, saveDraft, type Draft } from "@/lib/gateway";

/** Loads the in-progress checkout draft, bouncing back to the cart if there is none. */
export function useDraft() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    const d = getDraft();
    if (!d) {
      navigate({ to: "/gateway" });
      return;
    }
    setDraft(d);
  }, [navigate]);

  const patch = (p: Partial<Draft>) =>
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...p };
      saveDraft(next);
      return next;
    });

  return { draft, patch };
}
