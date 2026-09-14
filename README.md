# Angebots-Pipeline – Kontaktformular

Astro 5 + Tailwind CSS Seite mit Kontaktformular, das per POST an einen
n8n-Webhook sendet. Details zum Projekt siehe [CLAUDE.md](./CLAUDE.md).

## Setup

```sh
npm install
cp .env.example .env
# .env anpassen: PUBLIC_N8N_WEBHOOK_URL auf die eigene n8n-Webhook-URL setzen
npm run dev
```

Die Kontaktseite läuft dann unter `http://localhost:4321/kontakt`.

## Umgebungsvariablen

| Variable               | Beschreibung                                                                 |
| ----------------------- | ----------------------------------------------------------------------------- |
| `PUBLIC_N8N_WEBHOOK_URL` | Ziel-URL des n8n-Webhooks, an den das Formular per POST sendet.              |
| `SUPABASE_URL`           | Supabase-Projekt-URL, für den Admin-Bereich (`/admin`).                      |
| `SUPABASE_SECRET_KEY`    | Supabase Secret Key (voller Server-Zugriff) für den Admin-Bereich.           |
| `ADMIN_USERNAME`         | Benutzername für den HTTP-Basic-Auth-Login von `/admin`.                     |
| `ADMIN_PASSWORD`         | Passwort für den HTTP-Basic-Auth-Login von `/admin`.                         |

Alle Variablen werden von Vite **zur Build-Zeit** fest eingebacken (wie bei
`PUBLIC_N8N_WEBHOOK_URL` — der `PUBLIC_`-Prefix steuert nur, ob eine Variable
zusätzlich im Browser-Bundle sichtbar ist, nicht *wann* sie ersetzt wird).
Das heißt: Änderungen an `.env` erfordern `npm run build` + Service-Neustart,
nicht nur einen Neustart.

Da der Request direkt aus dem Browser gesendet wird, muss der n8n-Webhook
CORS-Requests von der Formular-Domain erlauben (z.B. über eine
"Respond to Webhook"-Node mit passenden Headern) oder produktiv über einen
eigenen Server-Proxy laufen.

## Deployment

Läuft produktiv unter **https://agentic-code.at/freelancer/**, nach dem
gleichen Muster wie die anderen Projekte auf diesem Server:

- `output: 'server'` + `@astrojs/node`-Adapter (Standalone-Modus), `base: '/freelancer/'`
- systemd-Service `freelancer.service` (Port 4324, `WorkingDirectory=/opt/angebots-pipeline-fuer_freelancer`)
- nginx-Location `/freelancer` in `/etc/nginx/sites-available/agentic-code.at` proxied auf `127.0.0.1:4324`

Nach Code- **oder** `.env`-Änderungen: `npm run build` und
`systemctl restart freelancer.service`. Kein `EnvironmentFile` im
systemd-Service — alle Variablen werden beim Build eingebacken (siehe
oben), der laufende Prozess liest zur Laufzeit nichts aus `.env`.
`N8N_API_URL`/`N8N_API_KEY` in `.env` sind nur für administrative
CLI-Aufrufe gegen n8n gedacht (siehe unten) und werden von keinem
Astro-Code referenziert — sie landen dadurch nie im Build-Output.

**Wichtig hinter nginx:** `astro.config.mjs` setzt `security.allowedDomains`
auf `agentic-code.at`/`www.agentic-code.at`. Ohne das vertraut Astro den
`X-Forwarded-*`-Headern von nginx nicht (Schutz gegen Host-Header-Spoofing)
und hält jede Anfrage für "localhost" — dadurch blockiert Astros
eingebauter CSRF-Schutz (`security.checkOrigin`) jedes POST-Formular im
Admin-Bereich mit 403. Bei einer neuen Domain diese Liste anpassen.

## Projektstruktur

```text
/
├── src/
│   ├── layouts/Layout.astro         # Dunkler Header, heller Body
│   ├── components/ContactForm.astro # Formular + Client-Validierung + Submit
│   ├── components/TestimonialsPanel.astro # Testimonial-Slider + Trust-Elemente
│   ├── lib/supabase.ts               # Supabase REST-API-Client (server-only)
│   ├── middleware.ts                 # HTTP-Basic-Auth für /admin
│   └── pages/
│       ├── index.astro
│       ├── kontakt.astro            # Kontaktformular-Seite
│       ├── danke.astro              # Erfolgsseite nach Absenden
│       └── admin/
│           ├── index.astro          # Übersicht aller Angebote (passwortgeschützt)
│           └── api/status.ts        # POST-Endpoint: Angebot als Angenommen/Abgelehnt markieren
└── .env.example
```

## 🧞 Commands

| Command           | Action                                       |
| ------------------ | --------------------------------------------- |
| `npm install`      | Installiert Dependencies                     |
| `npm run dev`       | Startet den Dev-Server unter `localhost:4321` |
| `npm run build`     | Baut die Seite nach `./dist/`                |
| `npm run preview`   | Preview des Builds                           |
