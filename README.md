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

| Variable                   | Beschreibung                                                          |
| --------------------------- | ---------------------------------------------------------------------- |
| `PUBLIC_N8N_WEBHOOK_URL`     | Ziel-URL des n8n-Webhooks, an den das Formular per POST sendet.       |

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

Nach Code-Änderungen: `npm run build` und `systemctl restart freelancer.service`.
`PUBLIC_N8N_WEBHOOK_URL` wird beim Build fest in den Client-Bundle
eingebacken — der laufende Node-Prozess braucht daher keine `.env`
(bewusst kein `EnvironmentFile` im Service, damit keine Secrets aus
einer eventuell erweiterten `.env` in den öffentlichen Prozess gelangen).

## Projektstruktur

```text
/
├── src/
│   ├── layouts/Layout.astro         # Dunkler Header, heller Body
│   ├── components/ContactForm.astro # Formular + Client-Validierung + Submit
│   ├── components/TestimonialsPanel.astro # Testimonial-Slider + Trust-Elemente
│   └── pages/
│       ├── index.astro
│       ├── kontakt.astro            # Kontaktformular-Seite
│       └── danke.astro              # Erfolgsseite nach Absenden
└── .env.example
```

## 🧞 Commands

| Command           | Action                                       |
| ------------------ | --------------------------------------------- |
| `npm install`      | Installiert Dependencies                     |
| `npm run dev`       | Startet den Dev-Server unter `localhost:4321` |
| `npm run build`     | Baut die Seite nach `./dist/`                |
| `npm run preview`   | Preview des Builds                           |
