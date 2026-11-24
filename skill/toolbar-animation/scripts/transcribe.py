#!/usr/bin/env python3
"""Transcribe una narración con tiempos por palabra (faster-whisper).

Uso:
    python3 transcribe.py audio/narracion.mp3 audio/transcript.json [--model small] [--lang es]

--model acepta un nombre ("small", "medium", "large-v3": se descarga de Hugging Face)
o la ruta a un modelo CTranslate2 ya descargado (útil sin acceso a internet).
Requiere: pip install faster-whisper numpy  ·  ffmpeg en el PATH.

Imprime los segmentos con tiempos y guarda un JSON:
[{ "t0":0.0, "t1":2.66, "text":"...", "words":[{"w":"¿Sabías","t0":0.0,"t1":0.4}, ...] }, ...]
"""
import argparse, json, subprocess, sys

import numpy as np
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("out")
ap.add_argument("--model", default="small")
ap.add_argument("--lang", default="es")
a = ap.parse_args()

# Decodificar con ffmpeg evita depender de la versión de PyAV
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.audio, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32)

model = WhisperModel(a.model, device="cpu", compute_type="int8")
segs, _ = model.transcribe(audio, language=a.lang, word_timestamps=True)
out = []
for s in segs:
    words = [{"w": w.word.strip(), "t0": round(w.start, 2), "t1": round(w.end, 2)} for w in s.words]
    out.append({"t0": round(s.start, 2), "t1": round(s.end, 2), "text": s.text.strip(), "words": words})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}")
json.dump(out, open(a.out, "w"), ensure_ascii=False, indent=1)
print(f"\n{len(out)} segmentos → {a.out}", file=sys.stderr)
