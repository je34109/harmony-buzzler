import type { JianpuNote, ChordEvent } from "@/types/jianpu";

interface RenderOptions {
  showChords: boolean;
  pageWidth?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  lineHeight?: number;
  noteWidth?: number;
  fontSize?: number;
  beatsPerMeasure?: number;
}

const DEFAULT_OPTIONS: Required<RenderOptions> = {
  showChords: false,
  pageWidth: 800,
  marginLeft: 40,
  marginRight: 40,
  marginTop: 60,
  lineHeight: 90,
  noteWidth: 36,
  fontSize: 22,
  beatsPerMeasure: 4,
};

/**
 * Renders jianpu notation as a self-contained SVG string.
 */
export function renderJianpuSvg(
  notes: JianpuNote[],
  chords: ChordEvent[] | undefined,
  keySignature: string,
  tempo: number,
  options: RenderOptions = { showChords: false }
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const {
    pageWidth,
    marginLeft,
    marginRight,
    marginTop,
    lineHeight,
    noteWidth,
    fontSize,
    beatsPerMeasure,
  } = opts;

  const usableWidth = pageWidth - marginLeft - marginRight;
  const chordRowHeight = opts.showChords ? 24 : 0;
  const fullLineHeight = lineHeight + chordRowHeight;

  // Group notes into measures
  const measures = groupIntoMeasures(notes, beatsPerMeasure);

  // Calculate how many measures fit per line
  const measuresPerLine = Math.max(
    1,
    Math.floor(usableWidth / (beatsPerMeasure * noteWidth + 12))
  );

  // Build lines of measures
  const lines: JianpuNote[][][] = [];
  for (let i = 0; i < measures.length; i += measuresPerLine) {
    lines.push(measures.slice(i, i + measuresPerLine));
  }

  const totalHeight =
    marginTop + lines.length * fullLineHeight + 40;

  // Start building SVG
  const svgParts: string[] = [];

  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${totalHeight}" viewBox="0 0 ${pageWidth} ${totalHeight}">`
  );

  // Background
  svgParts.push(
    `<rect width="${pageWidth}" height="${totalHeight}" fill="#ffffff"/>`
  );

  // Stylesheet
  svgParts.push(`<style>
    .jianpu-note { font-family: "Times New Roman", "Noto Serif", serif; font-size: ${fontSize}px; fill: #1a1a1a; text-anchor: middle; dominant-baseline: central; }
    .jianpu-note-accent { font-family: "Times New Roman", "Noto Serif", serif; font-size: ${Math.round(fontSize * 0.7)}px; fill: #1a1a1a; text-anchor: middle; }
    .jianpu-dot { font-family: "Times New Roman", "Noto Serif", serif; font-size: ${Math.round(fontSize * 0.55)}px; fill: #1a1a1a; text-anchor: middle; }
    .jianpu-chord { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 13px; fill: #2563eb; text-anchor: middle; font-weight: 500; }
    .jianpu-header { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 14px; fill: #555555; }
    .jianpu-barline { stroke: #333333; stroke-width: 1.2; }
    .jianpu-underline { stroke: #1a1a1a; stroke-width: 1.5; stroke-linecap: round; }
    .jianpu-dash { font-family: "Times New Roman", serif; font-size: ${fontSize}px; fill: #999999; text-anchor: middle; dominant-baseline: central; }
  </style>`);

  // Header: key signature on left, tempo on right
  svgParts.push(
    `<text x="${marginLeft}" y="${marginTop - 24}" class="jianpu-header">${escapeXml(keySignature)}</text>`
  );
  svgParts.push(
    `<text x="${pageWidth - marginRight}" y="${marginTop - 24}" class="jianpu-header" text-anchor="end">\u2669=${tempo}</text>`
  );

  // Render each line
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineMeasures = lines[lineIdx];
    const lineY = marginTop + lineIdx * fullLineHeight + chordRowHeight;
    let xCursor = marginLeft;

    for (let mIdx = 0; mIdx < lineMeasures.length; mIdx++) {
      const measure = lineMeasures[mIdx];

      // Render each note in the measure
      for (let nIdx = 0; nIdx < measure.length; nIdx++) {
        const note = measure[nIdx];
        const noteX = xCursor + noteWidth / 2;
        const noteY = lineY + 30;

        // Chord symbol above
        if (opts.showChords && chords) {
          const chord = findChordAtTime(chords, note.startTime);
          if (chord && (nIdx === 0 || !isSameChord(chords, measure, nIdx))) {
            svgParts.push(
              `<text x="${noteX}" y="${lineY - 2}" class="jianpu-chord">${escapeXml(chord.label)}</text>`
            );
          }
        }

        if (note.degree === 0) {
          // Rest
          svgParts.push(
            `<text x="${noteX}" y="${noteY}" class="jianpu-note">0</text>`
          );
        } else {
          // Accidental
          const accStr = note.accidental === "#" ? "#" : note.accidental === "b" ? "b" : "";
          if (accStr) {
            svgParts.push(
              `<text x="${noteX - fontSize * 0.42}" y="${noteY - fontSize * 0.22}" class="jianpu-note-accent">${accStr}</text>`
            );
          }

          // Note number
          svgParts.push(
            `<text x="${noteX}" y="${noteY}" class="jianpu-note">${note.degree}</text>`
          );

          // Octave dots
          if (note.octave > 0) {
            for (let d = 0; d < note.octave; d++) {
              svgParts.push(
                `<text x="${noteX}" y="${noteY - fontSize * 0.6 - d * 7}" class="jianpu-dot">\u00B7</text>`
              );
            }
          } else if (note.octave < 0) {
            for (let d = 0; d < -note.octave; d++) {
              svgParts.push(
                `<text x="${noteX}" y="${noteY + fontSize * 0.55 + d * 7}" class="jianpu-dot">\u00B7</text>`
              );
            }
          }
        }

        // Duration underlines for eighth and sixteenth notes
        if (note.duration === 0.5) {
          const uy = noteY + fontSize * 0.45;
          svgParts.push(
            `<line x1="${xCursor + 4}" y1="${uy}" x2="${xCursor + noteWidth - 4}" y2="${uy}" class="jianpu-underline"/>`
          );
        } else if (note.duration === 0.25) {
          const uy1 = noteY + fontSize * 0.45;
          const uy2 = uy1 + 5;
          svgParts.push(
            `<line x1="${xCursor + 4}" y1="${uy1}" x2="${xCursor + noteWidth - 4}" y2="${uy1}" class="jianpu-underline"/>`
          );
          svgParts.push(
            `<line x1="${xCursor + 4}" y1="${uy2}" x2="${xCursor + noteWidth - 4}" y2="${uy2}" class="jianpu-underline"/>`
          );
        }

        // Duration dash for half/whole notes (additional beats)
        if (note.duration === 2) {
          svgParts.push(
            `<text x="${xCursor + noteWidth + noteWidth / 2}" y="${noteY}" class="jianpu-dash">\u2013</text>`
          );
          xCursor += noteWidth; // extra space for the dash
        } else if (note.duration === 4) {
          for (let dd = 0; dd < 3; dd++) {
            svgParts.push(
              `<text x="${xCursor + noteWidth + noteWidth / 2 + dd * noteWidth}" y="${noteY}" class="jianpu-dash">\u2013</text>`
            );
          }
          xCursor += noteWidth * 3; // extra space for dashes
        }

        xCursor += noteWidth;
      }

      // Bar line after each measure (except the last one on the line for cleanliness)
      if (mIdx < lineMeasures.length - 1) {
        svgParts.push(
          `<line x1="${xCursor + 4}" y1="${lineY + 10}" x2="${xCursor + 4}" y2="${lineY + 50}" class="jianpu-barline"/>`
        );
        xCursor += 12;
      }
    }

    // End-of-line barline (thin)
    svgParts.push(
      `<line x1="${xCursor + 4}" y1="${lineY + 10}" x2="${xCursor + 4}" y2="${lineY + 50}" class="jianpu-barline"/>`
    );
  }

  svgParts.push("</svg>");
  return svgParts.join("\n");
}

/**
 * Group notes into measures based on beat count.
 */
function groupIntoMeasures(
  notes: JianpuNote[],
  beatsPerMeasure: number
): JianpuNote[][] {
  const measures: JianpuNote[][] = [];
  let current: JianpuNote[] = [];
  let beatCount = 0;

  for (const note of notes) {
    // Duration contribution to the measure
    const noteDur = Math.min(note.duration, beatsPerMeasure);

    if (beatCount + noteDur > beatsPerMeasure + 0.01) {
      // Start a new measure
      if (current.length > 0) {
        measures.push(current);
      }
      current = [note];
      beatCount = noteDur;
    } else {
      current.push(note);
      beatCount += noteDur;

      // If we've reached the measure boundary exactly
      if (Math.abs(beatCount - beatsPerMeasure) < 0.01) {
        measures.push(current);
        current = [];
        beatCount = 0;
      }
    }
  }

  if (current.length > 0) {
    measures.push(current);
  }

  return measures;
}

/**
 * Find the chord active at a given time.
 */
function findChordAtTime(
  chords: ChordEvent[],
  time: number
): ChordEvent | null {
  for (const chord of chords) {
    if (time >= chord.time && time < chord.endTime) {
      return chord;
    }
  }
  return null;
}

/**
 * Check if the current note has the same chord as the previous note.
 */
function isSameChord(
  chords: ChordEvent[],
  measure: JianpuNote[],
  noteIndex: number
): boolean {
  if (noteIndex === 0) return false;
  const prevChord = findChordAtTime(chords, measure[noteIndex - 1].startTime);
  const currChord = findChordAtTime(chords, measure[noteIndex].startTime);
  if (!prevChord || !currChord) return false;
  return prevChord.label === currChord.label;
}

/**
 * Escape XML special characters.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
