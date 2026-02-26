"use client";

import Image from "next/image";

const ALL_KEYS = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

interface SongMetadataProps {
  metadata: {
    title: string;
    duration: number;
    thumbnail: string;
  };
  analysis: {
    key: {
      root: string;
      scale: string;
      rootMidi: number;
      confidence: number;
    };
    tempo: {
      bpm: number;
      confidence: number;
    };
  };
  onKeyChange: (newRoot: string, newRootMidi: number) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function rootToMidi(root: string): number {
  const map: Record<string, number> = {
    C: 60,
    "C#": 61,
    Db: 61,
    D: 62,
    "D#": 63,
    Eb: 63,
    E: 64,
    F: 65,
    "F#": 66,
    Gb: 66,
    G: 67,
    "G#": 68,
    Ab: 68,
    A: 69,
    "A#": 70,
    Bb: 70,
    B: 71,
  };
  return map[root] ?? 60;
}

export default function SongMetadata({
  metadata,
  analysis,
  onKeyChange,
}: SongMetadataProps) {
  const scaleLabel = analysis.key.scale === "minor" ? "小調" : "大調";
  const keyDisplay = `1=${analysis.key.root} ${scaleLabel}`;

  return (
    <div className="w-full rounded-xl bg-gray-900/70 border border-gray-800 overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Thumbnail */}
        <div className="shrink-0 relative w-full sm:w-48 aspect-video sm:aspect-auto sm:h-28 rounded-lg overflow-hidden bg-gray-800">
          {metadata.thumbnail ? (
            <Image
              src={metadata.thumbnail}
              alt={metadata.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg
                className="w-10 h-10"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <h2 className="text-lg font-semibold text-white truncate">
            {metadata.title}
          </h2>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {/* Key */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">調性</span>
              <span className="text-amber-400 font-medium">{keyDisplay}</span>
              <span className="text-gray-600 text-xs">
                ({Math.round(analysis.key.confidence * 100)}%)
              </span>
            </div>

            {/* Tempo */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">速度</span>
              <span className="text-pink-400 font-medium">
                {Math.round(analysis.tempo.bpm)} BPM
              </span>
              <span className="text-gray-600 text-xs">
                ({Math.round(analysis.tempo.confidence * 100)}%)
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">時長</span>
              <span className="text-violet-400 font-medium">
                {formatDuration(metadata.duration)}
              </span>
            </div>
          </div>

          {/* Key override dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="key-select"
              className="text-xs text-gray-500"
            >
              手動調整調性：
            </label>
            <select
              id="key-select"
              value={analysis.key.root}
              onChange={(e) => {
                const newRoot = e.target.value;
                onKeyChange(newRoot, rootToMidi(newRoot));
              }}
              className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm text-white
                         focus:outline-none focus:ring-1 focus:ring-pink-500/50 cursor-pointer"
            >
              {ALL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k} {analysis.key.scale === "minor" ? "m" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
