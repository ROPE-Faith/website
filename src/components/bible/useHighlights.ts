"use client";

import { useEffect, useState } from "react";
import { getBibleHighlights, getHighlightSyncStatus, retryHighlightSync } from "@/lib/store";
import type { BibleHighlight } from "@/lib/highlight-model";

export function useHighlights() {
  const [highlights, setHighlights] = useState<BibleHighlight[]>([]);
  const [sync, setSync] = useState({ pending: 0, cloud: false });
  useEffect(() => {
    const update = () => { setHighlights(getBibleHighlights()); setSync(getHighlightSyncStatus()); };
    const retry = () => { void retryHighlightSync().then(update); };
    update();
    retry();
    window.addEventListener("rope-highlights-update", update);
    window.addEventListener("storage", update);
    window.addEventListener("online", retry);
    return () => {
      window.removeEventListener("rope-highlights-update", update);
      window.removeEventListener("storage", update);
      window.removeEventListener("online", retry);
    };
  }, []);
  return { highlights, sync, retry: retryHighlightSync };
}
