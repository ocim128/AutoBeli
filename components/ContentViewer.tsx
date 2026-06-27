"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { getErrorMessage } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";
import { CornerFrame } from "@/components/ui/corner-frame";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
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

  const handleCopyAll = useCallback(async () => {
    if (!content) return;

    if (!navigator.clipboard?.writeText) {
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
          <span className="eyebrow">{t("contentViewer.secureDelivery")}</span>
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

            <Button type="button" onClick={handleReveal} disabled={loading} size="xl">
              {loading ? (
                <>
                  <Spinner size={16} className="text-current" />
                  <span>{t("contentViewer.decrypting")}</span>
                </>
              ) : (
                <span>{t("contentViewer.unlockContent")}</span>
              )}
            </Button>

            {error && (
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--danger)]">
                {error}
              </p>
            )}
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {/* Actions row */}
          <div className="flex items-center justify-between">
            <span className="eyebrow">{t("contentViewer.decryptedData")}</span>
            <Button type="button" variant="outline" size="sm" onClick={handleCopyAll}>
              <svg
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? t("contentViewer.copied") : t("contentViewer.copyToClipboard")}
            </Button>
          </div>

          {/* Structured content display */}
          <CornerFrame size="lg" color="var(--accent)">
            <StructuredContent content={content} />
          </CornerFrame>

          {/* Integrity footer */}
          <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success-soft)]">
                <svg
                  className="size-3.5 text-[var(--success)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="eyebrow-sm">{t("contentViewer.verifiedIntegrity")}</span>
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

/* ── Structured Content Renderer ────────────────────── */

function StructuredContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");

  // Single-line content (e.g. a license key, single code)
  if (lines.length === 1) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6">
        <p className="break-all font-mono text-sm leading-relaxed text-[var(--foreground)]">
          {content}
        </p>
      </div>
    );
  }

  // Multi-line structured display
  return (
    <div className="max-h-[600px] overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--panel)]">
      <div className="divide-y divide-[var(--line)]">
        {lines.map((line, i) => (
          <ContentLine key={i} index={i} line={line} />
        ))}
      </div>
    </div>
  );
}

/* ── Single Content Line with per-line copy ─────────── */

function ContentLine({ index, line }: { index: number; line: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopyLine = useCallback(async () => {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(line);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("contentViewer.copyFailed"));
    }
  }, [line, t]);

  const isEmpty = line.trim() === "";

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-2.5 transition-colors ${
        isEmpty ? "bg-transparent" : "hover:bg-[var(--panel-2)]"
      }`}
    >
      {/* Line number */}
      <span className="w-6 shrink-0 text-right font-mono text-[0.6rem] leading-[1.7] text-[var(--text-muted)] opacity-50 tabular-nums select-none">
        {index + 1}
      </span>

      {/* Content */}
      <p className="min-w-0 flex-1 break-all whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--foreground)]">
        {isEmpty ? "\u00A0" : line}
      </p>

      {/* Per-line copy — always visible on touch, hover on larger screens */}
      {!isEmpty && (
        <button
          type="button"
          onClick={handleCopyLine}
          className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          aria-label={t("contentViewer.copyLine")}
        >
          {copied ? (
            <svg
              className="h-3.5 w-3.5 text-[var(--success)]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-3.5 w-3.5 text-[var(--text-muted)] hover:text-[var(--foreground)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export default memo(ContentViewer);
