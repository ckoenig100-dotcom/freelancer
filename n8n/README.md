# n8n-Workflow: Angebots-Pipeline

`workflow-angebotspipeline.json` importieren unter n8n → Workflows →
Import from File. (Live-Instanz: bereits importiert und aktiv unter
`https://n8n.agentic-code.at`, Workflow-ID `s08qoyvWGbTPvQcK`.)

## Ablauf

1. **Webhook** (`POST /webhook/anfrage`) empfängt die Formulardaten vom
   Kontaktformular und antwortet sofort (damit der 3-Tage-Wait im
   Hintergrund laufen kann, ohne den Browser-Request offen zu halten).
2. **IF**: qualifiziert, wenn Budget != "< 1.000 EUR" ODER
   Projektbeschreibung > 200 Zeichen (siehe CLAUDE.md Qualifizierungs-Regeln).
   - FALSE → freundliche Absage-Mail mit Link zu Standard-Paketen.
3. **Claude API**: generiert Zusammenfassung, Leistungspunkte, Zeitplan
   und Preisspanne als striktes JSON.
4. **Code**: baut daraus die finale Angebots-HTML-Vorlage.
5. **HTTP Request**: schickt das HTML als Datei `index.html`
   (multipart/form-data, Feld `files`) an Gotenberg und erhält die
   PDF-Binärdatei zurück.
6. **SMTP**: verschickt das Angebot mit PDF-Anhang.
7. **Supabase (Postgres)**: speichert Anfrage + Status im CRM.
8. **Wait**: 3 Tage.
9. **SMTP**: Follow-up-Mail ("Kurze Nachfrage").

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
  created_at timestamptz not null default now()
);
```

## Benötigte Credentials (in n8n anlegen)

| Credential | Typ | Verwendung |
| --- | --- | --- |
| Anthropic API Key | Header Auth (`x-api-key: <dein Claude API Key>`) | Claude-API-Node |
| SMTP Account | SMTP | alle drei E-Mail-Nodes |
| Supabase Postgres | Postgres | CRM-Node (Insert in `public.angebot_anfragen`) |

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
  (`FIRMA_NAME`, `FIRMA_KONTAKT`) hart hinterlegt — bitte anpassen.
- **Claude-Modell**: aktuell `claude-sonnet-4-20250514`. Bei Bedarf im
  `jsonBody` der Claude-Node anpassen.
