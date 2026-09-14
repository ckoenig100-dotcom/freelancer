export interface AngebotAnfrage {
  id: string;
  name: string;
  email: string;
  firma: string | null;
  budget: string;
  projektbeschreibung: string;
  starttermin: string | null;
  quelle: string | null;
  status: string;
  angebotsnummer: string | null;
  datum: string | null;
  angebot_summary: string | null;
  angebot_leistungen: string | null;
  angebot_zeitplan: string | null;
  angebot_preisspanne: string | null;
  tag10_erinnerung_gesendet: boolean;
  created_at: string;
}

function supabaseHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: import.meta.env.SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${import.meta.env.SUPABASE_SECRET_KEY}`,
    ...extra,
  };
}

export async function fetchAngebote(): Promise<AngebotAnfrage[]> {
  const url = `${import.meta.env.SUPABASE_URL}/rest/v1/angebot_anfragen?select=*&order=created_at.desc`;
  const response = await fetch(url, { headers: supabaseHeaders() });

  if (!response.ok) {
    throw new Error(`Supabase-Abfrage fehlgeschlagen: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as AngebotAnfrage[];
}

export const ENTSCHEIDBARE_STATUS = ['Angenommen', 'Abgelehnt'] as const;
export type EntscheidbarerStatus = (typeof ENTSCHEIDBARE_STATUS)[number];

export async function updateAngebotStatus(id: string, status: EntscheidbarerStatus): Promise<void> {
  const url = `${import.meta.env.SUPABASE_URL}/rest/v1/angebot_anfragen?id=eq.${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: supabaseHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Supabase-Update fehlgeschlagen: ${response.status} ${await response.text()}`);
  }
}
