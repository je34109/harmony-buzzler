export interface JianpuNote {
  degree: number;       // 1-7 (Do-Si), 0 for rest
  accidental: "#" | "b" | "";
  octave: number;       // 0 = middle, positive = higher, negative = lower
  duration: number;     // in beats: 4, 2, 1, 0.5, 0.25
  startTime: number;    // in seconds
}

export interface ChordEvent {
  time: number;
  endTime: number;
  label: string;       // e.g., "Cmaj", "Am", "G7"
}

export interface JianpuSheet {
  title: string;
  keySignature: string; // e.g., "1=C"
  tempo: number;        // BPM
  notes: JianpuNote[];
  chords?: ChordEvent[];
}
