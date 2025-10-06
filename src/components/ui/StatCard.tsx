"use client";

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  className = ""
}: StatCardProps) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-[var(--text-black)] mb-1">
        {value}
      </div>
      <div className="text-sm font-medium text-[var(--text-black)] mb-1">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-[var(--text-muted)] mb-2">
          {subtitle}
        </div>
      )}
      {trend && (
        <div className={`text-xs font-medium ${
          trend.positive ? 'text-[var(--primary-green)]' : 'text-red-500'
        }`}>
          {trend.positive ? '↗' : '↘'} {trend.value}
        </div>
      )}
    </div>
  );
}
