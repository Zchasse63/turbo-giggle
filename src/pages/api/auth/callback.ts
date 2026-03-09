import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const prerender = false;

/**
 * OAuth / Magic Link callback handler.
 * Supabase redirects here after email confirmation or magic link click.
 */
export const GET: APIRoute = async ({ url, cookies, request, redirect }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createSupabaseServerClient(cookies, request.headers);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirect(next);
    }
  }

  // If no code or error, redirect to login
  return redirect('/login?error=callback_failed');
};
