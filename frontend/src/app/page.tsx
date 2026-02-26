import UrlInput from "@/components/UrlInput";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-pink-400 to-violet-500 bg-clip-text text-transparent">
            Harmony Buzzler
          </h1>
          <p className="text-xl text-gray-300">
            YouTube 歌曲簡譜產生器
          </p>
        </div>

        {/* Description */}
        <div className="text-center text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
          <p>
            貼上 YouTube 歌曲連結，自動分析調性、速度與和弦，
            分離人聲並提取旋律，最終生成簡譜（數字譜），
            支援下載 PNG / PDF。
          </p>
        </div>

        {/* URL Input */}
        <UrlInput />

        {/* Demo link */}
        <div className="text-center">
          <a
            href="/analyze?url=demo"
            className="text-sm text-gray-500 hover:text-pink-400 underline underline-offset-4 transition-colors"
          >
            沒有連結？試試 Demo 範例
          </a>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600 text-xs pt-12 space-y-1">
          <p>Powered by Demucs, Madmom, Basic Pitch & Next.js</p>
          <p>&copy; 2026 Harmony Buzzler</p>
        </footer>
      </div>
    </main>
  );
}
