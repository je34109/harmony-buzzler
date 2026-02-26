"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { setPendingFile } from "@/lib/fileStore";

const YOUTUBE_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/;

const ALLOWED_AUDIO = new Set([
  "audio/wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "audio/flac",
  "audio/webm",
  "video/webm",
]);

const ALLOWED_EXT = new Set([".wav", ".mp3", ".m4a", ".ogg", ".flac", ".webm"]);

export default function UrlInput() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const validate = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setError("請輸入 YouTube 連結");
      return false;
    }
    if (!YOUTUBE_REGEX.test(value.trim())) {
      setError("請輸入有效的 YouTube 連結");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError(null);
    } catch {
      setError("無法讀取剪貼簿，請手動貼上");
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validate(url)) {
        router.push(`/analyze?url=${encodeURIComponent(url.trim())}`);
      }
    },
    [url, validate, router]
  );

  const validateAndUpload = useCallback(
    (file: File) => {
      const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_AUDIO.has(file.type) && !ALLOWED_EXT.has(ext)) {
        setError(`不支援的格式。請使用：${[...ALLOWED_EXT].join(", ")}`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("檔案大小超過 50MB 限制");
        return;
      }
      setError(null);
      const title = file.name.replace(/\.[^.]+$/, "") || "Uploaded Audio";
      setPendingFile(file, title);
      router.push(`/analyze?mode=upload&title=${encodeURIComponent(title)}`);
    },
    [router]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndUpload(file);
    },
    [validateAndUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndUpload(file);
    },
    [validateAndUpload]
  );

  return (
    <div className="space-y-5">
      {/* YouTube URL form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input with gradient border */}
        <div className="relative rounded-xl p-[2px] bg-gradient-to-r from-amber-400 via-pink-500 to-violet-600">
          <div className="flex items-center gap-2 bg-gray-900 rounded-[10px] px-4 py-3">
            {/* YouTube icon */}
            <svg
              className="w-6 h-6 text-red-500 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>

            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-base outline-none"
              spellCheck={false}
            />

            <button
              type="button"
              onClick={handlePaste}
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-800"
              title="從剪貼簿貼上"
            >
              貼上
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-3 px-6 rounded-xl font-semibold text-base
                     bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600
                     hover:from-amber-400 hover:via-pink-400 hover:to-violet-500
                     active:scale-[0.98] transition-all duration-150
                     text-white shadow-lg shadow-pink-500/20"
        >
          開始分析
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-gray-500 text-sm">或上傳音檔</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* File upload drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-6 px-4
          ${
            dragOver
              ? "border-pink-400 bg-pink-500/10"
              : "border-gray-600 hover:border-gray-400 hover:bg-gray-800/50"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.m4a,.ogg,.flac,.webm"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <svg
            className={`w-8 h-8 ${dragOver ? "text-pink-400" : "text-gray-500"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className={`text-sm ${dragOver ? "text-pink-300" : "text-gray-400"}`}>
            拖放音檔到此處，或<span className="underline">點擊選擇檔案</span>
          </p>
          <p className="text-xs text-gray-600">
            支援 WAV, MP3, M4A, OGG, FLAC, WEBM（最大 50MB）
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
