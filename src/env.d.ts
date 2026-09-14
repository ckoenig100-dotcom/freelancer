/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_N8N_WEBHOOK_URL: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SECRET_KEY: string;
  readonly ADMIN_USERNAME: string;
  readonly ADMIN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
