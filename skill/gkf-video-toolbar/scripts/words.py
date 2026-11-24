#!/usr/bin/env python3
"""Lista las palabras con su segundo de inicio, para elegir anclas del guion.

Uso:
    python3 words.py audio/transcript.json [desde] [hasta]
    python3 words.py audio/transcript.json 0 20
"""
import json, sys

path = sys.argv[1]
t_from = float(sys.argv[2]) if len(sys.argv) > 2 else 0
t_to = float(sys.argv[3]) if len(sys.argv) > 3 else 1e9
for s in json.load(open(path)):
    if s["t1"] < t_from or s["t0"] > t_to:
        continue
    print(f"[{s['t0']:6.2f}-{s['t1']:6.2f}] " + " ".join(f"{w['w']}@{w['t0']}" for w in s["words"]))
