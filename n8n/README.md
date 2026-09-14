# n8n-Workflow: Angebots-Pipeline

`workflow-angebotspipeline.json` importieren unter n8n → Workflows →
Import from File. (Live-Instanz: bereits importiert und aktiv unter
`https://n8n.agentic-code.at`, Workflow-ID `s08qoyvWGbTPvQcK`.)

## Ablauf

1. **Webhook** (`POST /webhook/anfrage`) empfängt die Formulardaten vom
   Kontaktformular und antwortet sofort (damit der 3-Tage-Wait im
   Hintergrund laufen kann, ohne den Browser-Request offen zu halten).
1a. **Referenzseite (optional)**: Statt Text oder PDF kann eine URL
    angegeben werden (Formularfeld `referenzseite`). Ablauf:
    `Code - Referenzseite validieren` (SSRF-Basisschutz: nur http/https,
    keine localhost/private IPs, kein Fetch falls PDF vorhanden) →
    `IF - Referenzseite sicher abrufbar?` → `HTTP Request` holt die Seite
    (Text-Format, 15s Timeout, Fehler brechen die Anfrage nicht ab) →
    `IF - Abruf erfolgreich?` → Claude fasst den Seiteninhalt in einer
    managementtauglichen Projektbeschreibung (max. 500 Wörter, Fließtext)
    zusammen → `Code - Projektbeschreibung finalisieren` (universeller
    Konvergenzpunkt für Text-/PDF-/Referenzseite-Fälle) setzt das
    Ergebnis als `projektbeschreibung` für den Rest der Pipeline ein.
2. **IF**: qualifiziert, wenn Budget != "< 1.000 EUR" ODER
   Projektbeschreibung > 200 Zeichen ODER ein PDF hochgeladen wurde
   (siehe CLAUDE.md Qualifizierungs-Regeln).
   - FALSE → freundliche Absage-Mail mit Link zu Standard-Paketen.
3. **Code**: baut den Request-Body für Claude. Wurde ein PDF
   hochgeladen (Formularfeld `pdf`), wird es als Base64 gelesen und als
   `document`-Content-Block mitgeschickt (Claude liest das PDF direkt,
   keine eigene Text-Extraktion nötig); sonst wird die getippte
   Projektbeschreibung als Text verwendet.
4. **Claude API**: generiert Zusammenfassung, Leistungspunkte, Zeitplan
   und Preisspanne als striktes JSON.
5. **Code**: baut daraus die finale Angebots-HTML-Vorlage.
6. **HTTP Request**: schickt das HTML als Datei `index.html`
   (multipart/form-data, Feld `files`) an Gotenberg und erhält die
   PDF-Binärdatei zurück.
7. **Code**: baut aus dem Angebotsinhalt zusätzlich eine `CLAUDE.md`
   (Markdown) und behält das bereits konvertierte PDF als zweites
   Binary bei.
7a. **SMTP**: verschickt das Angebot mit PDF-Anhang direkt an den
    Kunden.
7b. **SMTP**: verschickt parallel (nicht sequenziell verkettet — der
    `emailSend`-Node gibt in seinem Output nur `{ json: info }` zurück
    und verwirft dabei jegliches Binary, eine Verkettung würde also den
    Anhang der zweiten Mail verlieren) eine interne Kopie an
    `chris@agentic-code.at` mit PDF **und** `CLAUDE.md` im Anhang, damit
    jedes rausgegangene Angebot inhaltlich mitgelesen werden kann. Nur
    dieser Zweig führt weiter zu Supabase (nicht beide, sonst würde der
    Insert doppelt ausgeführt).
8. **Supabase (Postgres)**: speichert Anfrage + Status **und den
   generierten Angebotsinhalt** (Zusammenfassung, Leistungen, Zeitplan,
   Preisspanne) im CRM — damit nachvollziehbar bleibt, woran man sich
   die 14 Tage Gültigkeit gebunden hat.
9. **Wait**: 3 Tage → **SMTP**: Follow-up-Mail ("Kurze Nachfrage — gibt es offene Fragen?").
10. **Wait**: 7 weitere Tage (Tag 10) → **SMTP**: Follow-up-Mail ("Dein Angebot läuft in 4 Tagen ab")
    → **Supabase**: `tag10_erinnerung_gesendet = true` setzen (Sichtbarkeit im Admin-Bereich).
11. **Wait**: 4 weitere Tage (Tag 14) → **Supabase**: aktuellen Status abfragen
    → **IF**: nur falls Status noch `qualifiziert - Angebot gesendet` ist
    → **Supabase**: Status auf `Abgelaufen` setzen (kein weiterer Kontakt).

Der Admin-Bereich (`/admin` der Astro-Seite) erlaubt außerdem, ein Angebot
manuell als `Angenommen` oder `Abgelehnt` zu markieren, sobald der Kunde
reagiert hat — unabhängig vom automatischen Follow-up. Die Tag-14-Node
prüft davor den aktuellen Status und überschreibt eine bereits manuell
gesetzte Entscheidung nicht mehr mit `Abgelaufen`.

## Vorbedingung: Supabase-Tabelle anlegen

Einmalig im Supabase SQL-Editor ausführen:

```sql
create table public.angebot_anfragen (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  firma text,
  budget text not null,
  projektbeschreibung text not null,
  starttermin date,
  quelle text,
  status text not null default 'neu',
  angebotsnummer text,
  datum text,
  angebot_summary text,
  angebot_leistungen text,
  angebot_zeitplan text,
  angebot_preisspanne text,
  tag10_erinnerung_gesendet boolean not null default false,
  created_at timestamptz not null default now()
);
```

Falls die Tabelle schon ohne die `angebot_*`-Spalten existiert, stattdessen:

```sql
alter table public.angebot_anfragen
  add column angebot_summary text,
  add column angebot_leistungen text,
  add column angebot_zeitplan text,
  add column angebot_preisspanne text,
  add column tag10_erinnerung_gesendet boolean not null default false;
```

## Benötigte Credentials (in n8n anlegen)

| Credential | Typ | Verwendung |
| --- | --- | --- |
| Anthropic API Key | Header Auth (`x-api-key: <dein Claude API Key>`) | Claude-API-Node |
| SMTP Account | SMTP | alle vier E-Mail-Nodes |
| Supabase Postgres | Postgres | CRM-Nodes (Insert + Update in `public.angebot_anfragen`) |

Auf der Live-Instanz sind Anthropic-, SMTP- und Supabase-Credential
bereits vorhanden und im Workflow verknüpft (wiederverwendet aus dem
Social-Media-Content-Maschine-Projekt).

## Benötigte Umgebungsvariablen (in n8n, z.B. via Docker-Compose `environment:`)

| Variable | Beschreibung | Status auf Live-Instanz |
| --- | --- | --- |
| `PDF_SERVICE_URL` | Endpoint des Gotenberg-Containers, Chromium-HTML-Route (`http://gotenberg:3000/forms/chromium/convert/html`). | ✅ bereits gesetzt |
| `SMTP_FROM_EMAIL` | Absenderadresse für alle drei E-Mails. | ✅ bereits gesetzt (`no-reply@agentic-code.at`) |
| `STANDARD_PAKETE_URL` | Link zur Seite mit den Standard-Paketen (Absage-Mail). | Gibt es noch nicht — Absage-Mail verweist bis dahin nur auf direkte Kontaktaufnahme statt auf einen Link. |

## Bekannte Anpassungspunkte nach dem Import

- **Angebotsnummer**: wird aktuell als `AN-JJJJMMTT-XXXX` (Datum +
  Zufallszahl) generiert, nicht als fortlaufende Nummer. Für eine
  echte fortlaufende Nummerierung müsste vor der PDF-Erstellung ein
  Datenbank-Lookup des letzten Standes eingebaut werden.
- **Firmenname/Kontaktdaten** im PDF-Header sind im Code-Node
  (`FIRMA_NAME`, `FIRMA_KONTAKT`) hart hinterlegt — bereits angepasst:
  `Agentic-Code e.U.` / `chris@agentic-code.at - +43 678 1255 005`.
- **Claude-Modell**: aktuell `claude-sonnet-5`. Bei Bedarf im
  `jsonBody` der Claude-Node anpassen.
- **SSRF-Schutz bei der Referenzseite** ist nur eine Basisabsicherung
  (blockt offensichtliche private/interne Hostnamen). Eine URL, deren
  Hostname erst zur Anfragezeit per DNS auf eine private IP auflöst,
  wird davon nicht erkannt — für vollen Schutz müsste die IP nach dem
  DNS-Lookup geprüft werden, nicht nur der Hostname-String.
- **Achtung bei eigenen Code-Nodes:** n8ns Code-Node-Sandbox stellt die
  globale `URL`-Klasse **nicht** bereit (`new URL(...)` wirft
  `ReferenceError: URL is not defined`). URLs müssen per Regex geparst
  werden (siehe `Code - Referenzseite validieren`), nicht per `new URL()`.
  Komplexe mehrzeilige IIFE-Ausdrücke direkt in IF-Node-Bedingungen
  (`{{ (() => {...})() }}`) haben sich zudem als unzuverlässig erwiesen
  (lieferten inkonsistente Ergebnisse) — solche Logik gehört in einen
  Code-Node, der Node fuellt dann nur ein einfaches Boolean-Feld, das
  die IF-Node abfragt.
- **`n8n-nodes-base.emailSend` verwirft im Output jegliches Binary** —
  der Node gibt nur `{ json: info }` (das SMTP-Sendeergebnis) zurück,
  nicht die Eingabedaten. Zwei E-Mails mit Anhang direkt hintereinander
  zu verketten (Mail 1 → Mail 2) verliert dadurch den Anhang bei Mail 2.
  Beide Mail-Nodes müssen stattdessen parallel vom selben Code-Node
  abzweigen, der die Binaries bereithält (siehe `Code - CLAUDE.md
  erstellen` → `SMTP - Angebot senden` + `SMTP - Interne Kopie
  senden`).
- Alle Nodes, die auf Formulardaten zugreifen (`Code - Claude Request
  vorbereiten`, `Code - HTML-Vorlage erstellen`), referenzieren
  `$('Code - Projektbeschreibung finalisieren')` statt direkt den
  Webhook-Node — dort läuft die evtl. aus PDF/Referenzseite aggregierte
  Beschreibung zusammen. Bei weiteren Nodes, die Formulardaten brauchen,
  denselben Node referenzieren, nicht den rohen Webhook.
