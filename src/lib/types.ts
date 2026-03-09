/**
 * The Sauna Guys — Shared TypeScript types
 * Matches Supabase schema from PRD v2.3
 */

// ── Locations ──
export interface Location {
  id: string;
  name: string;
  slug: string;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  glowfox_location_id: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

// ── Members ──
export type MemberStatus = 'Active' | 'At Risk' | 'Churned' | 'Reactivated';

export interface Member {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  source: string | null;
  membership_name: string | null;
  membership_plan: string | null;
  membership_expiry: string | null;
  credits_remaining: number;
  total_bookings: number;
  total_attendances: number;
  last_booking: string | null;
  last_contacted: string | null;
  email_consent: boolean;
  sms_consent: boolean;
  studio_waiver: boolean;
  current_tier: string | null;
  current_tier_number: number | null;
  current_tier_sub: string | null;
  is_reactivated: boolean;
  reactivated_at: string | null;
  estimated_ltv: number;
  notes: string | null;
  location_id: string | null;
  added_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Derive display status from tier number + reactivation flag.
 * Matches DESIGN-GUIDE §14.5 Display Status derivation.
 */
export function getMemberStatus(member: Pick<Member, 'current_tier_number' | 'is_reactivated'>): MemberStatus {
  if (member.is_reactivated) return 'Reactivated';
  const tier = member.current_tier_number;
  if (tier === null || tier === undefined) return 'Churned';
  if (tier <= 1) return 'Active';       // Tiers 0, 0B, 1, 1B
  if (tier <= 5) return 'At Risk';      // Tiers 2, 3, 4, 5
  return 'Churned';                      // Tiers 6, 6B, 7A-7C, 8, 9
}

// ── Member Snapshots ──
export interface MemberSnapshot {
  id: string;
  member_id: string;
  week_number: number;
  import_id: string | null;
  tier: string | null;
  tier_number: number | null;
  credits_remaining: number | null;
  total_bookings: number | null;
  total_attendances: number | null;
  last_booking: string | null;
  membership_name: string | null;
  is_reactivation: boolean;
  snapshot_date: string;
}

// ── CSV Imports ──
export interface CsvImport {
  id: string;
  filename: string;
  file_path: string | null;
  week_number: number;
  total_rows: number;
  new_members: number;
  tier_changes: number;
  tier_upgrades: number;
  tier_downgrades: number;
  reactivations: number;
  location_id: string | null;
  imported_by: string;
  imported_at: string;
  notes: string | null;
}

// ── Pricing Plans ──
export interface PricingPlan {
  id: string;
  name: string;
  display_name: string | null;
  category: 'sampler' | 'drop_in' | 'membership' | 'class_pack' | 'gift_card';
  price_cents: number;
  credits: number | null;
  is_recurring: boolean;
  billing_interval: 'month' | 'year' | null;
  price_per_credit: number | null;
  is_trial: boolean;
  is_active: boolean;
  location_id: string | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

// ── Email Templates ──
export interface EmailTemplate {
  id: string;
  name: string;
  subject_template: string;
  body_template: string;
  target_tiers: number[] | null;
  is_default: boolean;
  created_by: string | null;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Activity Log ──
export type ActivityEventType =
  | 'csv_import'
  | 'tier_change'
  | 'campaign_sent'
  | 'campaign_drafted'
  | 'member_reactivation'
  | 'member_added'
  | 'email_sent'
  | 'email_drafted'
  | 'system';

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error';

export interface ActivityLogEntry {
  id: string;
  event_type: ActivityEventType;
  title: string;
  description: string | null;
  severity: ActivitySeverity;
  metadata: Record<string, unknown> | null;
  location_id: string | null;
  created_by: string | null;
  created_at: string;
}

// ── Leads ──
export interface Lead {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  lead_magnet: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  location_id: string | null;
  captured_at: string;
  exported_to_glowfox: boolean;
  exported_at: string | null;
}

// ── Campaigns ──
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  target_tiers: number[] | null;
  channel: string | null;
  template_id: string | null;
  draft_count: number;
  sent_count: number;
  start_date: string | null;
  end_date: string | null;
  location_id: string | null;
  notes: string | null;
  created_at: string;
}

// ── Campaign Members ──
export interface CampaignMember {
  id: string;
  campaign_id: string;
  member_id: string;
  tier_at_send: string | null;
  responded: boolean;
  converted: boolean;
  notes: string | null;
}

// ── Profiles (employee dashboard) ──
export type UserRole = 'employee' | 'manager' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  location_id: string | null;
  phone: string | null;
  hire_date: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Hour Logs (employee dashboard) ──
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface HourLog {
  id: string;
  employee_id: string;
  location_id: string | null;
  shift_date: string;
  hours_worked: number | null;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number;
  notes: string | null;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

// ── Formatting helpers ──
export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCentsDetailed(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Status → badge color from DESIGN-GUIDE §14.3 */
export const STATUS_COLORS: Record<MemberStatus, string> = {
  Active: '#2BBCCD',
  'At Risk': '#e67e22',
  Churned: '#e74c3c',
  Reactivated: '#E8A838',
};

/** Tier number → chart color from DESIGN-GUIDE §14.5 */
export const TIER_COLORS: Record<number, string> = {
  0: '#2BBCCD',
  1: '#E8A838',
  2: '#E8A838',
  3: '#e67e22',
  4: '#e67e22',
  5: '#e67e22',
  6: '#e74c3c',
  7: '#e74c3c',
  8: '#e74c3c',
  9: '#e74c3c',
};
