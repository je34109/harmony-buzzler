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

/** Wrap fetch with friendlier error messages for network failures. */
async function safeFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(
      "無法連線到伺服器。伺服器可能正在啟動中（約 30 秒），請稍後再試。"
    );
  }
}

/** Wake up the HF Space backend (it sleeps after inactivity). */
export async function wakeUpBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(60000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const res = await safeFetch(`${API_URL}/api/analyze`, {
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

export async function analyzeUpload(file: File, title: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);

  const res = await safeFetch(`${API_URL}/api/analyze/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Server error" }));
    throw new Error(err.detail || "Upload analysis failed");
  }
  return res.json();
}

export async function downloadYouTubeAudio(url: string): Promise<void> {
  const res = await safeFetch(`${API_URL}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "下載失敗" }));
    throw new Error(err.detail || "下載失敗");
  }

  // Extract filename from Content-Disposition header
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|"?)(.+?)(?:"|;|$)/i);
  const filename = match ? decodeURIComponent(match[1]) : "audio.mp3";

  // Trigger browser download
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

export function getAudioUrl(path: string): string {
  return `${API_URL}${path}`;
}
