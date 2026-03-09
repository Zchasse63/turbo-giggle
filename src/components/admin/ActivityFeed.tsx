interface Activity {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  severity: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#2BBCCD',
  success: '#22c55e',
  warning: '#E8A838',
  error: '#e74c3c',
};

const SEVERITY_BG: Record<string, string> = {
  info: 'rgba(43,188,205,0.08)',
  success: 'rgba(34,197,94,0.08)',
  warning: 'rgba(232,168,56,0.08)',
  error: 'rgba(231,76,60,0.08)',
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'success':
      return '\u2713';
    case 'warning':
      return '!';
    case 'error':
      return '\u2715';
    default:
      return 'i';
  }
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const visibleActivities = activities.slice(0, 10);

  return (
    <div className="rounded-xl bg-white shadow-sm">
      <div className="px-5 pt-5 pb-3">
        <h3
          className="text-lg font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Recent Activity
        </h3>
      </div>

      <div className="divide-y divide-gray-50">
        {visibleActivities.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No recent activity.
          </div>
        )}
        {visibleActivities.map((activity) => {
          const color = SEVERITY_COLORS[activity.severity] || SEVERITY_COLORS.info;
          const bgColor = SEVERITY_BG[activity.severity] || SEVERITY_BG.info;

          return (
            <div
              key={activity.id}
              className="flex gap-3 px-5 py-3"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              {/* severity icon */}
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                style={{ backgroundColor: bgColor, color }}
              >
                {getSeverityIcon(activity.severity)}
              </div>

              {/* content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                    {getRelativeTime(activity.created_at)}
                  </span>
                </div>
                {activity.description && (
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                    {activity.description}
                  </p>
                )}
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                  style={{ backgroundColor: bgColor, color }}
                >
                  {activity.event_type.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length > 10 && (
        <div className="border-t border-gray-100 px-5 py-3 text-center">
          <a
            href="/admin/activity"
            className="text-sm font-medium text-[#2BBCCD] hover:text-[#249aab] transition-colors"
          >
            View All Activity &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
