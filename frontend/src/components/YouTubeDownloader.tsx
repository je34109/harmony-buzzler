"use client";

import { useState, useCallback } from "react";
import { downloadYouTubeAudio, wakeUpBackend } from "@/lib/api";

const YOUTUBE_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/;

type Status = "idle" | "waking" | "downloading" | "done" | "error";

export default function YouTubeDownloader() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError(null);
    } catch {
      setError("無法讀取剪貼簿");
    }
  }, []);

  const handleDownload = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = url.trim();

      if (!trimmed) {
        setError("請輸入 YouTube 連結");
        return;
      }
      if (!YOUTUBE_REGEX.test(trimmed)) {
        setError("請輸入有效的 YouTube 連結");
        return;
      }

      setError(null);

      // Step 1: Wake up backend if needed
      setStatus("waking");
      const alive = await wakeUpBackend();
      if (!alive) {
        setError("伺服器無法連線，請稍後再試");
        setStatus("error");
        return;
      }

      // Step 2: Download
      setStatus("downloading");
      try {
        await downloadYouTubeAudio(trimmed);
        setStatus("done");
        setTimeout(() => setStatus("idle"), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "下載失敗");
        setStatus("error");
      }
    },
    [url]
  );

  const isLoading = status === "waking" || status === "downloading";

  const buttonLabel = {
    idle: "下載 MP3 音檔",
    waking: "正在連線伺服器...",
    downloading: "下載中，請稍候...",
    done: "下載完成！",
    error: "下載 MP3 音檔",
  }[status];

  return (
    <form onSubmit={handleDownload} className="space-y-3">
      <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
        {/* Download icon */}
        <svg
          className="w-5 h-5 text-green-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>

        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
            if (status === "error" || status === "done") setStatus("idle");
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
          spellCheck={false}
          disabled={isLoading}
        />

        <button
          type="button"
          onClick={handlePaste}
          className="text-gray-400 hover:text-white transition-colors text-xs font-medium px-2 py-1 rounded hover:bg-gray-700"
          disabled={isLoading}
        >
          貼上
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-150
          ${
            isLoading
              ? "bg-gray-700 text-gray-400 cursor-wait"
              : status === "done"
                ? "bg-green-600 text-white"
                : "bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white"
          }`}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {buttonLabel}
          </span>
        ) : (
          buttonLabel
        )}
      </button>

      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </form>
  );
}
