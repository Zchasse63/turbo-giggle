import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  const supabase = createSupabaseServerClient(cookies, request.headers);
  await supabase.auth.signOut();
  return redirect('/login');
};
