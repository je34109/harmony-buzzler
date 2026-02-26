"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { analyzeUrl, analyzeUpload, getAudioUrl } from "@/lib/api";
import { consumePendingFile } from "@/lib/fileStore";
import { extractMelody } from "@/lib/basicPitchWorker";
import { midiToJianpu, mapChordsToJianpu } from "@/lib/midiToJianpu";
import type { MidiNote } from "@/lib/midiToJianpu";
import type { JianpuNote, ChordEvent } from "@/types/jianpu";
import type { AnalysisResult } from "@/lib/api";
import ProcessingStatus from "@/components/ProcessingStatus";
import SongMetadata from "@/components/SongMetadata";
import JianpuViewer from "@/components/JianpuViewer";

type Stage =
  | "idle"
  | "downloading"
  | "separating"
  | "detecting-key"
  | "detecting-chords"
  | "extracting-melody"
  | "generating"
  | "done"
  | "error";

const STAGE_TO_STEP: Record<Stage, number> = {
  idle: 0,
  downloading: 1,
  separating: 2,
  "detecting-key": 3,
  "detecting-chords": 4,
  "extracting-melody": 5,
  generating: 6,
  done: 7,
  error: 0,
};

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url") || "";
  const mode = searchParams.get("mode") || "";
  const uploadTitle = searchParams.get("title") || "Uploaded Audio";

  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isYouTubeBlocked, setIsYouTubeBlocked] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [jianpuNotes, setJianpuNotes] = useState<JianpuNote[]>([]);
  const [chordEvents, setChordEvents] = useState<ChordEvent[]>([]);
  const [keyRoot, setKeyRoot] = useState<string>("C");
  const [keyRootMidi, setKeyRootMidi] = useState<number>(60);
  const [keyScale, setKeyScale] = useState<string>("major");
  const [midiNotes, setMidiNotes] = useState<MidiNote[]>([]);

  const hasStarted = useRef(false);

  const runAnalysis = useCallback(async () => {
    const isUpload = mode === "upload";
    const isDemo = url === "demo";

    if (!url && !isUpload) return;

    try {
      let result: AnalysisResult;

      if (isDemo) {
        // Demo mode: simulate all steps with mock data
        setStage("downloading");
        await new Promise((r) => setTimeout(r, 500));
        setStage("separating");
        await new Promise((r) => setTimeout(r, 800));
        setStage("detecting-key");
        await new Promise((r) => setTimeout(r, 400));
        setStage("detecting-chords");
        await new Promise((r) => setTimeout(r, 400));

        result = {
          metadata: { title: "Twinkle Twinkle Little Star (Demo)", duration: 30, thumbnail: "" },
          analysis: {
            key: { root: "C", scale: "major", rootMidi: 60, confidence: 0.95 },
            tempo: { bpm: 120, beatPositions: [], confidence: 0.92 },
            chords: [
              { start: 0, end: 2, label: "C:maj" },
              { start: 2, end: 4, label: "F:maj" },
              { start: 4, end: 6, label: "C:maj" },
              { start: 6, end: 8, label: "G:maj" },
              { start: 8, end: 10, label: "C:maj" },
              { start: 10, end: 12, label: "F:maj" },
              { start: 12, end: 14, label: "C:maj" },
            ],
          },
          audio: { vocalsUrl: "" },
        };
      } else if (isUpload) {
        // Upload mode: send file to backend
        const pending = consumePendingFile();
        if (!pending) {
          throw new Error("找不到上傳的檔案，請返回首頁重新上傳");
        }

        setStage("downloading");
        setStage("separating");
        result = await analyzeUpload(pending.file, pending.title);

        setStage("detecting-key");
        await new Promise((r) => setTimeout(r, 400));
        setStage("detecting-chords");
        await new Promise((r) => setTimeout(r, 400));
      } else {
        // URL mode: call backend with YouTube URL
        setStage("downloading");
        setStage("separating");
        result = await analyzeUrl(url);

        setStage("detecting-key");
        await new Promise((r) => setTimeout(r, 400));
        setStage("detecting-chords");
        await new Promise((r) => setTimeout(r, 400));
      }

      setAnalysisResult(result);
      setKeyRoot(result.analysis.key.root);
      setKeyRootMidi(result.analysis.key.rootMidi);
      setKeyScale(result.analysis.key.scale);

      // Step 5: Extract melody using basic-pitch
      setStage("extracting-melody");
      const vocalsUrl = isDemo ? "" : getAudioUrl(result.audio.vocalsUrl);
      const extractedMidi = await extractMelody(vocalsUrl);
      setMidiNotes(extractedMidi);

      // Step 6: Generate jianpu
      setStage("generating");
      await new Promise((r) => setTimeout(r, 300));

      const notes = midiToJianpu(
        extractedMidi,
        result.analysis.key.rootMidi,
        result.analysis.key.scale,
        result.analysis.tempo.bpm,
        result.analysis.tempo.beatPositions
      );
      setJianpuNotes(notes);

      const chords = mapChordsToJianpu(result.analysis.chords);
      setChordEvents(chords);

      setStage("done");
    } catch (err) {
      console.error("Analysis failed:", err);
      const msg = err instanceof Error ? err.message : "分析過程中發生錯誤";
      const blocked = msg.includes("封鎖") || msg.includes("bot") || msg.includes("Sign in");
      setIsYouTubeBlocked(blocked);
      setErrorMsg(blocked
        ? "YouTube 封鎖了雲端伺服器的下載請求"
        : msg
      );
      setStage("error");
    }
  }, [url, mode, uploadTitle]);

  useEffect(() => {
    if (!url && mode !== "upload") {
      router.push("/");
      return;
    }
    if (hasStarted.current) return;
    hasStarted.current = true;
    runAnalysis();
  }, [url, mode, router, runAnalysis]);

  const handleRetry = useCallback(() => {
    setStage("idle");
    setErrorMsg(null);
    hasStarted.current = false;
    runAnalysis();
  }, [runAnalysis]);

  const handleKeyChange = useCallback(
    (newRoot: string, newRootMidi: number) => {
      setKeyRoot(newRoot);
      setKeyRootMidi(newRootMidi);

      if (midiNotes.length > 0 && analysisResult) {
        const notes = midiToJianpu(
          midiNotes,
          newRootMidi,
          keyScale,
          analysisResult.analysis.tempo.bpm,
          analysisResult.analysis.tempo.beatPositions
        );
        setJianpuNotes(notes);
      }
    },
    [midiNotes, analysisResult, keyScale]
  );

  const currentStep = STAGE_TO_STEP[stage] || 0;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回首頁
          </button>

          <h1 className="text-lg font-semibold bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">
            Harmony Buzzler
          </h1>
        </div>

        {/* Processing state */}
        {stage !== "done" && (
          <div className="py-12 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-white">
                {stage === "error" ? "分析失敗" : "分析處理中"}
              </h2>
              {(url || mode === "upload") && (
                <p className="text-gray-500 text-sm truncate max-w-md mx-auto">
                  {mode === "upload" ? uploadTitle : decodeURIComponent(url)}
                </p>
              )}
            </div>

            <ProcessingStatus
              currentStep={stage === "error" ? currentStep || 1 : currentStep}
              error={errorMsg}
            />

            {stage === "error" && (
              <div className="text-center pt-4 space-y-4">
                {isYouTubeBlocked && (
                  <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 max-w-md mx-auto space-y-3">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      YouTube 會封鎖來自雲端伺服器的下載請求。
                      請改用<strong className="text-pink-400">上傳音檔</strong>功能：
                    </p>
                    <ol className="text-gray-400 text-sm text-left space-y-1 list-decimal list-inside">
                      <li>先從 YouTube 下載歌曲音檔到電腦</li>
                      <li>回到首頁，使用「上傳音檔」區域上傳</li>
                      <li>系統會自動分析並生成簡譜</li>
                    </ol>
                    <button
                      onClick={() => router.push("/")}
                      className="w-full py-2.5 rounded-lg font-medium text-sm
                                 bg-gradient-to-r from-amber-500 to-pink-500
                                 hover:from-amber-400 hover:to-pink-400
                                 text-white transition-all"
                    >
                      返回首頁上傳音檔
                    </button>
                  </div>
                )}
                {!isYouTubeBlocked && (
                  <button
                    onClick={handleRetry}
                    className="px-6 py-2.5 rounded-lg font-medium text-sm
                               bg-gradient-to-r from-amber-500 to-pink-500
                               hover:from-amber-400 hover:to-pink-400
                               text-white transition-all"
                  >
                    重試
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {stage === "done" && analysisResult && (
          <div className="space-y-6">
            {/* Song metadata */}
            <SongMetadata
              metadata={analysisResult.metadata}
              analysis={{
                ...analysisResult.analysis,
                key: {
                  ...analysisResult.analysis.key,
                  root: keyRoot,
                  rootMidi: keyRootMidi,
                },
              }}
              onKeyChange={handleKeyChange}
            />

            {/* Jianpu viewer */}
            <JianpuViewer
              notes={jianpuNotes}
              chords={chordEvents}
              keySignature={`1=${keyRoot}`}
              tempo={Math.round(analysisResult.analysis.tempo.bpm)}
              title={analysisResult.metadata.title}
            />

            {/* Back button */}
            <div className="text-center pt-4">
              <button
                onClick={() => router.push("/")}
                className="text-gray-400 hover:text-white text-sm underline underline-offset-4 transition-colors"
              >
                分析另一首歌曲
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
