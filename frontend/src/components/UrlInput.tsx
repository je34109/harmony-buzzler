"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const YOUTUBE_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/;

export default function UrlInput() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
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

  return (
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

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

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
  );
}
