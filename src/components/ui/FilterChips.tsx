"use client";

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function FilterChip({ 
  label, 
  active = false, 
  onClick,
  className = ""
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`filter-chip ${active ? 'active' : ''} ${className}`}
    >
      {label}
    </button>
  );
}

interface FilterChipsProps {
  filters: Array<{
    id: string;
    label: string;
    active: boolean;
  }>;
  onFilterChange: (filterId: string) => void;
  className?: string;
}

export function FilterChips({ 
  filters, 
  onFilterChange,
  className = ""
}: FilterChipsProps) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          label={filter.label}
          active={filter.active}
          onClick={() => onFilterChange(filter.id)}
        />
      ))}
    </div>
  );
}
