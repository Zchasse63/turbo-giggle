import { useState, useRef, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { createClient } from '@supabase/supabase-js';

/* ---------- constants ---------- */

const TIER_COLORS: Record<number, string> = {
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

const STATUS_COLORS: Record<string, string> = {
  Active: '#2BBCCD',
  'At Risk': '#e67e22',
  Churned: '#e74c3c',
  Reactivated: '#E8A838',
};

const TIER_NAMES: Record<string, string> = {
  '0': 'Active',
  '0B': 'Recent Nurture',
  '1': 'Warm Wallet',
  '1B': 'Trial Credits',
  '2': 'Proven Buyer',
  '3': 'Moderate Buyer',
  '4': 'Trial Convert',
  '5': 'Credits Ice Cold',
  '6': 'Power User Dark',
  '6B': 'Moderate User Dark',
  '7A': 'Paid One-and-Done',
  '7B': 'Trial One-and-Done',
  '7C': 'Low Engagement',
  '8': 'No-Show',
  '9': 'Ghost Signup',
};

/* ---------- types ---------- */

interface MemberData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  current_tier: string | null;
  current_tier_number: number | null;
  current_tier_sub: string | null;
  is_reactivated: boolean;
  estimated_ltv: number;
  credits_remaining: number;
  total_bookings: number;
  total_attendances: number;
  last_booking: string | null;
  membership_name: string | null;
  added_at: string | null;
  notes: string | null;
  email_consent: boolean;
  sms_consent: boolean;
}

interface Snapshot {
  week_number: number;
  tier_number: number | null;
  total_attendances: number | null;
  snapshot_date: string;
}

interface Campaign {
  id: string;
  name: string;
  tier_at_send: string | null;
  created_at: string;
}

interface MemberProfileProps {
  member: MemberData;
  snapshots: Snapshot[];
  campaigns: Campaign[];
  supabaseUrl: string;
  supabaseKey: string;
}

/* ---------- helpers ---------- */

function getMemberStatus(member: MemberData): string {
  if (member.is_reactivated) return 'Reactivated';
  const tier = member.current_tier_number;
  if (tier === null || tier === undefined) return 'Churned';
  if (tier <= 1) return 'Active';
  if (tier <= 5) return 'At Risk';
  return 'Churned';
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(first: string | null, last: string | null): string {
  const f = first?.charAt(0)?.toUpperCase() || '';
  const l = last?.charAt(0)?.toUpperCase() || '';
  return f + l || '?';
}

function getFullName(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(' ') || 'Unknown';
}

function getTierKey(member: MemberData): string {
  if (member.current_tier_sub) {
    return `${member.current_tier_number}${member.current_tier_sub}`;
  }
  return String(member.current_tier_number ?? '');
}

function getTierLabel(member: MemberData): string {
  const key = getTierKey(member);
  return TIER_NAMES[key] || member.current_tier || 'Unknown';
}

/* ---------- tier history tooltip ---------- */

interface TierTooltipPayload {
  payload: {
    week_number: number;
    tier_number: number | null;
    total_attendances: number | null;
    snapshot_date: string;
  };
}

function TierTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TierTooltipPayload[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const tierNum = d.tier_number ?? 9;
  const tierName = TIER_NAMES[String(tierNum)] || 'Unknown';

  return (
    <div className="rounded-lg bg-white px-4 py-3 shadow-lg border border-gray-100">
      <p className="text-xs text-gray-400">Week {d.week_number}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">
        Tier {tierNum}: {tierName}
      </p>
      {d.total_attendances !== null && (
        <p className="text-xs text-gray-500">
          Visits: <span className="font-mono">{d.total_attendances}</span>
        </p>
      )}
      <p className="text-xs text-gray-400 mt-0.5">
        {formatDate(d.snapshot_date)}
      </p>
    </div>
  );
}

/* ---------- component ---------- */

export default function MemberProfile({
  member,
  snapshots,
  campaigns,
  supabaseUrl,
  supabaseKey,
}: MemberProfileProps) {
  const [notes, setNotes] = useState(member.notes || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = getMemberStatus(member);
  const statusColor = STATUS_COLORS[status] || '#9ca3af';
  const tierColor = TIER_COLORS[member.current_tier_number ?? 9] || '#9ca3af';

  const handleNotesBlur = useCallback(async () => {
    if (notes === (member.notes || '')) return;

    setSaveStatus('saving');
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase
        .from('members')
        .update({ notes })
        .eq('id', member.id);

      if (error) throw error;
      setSaveStatus('saved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [notes, member.id, member.notes, supabaseUrl, supabaseKey]);

  /* chart data: sorted by week, tier inverted for display */
  const chartData = [...snapshots]
    .sort((a, b) => a.week_number - b.week_number)
    .map((s) => ({
      ...s,
      display_tier: s.tier_number !== null ? 9 - s.tier_number : null,
    }));

  return (
    <div className="space-y-6">
      {/* ---------- 1. Profile Header ---------- */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #2BBCCD 0%, #1a3a5c 100%)',
            }}
          >
            {getInitials(member.first_name, member.last_name)}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {getFullName(member.first_name, member.last_name)}
              </h1>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${statusColor}18`,
                  color: statusColor,
                }}
              >
                {status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>{member.email}</span>
              {member.phone && <span>{member.phone}</span>}
            </div>

            {member.added_at && (
              <p className="mt-1 text-xs text-gray-400">
                Member since {formatDate(member.added_at)}
              </p>
            )}

            {member.membership_name && (
              <p className="mt-1 text-xs text-gray-400">
                Plan: {member.membership_name}
              </p>
            )}
          </div>

          {/* Back link */}
          <a
            href="/admin/members"
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            &larr; Back
          </a>
        </div>
      </div>

      {/* ---------- 2. LTV + Tier cards ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* LTV */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Lifetime Value</p>
          <p className="mt-1 text-3xl font-bold font-mono text-gray-900">
            {formatCents(member.estimated_ltv)}
          </p>
        </div>

        {/* Current Tier */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Current Tier</p>
          <div className="mt-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold"
              style={{
                backgroundColor: `${tierColor}18`,
                color: tierColor,
              }}
            >
              T{member.current_tier_number ?? '?'} &mdash; {getTierLabel(member)}
            </span>
          </div>
        </div>
      </div>

      {/* ---------- 3. Engagement Row ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Last Visit</p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {getRelativeDate(member.last_booking)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Credits Remaining</p>
          <p className="mt-1 text-sm font-bold font-mono text-gray-900">
            {member.credits_remaining}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Visits</p>
          <p className="mt-1 text-sm font-bold font-mono text-gray-900">
            {member.total_attendances}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Email Consent</p>
          <p className="mt-1 text-sm font-medium">
            {member.email_consent ? (
              <span className="text-green-600">Yes</span>
            ) : (
              <span className="text-red-500">No</span>
            )}
            {member.sms_consent !== undefined && (
              <span className="text-gray-400 ml-2 text-xs">
                SMS: {member.sms_consent ? 'Yes' : 'No'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ---------- 4. Tier History Chart ---------- */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3
          className="text-lg font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Tier History
        </h3>

        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No tier history available yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="week_number"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Week',
                  position: 'insideBottom',
                  offset: -5,
                  style: { fontSize: 11, fill: '#9ca3af' },
                }}
              />
              <YAxis
                domain={[0, 9]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
                tickFormatter={(val: number) => String(9 - val)}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Tier (0 = best)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11, fill: '#9ca3af' },
                }}
              />
              <Tooltip content={<TierTooltip />} />
              <Line
                type="monotone"
                dataKey="display_tier"
                stroke="#2BBCCD"
                strokeWidth={2}
                dot={{ r: 4, fill: '#2BBCCD', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#2BBCCD' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ---------- 5. Campaign History ---------- */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3
          className="text-lg font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Campaign History
        </h3>

        {campaigns.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            No campaigns sent to this member.
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {campaign.name}
                  </p>
                  {campaign.tier_at_send && (
                    <p className="text-xs text-gray-400">
                      Tier at send: {campaign.tier_at_send}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDate(campaign.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- 6. Notes ---------- */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-lg font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Notes
          </h3>
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-500">Error saving</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add notes about this member..."
          rows={4}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none resize-y focus:border-[#2BBCCD] focus:ring-2 focus:ring-[#2BBCCD]/20"
        />
      </div>
    </div>
  );
}
