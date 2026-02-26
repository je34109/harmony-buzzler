import type { MidiNote } from "./midiToJianpu";

/**
 * Extract melody from audio using @spotify/basic-pitch.
 * Falls back to demo data when audioUrl is empty.
 */
export async function extractMelody(audioUrl: string): Promise<MidiNote[]> {
  // Demo mode: return mock data
  if (!audioUrl) {
    return getDemoMelody();
  }

  try {
    // Dynamic import to avoid SSR issues with TensorFlow.js
    const { BasicPitch, noteFramesToTime, addPitchBendsToNoteEvents, outputToNotesPoly } =
      await import("@spotify/basic-pitch");

    // Fetch and decode audio
    console.log("Fetching vocals audio:", audioUrl);
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();

    // Decode to AudioBuffer using Web Audio API
    const audioContext = new AudioContext({ sampleRate: 22050 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();

    // Get mono audio data
    const monoData = audioBuffer.getChannelData(0);

    // Run basic-pitch inference
    console.log("Running basic-pitch inference...");
    const basicPitch = new BasicPitch(
      "https://unpkg.com/@spotify/basic-pitch@1.0.1/model/model.json"
    );

    const frames: number[][] = [];
    const onsets: number[][] = [];
    const contours: number[][] = [];

    await basicPitch.evaluateModel(
      monoData,
      (f: number[][], o: number[][], c: number[][]) => {
        frames.push(...f);
        onsets.push(...o);
        contours.push(...c);
      },
      (percent: number) => {
        console.log(`Basic-pitch progress: ${Math.round(percent * 100)}%`);
      }
    );

    // Convert to note events
    const noteEvents = outputToNotesPoly(frames, onsets, 0.25, 0.25, 5);
    const notesWithBends = addPitchBendsToNoteEvents(contours, noteEvents);
    const timedNotes = noteFramesToTime(notesWithBends);

    // Convert to our MidiNote format, filter to melody (highest pitch at each time)
    const midiNotes: MidiNote[] = timedNotes
      .map((note) => ({
        pitchMidi: note.pitchMidi,
        startTime: note.startTimeSeconds,
        duration: note.durationSeconds,
        amplitude: note.amplitude,
      }))
      .sort((a, b) => a.startTime - b.startTime);

    // Extract monophonic melody: keep highest note at each time point
    const melody = extractMonophonicMelody(midiNotes);

    console.log(`Extracted ${melody.length} melody notes from basic-pitch`);
    return melody;
  } catch (err) {
    console.error("Basic-pitch extraction failed:", err);
    throw new Error(
      `旋律提取失败: ${err instanceof Error ? err.message : "未知错误"}`
    );
  }
}

/**
 * Extract monophonic melody from polyphonic notes
 * by keeping the highest pitch at each time point.
 */
function extractMonophonicMelody(notes: MidiNote[]): MidiNote[] {
  if (notes.length === 0) return [];

  const melody: MidiNote[] = [];
  let currentEnd = 0;

  for (const note of notes) {
    // If this note starts after the current note ends, add it
    if (note.startTime >= currentEnd - 0.01) {
      melody.push(note);
      currentEnd = note.startTime + note.duration;
    } else {
      // Overlapping: keep the higher pitch
      const last = melody[melody.length - 1];
      if (last && note.pitchMidi > last.pitchMidi) {
        melody[melody.length - 1] = note;
        currentEnd = note.startTime + note.duration;
      }
    }
  }

  return melody;
}

/**
 * Demo mode: "Twinkle Twinkle Little Star" in C major
 */
function getDemoMelody(): MidiNote[] {
  const bpm = 120;
  const beat = 60 / bpm;
  const melody = [
    { pitch: 60, beats: 1 }, { pitch: 60, beats: 1 },
    { pitch: 67, beats: 1 }, { pitch: 67, beats: 1 },
    { pitch: 69, beats: 1 }, { pitch: 69, beats: 1 },
    { pitch: 67, beats: 2 },
    { pitch: 65, beats: 1 }, { pitch: 65, beats: 1 },
    { pitch: 64, beats: 1 }, { pitch: 64, beats: 1 },
    { pitch: 62, beats: 1 }, { pitch: 62, beats: 1 },
    { pitch: 60, beats: 2 },
    { pitch: 67, beats: 1 }, { pitch: 67, beats: 1 },
    { pitch: 65, beats: 1 }, { pitch: 65, beats: 1 },
    { pitch: 64, beats: 1 }, { pitch: 64, beats: 1 },
    { pitch: 62, beats: 2 },
    { pitch: 67, beats: 1 }, { pitch: 67, beats: 1 },
    { pitch: 65, beats: 1 }, { pitch: 65, beats: 1 },
    { pitch: 64, beats: 1 }, { pitch: 64, beats: 1 },
    { pitch: 62, beats: 2 },
    { pitch: 60, beats: 1 }, { pitch: 60, beats: 1 },
    { pitch: 67, beats: 1 }, { pitch: 67, beats: 1 },
    { pitch: 69, beats: 1 }, { pitch: 69, beats: 1 },
    { pitch: 67, beats: 2 },
    { pitch: 65, beats: 1 }, { pitch: 65, beats: 1 },
    { pitch: 64, beats: 1 }, { pitch: 64, beats: 1 },
    { pitch: 62, beats: 1 }, { pitch: 62, beats: 1 },
    { pitch: 60, beats: 2 },
  ];

  let time = 0;
  return melody.map(({ pitch, beats }) => {
    const note: MidiNote = {
      pitchMidi: pitch,
      startTime: time,
      duration: beats * beat * 0.9,
      amplitude: 0.8,
    };
    time += beats * beat;
    return note;
  });
}
