"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export default function ProgressBar({ 
  current, 
  total, 
  label,
  className = ""
}: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className={`${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-[var(--text-black)]">
            {label}
          </span>
          <span className="text-sm font-bold text-[var(--primary-green)]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
        <span>{current} hours</span>
        <span>{total} hours</span>
      </div>
    </div>
  );
}
