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
      className={`${className} ${
        active 
          ? 'bg-green-500 text-white border-green-500' 
          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
      }`}
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
    <div className={`flex gap-1 ${className}`}>
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          label={filter.label}
          active={filter.active}
          onClick={() => onFilterChange(filter.id)}
          className="flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors duration-200 border text-center"
        />
      ))}
    </div>
  );
}
