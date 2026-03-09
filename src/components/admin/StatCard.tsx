interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

export default function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
}: StatCardProps) {
  const changeColor =
    changeType === 'positive'
      ? 'text-green-600'
      : changeType === 'negative'
        ? 'text-red-500'
        : 'text-gray-400';

  const changeArrow =
    changeType === 'positive'
      ? '\u2191 '
      : changeType === 'negative'
        ? '\u2193 '
        : '';

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold font-mono text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <p className={`mt-1 text-xs ${changeColor}`}>
              {changeArrow}{change}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
            style={{
              backgroundColor: 'rgba(43,188,205,0.12)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
