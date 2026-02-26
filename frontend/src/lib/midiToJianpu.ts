import type { JianpuNote, ChordEvent } from "@/types/jianpu";

// Semitone offsets for major scale degrees: 1=0, 2=2, 3=4, 4=5, 5=7, 6=9, 7=11
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

export interface MidiNote {
  pitchMidi: number;
  startTime: number;
  duration: number;
  amplitude: number;
}

export function midiToJianpu(
  notes: MidiNote[],
  rootMidi: number,
  scale: string,
  bpm: number,
  _beatPositions: number[]
): JianpuNote[] {
  const scaleMap = scale === "minor" ? MINOR_SCALE : MAJOR_SCALE;
  const beatDuration = 60 / bpm; // seconds per beat

  return notes.map((note) => {
    const semitones = note.pitchMidi - rootMidi;
    const octaveShift = Math.floor(semitones / 12);
    const pitchClass = ((semitones % 12) + 12) % 12;

    // Find closest scale degree
    let degree = 1;
    let accidental: "#" | "b" | "" = "";

    const exactIndex = scaleMap.indexOf(pitchClass);
    if (exactIndex >= 0) {
      degree = exactIndex + 1;
      accidental = "";
    } else {
      // Sharp: check if pitchClass - 1 is in scale
      const sharpIndex = scaleMap.indexOf(pitchClass - 1);
      if (sharpIndex >= 0) {
        degree = sharpIndex + 1;
        accidental = "#";
      } else {
        // Flat: check if pitchClass + 1 is in scale
        const flatIndex = scaleMap.indexOf(pitchClass + 1);
        if (flatIndex >= 0) {
          degree = flatIndex + 1;
          accidental = "b";
        }
      }
    }

    // Quantize duration to beats
    const durationBeats = note.duration / beatDuration;
    let quantized: number;
    if (durationBeats >= 3.5) quantized = 4;
    else if (durationBeats >= 1.5) quantized = 2;
    else if (durationBeats >= 0.75) quantized = 1;
    else if (durationBeats >= 0.375) quantized = 0.5;
    else quantized = 0.25;

    return {
      degree,
      accidental,
      octave: octaveShift,
      duration: quantized,
      startTime: note.startTime,
    };
  });
}

export function mapChordsToJianpu(
  chords: { start: number; end: number; label: string }[]
): ChordEvent[] {
  return chords.map((c) => ({
    time: c.start,
    endTime: c.end,
    label: c.label.replace(":", ""), // "C:maj" -> "Cmaj"
  }));
}
