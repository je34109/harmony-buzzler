export interface AnalysisResult {
  metadata: {
    title: string;
    duration: number;
    thumbnail: string;
  };
  analysis: {
    key: KeyResult;
    tempo: TempoResult;
    chords: ChordResult[];
  };
  audio: {
    vocalsUrl: string;
  };
}

export interface KeyResult {
  root: string;
  scale: string;
  rootMidi: number;
  confidence: number;
}

export interface TempoResult {
  bpm: number;
  beatPositions: number[];
  confidence: number;
}

export interface ChordResult {
  start: number;
  end: number;
  label: string;
}
