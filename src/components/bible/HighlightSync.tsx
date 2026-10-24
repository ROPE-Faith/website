"use client";

import { useState } from "react";

export default function HighlightSync({ pending, retry }: { pending: number; retry: () => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  if (!pending) return null;
  return <div role="status" className="my-3 rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-dark">
    <p>{pending} highlight change{pending === 1 ? " is" : "s are"} saved on this device and waiting to sync.</p>
    <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await retry(); } finally { setBusy(false); } }} className="mt-1 min-h-10 font-semibold text-brown underline underline-offset-4 disabled:opacity-50">{busy ? "Retrying…" : "Retry sync"}</button>
  </div>;
}
