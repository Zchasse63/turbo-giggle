import { useState, useMemo } from 'react';

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

const PAGE_SIZE = 25;

/* ---------- types ---------- */

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  current_tier: string | null;
  current_tier_number: number | null;
  current_tier_sub: string | null;
  is_reactivated: boolean;
  estimated_ltv: number;
  credits_remaining: number;
  last_booking: string | null;
  total_attendances: number;
}

interface MembersTableProps {
  members: Member[];
}

/* ---------- helpers ---------- */

function getMemberStatus(member: Member): string {
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
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function getInitials(first: string | null, last: string | null): string {
  const f = first?.charAt(0)?.toUpperCase() || '';
  const l = last?.charAt(0)?.toUpperCase() || '';
  return f + l || '?';
}

function getFullName(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(' ') || 'Unknown';
}

function getTierKey(member: Member): string {
  if (member.current_tier_sub) {
    return `${member.current_tier_number}${member.current_tier_sub}`;
  }
  return String(member.current_tier_number ?? '');
}

function getTierLabel(member: Member): string {
  const key = getTierKey(member);
  return TIER_NAMES[key] || member.current_tier || 'Unknown';
}

/* ---------- sort types ---------- */

type SortField = 'name' | 'tier' | 'ltv' | 'last_visit';
type SortDir = 'asc' | 'desc';

/* ---------- component ---------- */

export default function MembersTable({ members }: MembersTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('tier');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return ' \u2195';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  /* filter + sort + paginate */
  const filtered = useMemo(() => {
    let list = [...members];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => {
        const name = getFullName(m.first_name, m.last_name).toLowerCase();
        return name.includes(q) || m.email.toLowerCase().includes(q);
      });
    }

    // status filter
    if (statusFilter !== 'All') {
      list = list.filter((m) => getMemberStatus(m) === statusFilter);
    }

    // sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = getFullName(a.first_name, a.last_name).localeCompare(
            getFullName(b.first_name, b.last_name),
          );
          break;
        case 'tier':
          cmp = (a.current_tier_number ?? 99) - (b.current_tier_number ?? 99);
          break;
        case 'ltv':
          cmp = a.estimated_ltv - b.estimated_ltv;
          break;
        case 'last_visit': {
          const da = a.last_booking ? new Date(a.last_booking).getTime() : 0;
          const db = b.last_booking ? new Date(b.last_booking).getTime() : 0;
          cmp = da - db;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [members, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* page numbers to display */
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="rounded-xl bg-white shadow-sm">
      {/* toolbar */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#2BBCCD] focus:ring-2 focus:ring-[#2BBCCD]/20"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#2BBCCD]"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="At Risk">At Risk</option>
          <option value="Churned">Churned</option>
          <option value="Reactivated">Reactivated</option>
        </select>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                onClick={() => handleSort('name')}
              >
                Name{sortIcon('name')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                onClick={() => handleSort('tier')}
              >
                Revenue Priority{sortIcon('tier')}
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                onClick={() => handleSort('ltv')}
              >
                LTV{sortIcon('ltv')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                onClick={() => handleSort('last_visit')}
              >
                Last Visit{sortIcon('last_visit')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                  No members found.
                </td>
              </tr>
            )}
            {paged.map((m) => {
              const status = getMemberStatus(m);
              const tierColor = TIER_COLORS[m.current_tier_number ?? 9] || '#9ca3af';
              const statusColor = STATUS_COLORS[status] || '#9ca3af';

              return (
                <tr
                  key={m.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    window.location.href = `/admin/members/${m.id}`;
                  }}
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: 'rgba(43,188,205,0.15)',
                          color: '#2BBCCD',
                        }}
                      >
                        {getInitials(m.first_name, m.last_name)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {getFullName(m.first_name, m.last_name)}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {m.email}
                  </td>

                  {/* Tier badge */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: `${tierColor}18`,
                        color: tierColor,
                      }}
                    >
                      T{m.current_tier_number ?? '?'} {getTierLabel(m)}
                    </span>
                  </td>

                  {/* LTV */}
                  <td className="px-4 py-3 text-right font-mono text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatCents(m.estimated_ltv)}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${statusColor}18`,
                        color: statusColor,
                      }}
                    >
                      {status}
                    </span>
                  </td>

                  {/* Last Visit */}
                  <td className="px-4 py-3 text-right text-sm text-gray-500 whitespace-nowrap">
                    {getRelativeDate(m.last_booking)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-500">
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}
          &ndash;
          {Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
          {filtered.length.toLocaleString()} members
        </p>

        <div className="flex items-center gap-1">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                p === safePage
                  ? 'bg-[#2BBCCD] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
