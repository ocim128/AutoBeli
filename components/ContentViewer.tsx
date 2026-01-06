"use client";

import { useState } from "react";

export default function ContentViewer({ token }: { token: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReveal = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/delivery/${token}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to unlock");

      setContent(data.content);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      // Small feedback for copy
      const btn = document.getElementById("copy-btn");
      if (btn) {
        const originalText = btn.innerText;
        btn.innerText = "COPIED!";
        setTimeout(() => (btn.innerText = originalText), 2000);
      }
    }
  };

  return (
    <div className="mt-12 group">
      <div className="bg-gray-950 rounded-[2.5rem] border border-gray-800 shadow-2xl shadow-indigo-900/20 overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-500">
        <div className="bg-gray-900/50 backdrop-blur-md px-8 py-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/50"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/50"></div>
            </div>
            <h3 className="text-white/40 font-black text-[10px] tracking-[0.3em] uppercase ml-4">
              Secure_Delivery_Portal_v2.0
            </h3>
          </div>
          <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20">
            <span className="text-green-500 text-[8px] font-black tracking-widest uppercase">
              SSL_ACTIVE
            </span>
          </div>
        </div>

        <div className="p-10 md:p-16">
          {!content ? (
            <div className="text-center">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full" />
                <div className="relative w-24 h-24 mx-auto bg-gray-900 rounded-3xl border border-white/10 flex items-center justify-center animate-float">
                  <svg
                    className="w-10 h-10 text-indigo-500"
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
              </div>

              <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">
                Content Encrypted
              </h2>
              <p className="text-gray-400 mb-10 max-w-sm mx-auto font-medium text-sm leading-relaxed">
                Click below to initialize secure decryption and retrieve your digital asset.
              </p>

              <button
                onClick={handleReveal}
                disabled={loading}
                className="group relative px-12 py-5 bg-white text-gray-900 font-extrabold rounded-2xl shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {loading ? "DECRYPTING..." : "UNLOCK CONTENT"}
                </span>
              </button>

              {error && (
                <p className="text-red-500 mt-6 font-black text-xs uppercase tracking-widest">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in duration-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Decrypted Data
                </span>
                <button
                  id="copy-btn"
                  onClick={handleCopy}
                  className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl border border-white/10"
                >
                  COPY TO CLIPBOARD
                </button>
              </div>

              <div className="relative group/content">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl opacity-20 blur group-hover/content:opacity-40 transition duration-1000" />
                <pre className="relative bg-gray-950 p-8 rounded-3xl font-mono text-sm md:text-base text-gray-100 whitespace-pre-wrap break-all border border-white/5 overflow-x-auto max-h-[600px] leading-relaxed shadow-inner">
                  {content}
                </pre>
              </div>

              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                    Verified Integrity Check Passed
                  </span>
                </div>
                <p className="text-[9px] text-gray-600 font-bold max-w-[200px] text-center md:text-right">
                  This content was delivered via an end-to-end encrypted session.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
