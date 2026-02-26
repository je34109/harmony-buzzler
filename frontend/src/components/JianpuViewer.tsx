"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type { JianpuNote, ChordEvent } from "@/types/jianpu";
import { renderJianpuSvg } from "@/lib/jianpuRenderer";
import { exportPng, exportPdf } from "@/lib/jianpuExporter";
import JianpuToolbar from "./JianpuToolbar";

interface JianpuViewerProps {
  notes: JianpuNote[];
  chords: ChordEvent[];
  keySignature: string;
  tempo: number;
  title?: string;
}

export default function JianpuViewer({
  notes,
  chords,
  keySignature,
  tempo,
  title,
}: JianpuViewerProps) {
  const [showChords, setShowChords] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const svgString = useMemo(
    () =>
      renderJianpuSvg(notes, showChords ? chords : undefined, keySignature, tempo, {
        showChords,
      }),
    [notes, chords, keySignature, tempo, showChords]
  );

  const handleExportPng = useCallback(async () => {
    if (!containerRef.current) return;
    const filename = title
      ? `${title.replace(/[^\w\u4e00-\u9fff]/g, "_")}_簡譜`
      : "jianpu";
    await exportPng(containerRef.current, filename);
  }, [title]);

  const handleExportPdf = useCallback(async () => {
    if (!containerRef.current) return;
    const filename = title
      ? `${title.replace(/[^\w\u4e00-\u9fff]/g, "_")}_簡譜`
      : "jianpu";
    await exportPdf(containerRef.current, filename);
  }, [title]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <JianpuToolbar
        showChords={showChords}
        onToggleChords={() => setShowChords((prev) => !prev)}
        onExportPng={handleExportPng}
        onExportPdf={handleExportPdf}
      />

      {/* Jianpu display area - white background for readability and export */}
      <div className="rounded-xl overflow-hidden border border-gray-700 shadow-lg">
        <div className="overflow-x-auto bg-white">
          <div
            ref={containerRef}
            className="min-w-fit"
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-500 space-y-1 px-1">
        <p>
          <span className="text-gray-400">數字 1-7</span> = Do Re Mi Fa Sol La Si
          &nbsp;&nbsp;
          <span className="text-gray-400">0</span> = 休止符
          &nbsp;&nbsp;
          <span className="text-gray-400">上方圓點</span> = 高八度
          &nbsp;&nbsp;
          <span className="text-gray-400">下方圓點</span> = 低八度
        </p>
        <p>
          <span className="text-gray-400">底線</span> = 八分 / 十六分音符
          &nbsp;&nbsp;
          <span className="text-gray-400">短橫線</span> = 延長拍
          &nbsp;&nbsp;
          <span className="text-gray-400"># / b</span> = 升降記號
        </p>
      </div>
    </div>
  );
}
