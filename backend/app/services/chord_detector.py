def detect_chords(audio_path) -> list[dict]:
    """Detect chords using madmom's deep chroma processor."""
    from madmom.features.chords import DeepChromaChordRecognitionProcessor
    from madmom.audio.chroma import DeepChromaProcessor

    dcp = DeepChromaProcessor()
    chroma = dcp(str(audio_path))

    decode = DeepChromaChordRecognitionProcessor()
    chords = decode(chroma)

    result = []
    for start, end, label in chords:
        if label == "N":  # Skip "no chord"
            continue
        result.append({
            "start": round(float(start), 3),
            "end": round(float(end), 3),
            "label": label,
        })

    return result
