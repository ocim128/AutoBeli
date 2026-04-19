"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { getErrorMessage } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";
import { CornerFrame } from "@/components/ui/corner-frame";
import { StatusBadge } from "@/components/ui/status-badge";
import Spinner from "@/components/ui/Spinner";
import { toast } from "sonner";

function ContentViewer({ token }: { token: string }) {
  const { t } = useLanguage();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const handleReveal = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/delivery/${token}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || t("contentViewer.unlockFailed"));

      setContent(data.content);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  const handleCopy = useCallback(async () => {
    if (!content) return;

    if (!navigator.clipboard?.writeText) {
      setCopied(false);
      toast.error(t("contentViewer.copyFailed"));
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      setCopied(true);
      copyResetTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      toast.error(t("contentViewer.copyFailed"));
    }
  }, [content, t]);

  return (
    <div className="space-y-4">
      {/* Secure Delivery Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Lock icon */}
          <svg
            className="h-4 w-4 text-[var(--accent)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {t("contentViewer.secureDelivery")}
          </span>
        </div>
        {content && (
          <StatusBadge status="success">{t("contentViewer.statusDecrypted")}</StatusBadge>
        )}
        {!content && !error && (
          <StatusBadge status="warning">{t("contentViewer.statusEncrypted")}</StatusBadge>
        )}
        {error && <StatusBadge status="error">{t("contentViewer.statusError")}</StatusBadge>}
      </div>

      {/* Content Area */}
      {!content ? (
        <Panel variant="accent" padding="lg">
          <div className="flex flex-col items-center gap-6 py-6 text-center">
            {/* Lock icon large */}
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--panel)]">
              <svg
                className="h-8 w-8 text-[var(--text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-xl text-[var(--foreground)]">
                {t("contentViewer.contentEncrypted")}
              </h3>
              <p className="max-w-sm text-sm text-[var(--text-muted)]">
                {t("contentViewer.encryptedDesc")}
              </p>
            </div>

            <button
              type="button"
              onClick={handleReveal}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-8 py-3 font-mono text-sm font-medium uppercase tracking-wider text-[var(--accent-foreground)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Spinner size={16} className="text-current" variant="classic" />
                  <span>{t("contentViewer.decrypting")}</span>
                </>
              ) : (
                <span>{t("contentViewer.unlockContent")}</span>
              )}
            </button>

            {error && (
              <p className="font-mono text-xs uppercase tracking-widest text-red-400">{error}</p>
            )}
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {/* Copy button row */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {t("contentViewer.decryptedData")}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
            >
              {/* Clipboard icon */}
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? t("contentViewer.copied") : t("contentViewer.copyToClipboard")}
            </button>
          </div>

          {/* Content display with corner frame */}
          <CornerFrame size="lg" color="var(--accent)">
            <pre className="max-h-[600px] overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6 font-mono text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-wrap break-all">
              {content}
            </pre>
          </CornerFrame>

          {/* Integrity footer */}
          <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                <svg
                  className="h-3.5 w-3.5 text-emerald-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--text-muted)]">
                {t("contentViewer.verifiedIntegrity")}
              </span>
            </div>
            <p className="max-w-[200px] text-right font-mono text-[0.6rem] text-[var(--text-muted)]">
              {t("contentViewer.encryptedSession")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ContentViewer);
