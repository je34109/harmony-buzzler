"use client";

interface JianpuToolbarProps {
  showChords: boolean;
  onToggleChords: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
}

export default function JianpuToolbar({
  showChords,
  onToggleChords,
  onExportPng,
  onExportPdf,
}: JianpuToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Display mode toggle */}
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={!showChords ? undefined : onToggleChords}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            !showChords
              ? "bg-gray-700 text-white shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          純旋律
        </button>
        <button
          onClick={showChords ? undefined : onToggleChords}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            showChords
              ? "bg-gray-700 text-white shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          旋律+和弦
        </button>
      </div>

      {/* Export buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExportPng}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                     bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700
                     border border-gray-700 transition-all"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          PNG
        </button>
        <button
          onClick={onExportPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                     bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700
                     border border-gray-700 transition-all"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          PDF
        </button>
      </div>
    </div>
  );
}
