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
  created_at: string;
}

export async function fetchAngebote(): Promise<AngebotAnfrage[]> {
  const url = `${import.meta.env.SUPABASE_URL}/rest/v1/angebot_anfragen?select=*&order=created_at.desc`;
  const response = await fetch(url, {
    headers: {
      apikey: import.meta.env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${import.meta.env.SUPABASE_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase-Abfrage fehlgeschlagen: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as AngebotAnfrage[];
}
