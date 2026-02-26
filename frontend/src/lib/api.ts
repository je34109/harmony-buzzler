const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

export interface AnalysisResult {
  metadata: { title: string; duration: number; thumbnail: string };
  analysis: {
    key: { root: string; scale: string; rootMidi: number; confidence: number };
    tempo: { bpm: number; beatPositions: number[]; confidence: number };
    chords: { start: number; end: number; label: string }[];
  };
  audio: { vocalsUrl: string };
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Server error" }));
    throw new Error(err.detail || "Analysis failed");
  }
  return res.json();
}

export function getAudioUrl(path: string): string {
  return `${API_URL}${path}`;
}
