import numpy as np


def detect_key(audio_path) -> dict:
    """Detect musical key using Essentia's KeyExtractor."""
    import essentia.standard as es

    audio = es.MonoLoader(filename=str(audio_path), sampleRate=44100)()

    key_extractor = es.KeyExtractor()
    key, scale, strength = key_extractor(audio)

    # Map key name to MIDI root note (C4 = 60)
    key_to_midi = {
        "C": 60, "C#": 61, "Db": 61, "D": 62, "D#": 63, "Eb": 63,
        "E": 64, "F": 65, "F#": 66, "Gb": 66, "G": 67, "G#": 68,
        "Ab": 68, "A": 69, "A#": 70, "Bb": 70, "B": 71,
    }

    return {
        "root": key,
        "scale": scale,
        "rootMidi": key_to_midi.get(key, 60),
        "confidence": round(float(strength), 3),
    }
