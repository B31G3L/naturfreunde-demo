# Naturfreunde Immenreute – Demo

Klickbare Entwürfe für die digitalen Vereinswerkzeuge der Naturfreunde Geislingen:

- **Internes Dashboard** – Login über die Naturfreunde-Cloud, Rollen aus Grundstufe und Tätigkeiten, Beiträge für Website/App/E-Mail, Termine, Kasse (lesend), Engagement
- **News-App** – als installierbare Web-App gedacht: News, Termine, Anmeldung, „Mein Einsatz“
- **Tablet im Hausdienst** – Rechenhilfe neben der offenen Ladenkasse: zählen, Bestand prüfen, Bestellung pro Gast, Anschreiben, Tagesabschluss
- **Öffentliche Website** – Startseite (Desktop und Handy), Veranstaltungen mit Anmeldung, News, Mitglied werden

**Alle Namen, Zahlen und Preise sind Beispieldaten.** Nichts ist an echte Systeme angebunden.

## Ansehen

Über GitHub Pages: Startseite `index.html` → Bereich wählen. Unten rechts führt jede Seite zurück zur Übersicht.

## Technik

Reine HTML-Dateien. `support.js` ist eine kleine Laufzeit, die die Vorlagen (`{{platzhalter}}`, Bedingungen, Schleifen) rendert und die Klick-Logik jeder Seite ausführt. Kein Build, kein Server.

`build.py` übernimmt neue Stände der Entwürfe in diesen Ordner.
