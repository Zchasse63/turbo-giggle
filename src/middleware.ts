import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase';

/**
 * Auth middleware — protects /dashboard/* and /admin/* routes.
 * Redirects unauthenticated users to /login.
 * Admin routes also require manager or admin role.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Only protect dashboard and admin routes
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  if (!isProtected) {
    return next();
  }

  // Create server-side Supabase client with cookies
  const supabase = createSupabaseServerClient(
    context.cookies,
    context.request.headers
  );

  // Check for authenticated session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(pathname);
    return context.redirect(`/login?redirect=${returnUrl}`);
  }

  // Fetch profile for role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, full_name')
    .eq('id', user.id)
    .single();

  // If no profile or inactive, redirect to login
  if (!profile || !profile.is_active) {
    return context.redirect('/login?error=inactive');
  }

  // Admin routes require manager or admin role
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) {
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return context.redirect('/dashboard?error=unauthorized');
    }
  }

  // Store user info in locals for downstream pages
  context.locals.user = user;
  context.locals.profile = profile;

  return next();
});
