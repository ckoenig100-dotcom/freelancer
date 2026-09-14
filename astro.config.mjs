// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  base: '/freelancer/',
  integrations: [tailwind()],
  security: {
    // Hinter nginx (X-Forwarded-*) - noetig, damit Astros CSRF-Origin-Check
    // (POST-Formulare im Admin-Bereich) die echte Domain statt "localhost" sieht.
    allowedDomains: [
      { hostname: 'agentic-code.at', protocol: 'https' },
      { hostname: 'www.agentic-code.at', protocol: 'https' },
    ],
  },
});
