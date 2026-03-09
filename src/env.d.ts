/// <reference path="../.astro/types.d.ts" />

import type { User } from '@supabase/supabase-js';

declare namespace App {
  interface Locals {
    user: User;
    profile: {
      role: 'employee' | 'manager' | 'admin';
      is_active: boolean;
      full_name: string | null;
      phone?: string | null;
    };
  }
}
