  # Angebots-Pipeline

## Projektbeschreibung
Automatische Angebotserstellung für Freelancer/Agenturen.
Anfrage → Qualifizierung → KI-Angebot → PDF → E-Mail → Follow-up.

## Tech-Stack
- Astro 5 + Tailwind CSS (Kontaktformular)
- n8n (komplette Automatisierung)
- Claude API (Angebotstext generieren)
- Puppeteer/pdf-lib (PDF-Erstellung in n8n)
- Supabase/Postgres (CRM)
- SMTP (E-Mail-Versand)

## Formular-Felder
- Name (required)
- E-Mail (required, validiert)
- Firma (optional)
- Projektbeschreibung (Freitext, min. 50 Zeichen, ODER alternativ PDF-Upload
  der Projektbeschreibung, max. 10 MB — eines von beiden required)
- Geschätztes Budget (Dropdown: < 1.000 EUR, 1.000–5.000 EUR,
  5.000–10.000 EUR, > 10.000 EUR)
- Gewünschter Starttermin (Datepicker)
- Wie auf uns aufmerksam geworden? (Dropdown)

## Qualifizierungs-Regeln
- Budget >= 1.000 EUR → qualifiziert
- Budget < 1.000 EUR UND Beschreibung > 200 Zeichen → qualifiziert
- Budget < 1.000 EUR UND Beschreibung < 200 Zeichen → nicht qualifiziert

## Angebotsvorlage (HTML → PDF)
- Header: Logo + Firmenname + Kontaktdaten
- Datum + Angebotsnummer (fortlaufend)
- Anrede mit Name des Anfragenden
- Zusammenfassung der Anfrage (2–3 Sätze)
- Leistungsbeschreibung (3–5 Punkte, von Claude API generiert)
- Zeitplan (geschätzt basierend auf Projektumfang)
- Preis (Bereich basierend auf Budget-Angabe, z.B. "4.200–5.800 EUR")
- Zahlungsbedingungen: 50% Anzahlung, 50% bei Abnahme
- Gültigkeitsdauer: 14 Tage
- Footer: Kontaktdaten + Signatur

## Follow-up-Sequenz
- Tag 3: "Kurze Nachfrage — gibt es offene Fragen?"
- Tag 10: "Ihr Angebot läuft in 4 Tagen ab"
- Tag 14: Status auf "Abgelaufen" setzen (kein weiterer Kontakt)

## Design (Kontaktformular-Seite)
- Professional, clean, vertrauensbildend
- Dunkler Header, heller Body
- Testimonial-Slider neben dem Formular
- "Antwortzeit: unter 24h" als Trust-Element

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Full documentation: https://docs.astro.build
