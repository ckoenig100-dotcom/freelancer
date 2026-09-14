import type { APIRoute } from 'astro';
import { ENTSCHEIDBARE_STATUS, updateAngebotStatus } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const id = String(form.get('id') || '');
  const status = String(form.get('status') || '');

  if (id && (ENTSCHEIDBARE_STATUS as readonly string[]).includes(status)) {
    await updateAngebotStatus(id, status as (typeof ENTSCHEIDBARE_STATUS)[number]);
  }

  return redirect(`${import.meta.env.BASE_URL}admin`);
};
