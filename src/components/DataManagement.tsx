"use client";
import { useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { exportData, importData, clearAllData } from "@/lib/store";

export default function DataManagement() {
  const { isSignedIn } = useAuth();
  const [importStatus, setImportStatus] = useState<{ success?: boolean; error?: string } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rope-backup-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importData(content);
      setImportStatus(result);
      if (result.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = async (cloud: boolean = false) => {
    await clearAllData(cloud);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="card-surface rounded-2xl p-6 border border-brown/5">
        <h3 className="font-serif text-xl text-dark mb-2">Backup & Portability</h3>
        <p className="text-muted text-sm mb-6 leading-relaxed">
          {isSignedIn 
            ? "Your journal is synced to the cloud, but you can still export a local backup for extra peace of mind or to move to another account."
            : "Your journal is currently stored only on this device. Sign in to sync your journey to the cloud and access it anywhere."
          }
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brown text-ivory rounded-xl text-sm font-semibold hover:bg-brown-light transition shadow-sm active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Journal
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-cream-dark/40 text-brown border border-brown/10 rounded-xl text-sm font-semibold hover:bg-cream-dark/60 transition active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {importStatus && (
          <div className={`mt-5 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${importStatus.success ? "bg-[#6d8c5c15] text-[#6d8c5c] border border-[#6d8c5c20]" : "bg-[#b86b4e15] text-[#b86b4e] border border-[#b86b4e20]"}`}>
            {importStatus.success ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span>Import successful! Re-syncing your journey...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span>{importStatus.error || "Import failed. Please check the file format."}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="card-surface rounded-2xl p-6 border border-struggle/10 bg-struggle/[0.03]">
        <h3 className="font-serif text-lg text-struggle mb-2 font-semibold">Danger Zone</h3>
        <p className="text-muted text-sm mb-5 leading-relaxed">
          Permanently delete all journal entries, prayers, and settings. 
          {isSignedIn ? " Choose whether to clear only this device or wipe your entire cloud account." : " This cannot be undone."}
        </p>

        {!showConfirmClear ? (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="text-struggle text-sm font-semibold hover:underline flex items-center gap-2 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
            Delete all data from this device
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleClear()}
                className="px-5 py-2.5 bg-cream-dark/40 text-muted rounded-xl text-xs font-semibold hover:bg-cream-dark/60 transition"
              >
                Clear This Device Only
              </button>
              
              {isSignedIn && (
                <button
                  onClick={() => {
                    if (confirm("THIS IS IRREVERSIBLE. This will delete all your entries from the cloud forever. Proceed?")) {
                      handleClear(true);
                    }
                  }}
                  className="px-5 py-2.5 bg-struggle text-ivory rounded-xl text-xs font-bold hover:bg-struggle/90 transition shadow-sm active:scale-[0.98]"
                >
                  Delete Everywhere (Device & Cloud)
                </button>
              )}
              
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-5 py-2.5 text-muted hover:text-dark text-xs font-medium transition"
              >
                Cancel
              </button>
            </div>
            {isSignedIn && (
              <p className="text-[10px] text-muted italic">
                &quot;Delete Everywhere&quot; will permanently wipe your Neon database entries for this account.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
