def detect_tempo(audio_path) -> dict:
    """Detect tempo and beat positions using Essentia."""
    import essentia.standard as es

    audio = es.MonoLoader(filename=str(audio_path), sampleRate=44100)()

    rhythm_extractor = es.RhythmExtractor2013()
    bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)

    return {
        "bpm": round(float(bpm), 1),
        "beatPositions": [round(float(b), 3) for b in beats[:500]],  # Limit array size
        "confidence": round(float(beats_confidence), 3),
    }
