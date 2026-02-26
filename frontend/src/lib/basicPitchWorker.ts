import type { MidiNote } from "./midiToJianpu";

/**
 * Placeholder for basic-pitch melody extraction.
 * In production, this will run @spotify/basic-pitch in a Web Worker.
 * For now, generates mock melody data for testing the jianpu pipeline.
 */
export async function extractMelody(_audioUrl: string): Promise<MidiNote[]> {
  // TODO: Replace with real basic-pitch Web Worker implementation
  // const worker = new Worker(new URL('./basicPitchWorkerImpl.ts', import.meta.url));

  console.log("Mock melody extraction for:", _audioUrl);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate "Twinkle Twinkle Little Star" as test data in C major
  const bpm = 120;
  const beat = 60 / bpm;
  const melody = [
    // Twinkle Twinkle Little Star melody (MIDI notes)
    { pitch: 60, beats: 1 }, // C - Twin
    { pitch: 60, beats: 1 }, // C - kle
    { pitch: 67, beats: 1 }, // G - twin
    { pitch: 67, beats: 1 }, // G - kle
    { pitch: 69, beats: 1 }, // A - lit
    { pitch: 69, beats: 1 }, // A - tle
    { pitch: 67, beats: 2 }, // G - star
    { pitch: 65, beats: 1 }, // F - how
    { pitch: 65, beats: 1 }, // F - I
    { pitch: 64, beats: 1 }, // E - won
    { pitch: 64, beats: 1 }, // E - der
    { pitch: 62, beats: 1 }, // D - what
    { pitch: 62, beats: 1 }, // D - you
    { pitch: 60, beats: 2 }, // C - are
    // Second verse
    { pitch: 67, beats: 1 }, // G - up
    { pitch: 67, beats: 1 }, // G - a
    { pitch: 65, beats: 1 }, // F - bove
    { pitch: 65, beats: 1 }, // F - the
    { pitch: 64, beats: 1 }, // E - world
    { pitch: 64, beats: 1 }, // E - so
    { pitch: 62, beats: 2 }, // D - high
    { pitch: 67, beats: 1 }, // G - like
    { pitch: 67, beats: 1 }, // G - a
    { pitch: 65, beats: 1 }, // F - dia
    { pitch: 65, beats: 1 }, // F - mond
    { pitch: 64, beats: 1 }, // E - in
    { pitch: 64, beats: 1 }, // E - the
    { pitch: 62, beats: 2 }, // D - sky
    // Back to main theme
    { pitch: 60, beats: 1 }, // C - Twin
    { pitch: 60, beats: 1 }, // C - kle
    { pitch: 67, beats: 1 }, // G - twin
    { pitch: 67, beats: 1 }, // G - kle
    { pitch: 69, beats: 1 }, // A - lit
    { pitch: 69, beats: 1 }, // A - tle
    { pitch: 67, beats: 2 }, // G - star
    { pitch: 65, beats: 1 }, // F - how
    { pitch: 65, beats: 1 }, // F - I
    { pitch: 64, beats: 1 }, // E - won
    { pitch: 64, beats: 1 }, // E - der
    { pitch: 62, beats: 1 }, // D - what
    { pitch: 62, beats: 1 }, // D - you
    { pitch: 60, beats: 2 }, // C - are
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
