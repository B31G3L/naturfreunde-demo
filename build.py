#!/usr/bin/env python3
"""Kopiert die Entwürfe in den Demo-Ordner und macht sie browsertauglich.

Ersetzt <sc-if>/<sc-for> durch <template data-sc="…">, damit Schleifen auch
in Tabellen sauber geparst werden. Das Infrastruktur-Diagramm wird bewusst
nicht übernommen (Serverdetails gehören nicht in ein öffentliches Repo).
"""
import pathlib
import re
import sys

SRC = pathlib.Path(sys.argv[1])
DST = pathlib.Path(__file__).resolve().parent
SKIP = {"Infrastruktur.dc.html"}

for f in sorted(SRC.glob("*.dc.html")):
    if f.name in SKIP:
        continue
    html = f.read_text(encoding="utf-8")
    html = re.sub(r"<sc-(if|for)\b", r'<template data-sc="\1"', html)
    html = re.sub(r"</sc-(if|for)>", "</template>", html)
    (DST / f.name).write_text(html, encoding="utf-8")
    print("übernommen:", f.name)
