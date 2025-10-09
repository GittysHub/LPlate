"use client";

interface ToggleOption {
  id: string;
  label: string;
  active: boolean;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  onOptionChange: (optionId: string) => void;
  className?: string;
}

export default function ToggleGroup({ 
  options, 
  onOptionChange, 
  className = "" 
}: ToggleGroupProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Background container */}
      <div className="relative bg-gray-100 rounded-lg p-0.5 flex shadow-sm">
        {/* Active indicator */}
        <div 
          className="absolute top-0.5 bottom-0.5 bg-white rounded-md shadow-sm transition-all duration-200 ease-in-out border border-gray-200"
          style={{
            width: `${100 / options.length}%`,
            left: `${(options.findIndex(opt => opt.active) * 100) / options.length}%`,
          }}
        />
        
        {/* Options */}
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onOptionChange(option.id)}
            className={`relative z-10 flex-1 py-2 px-1 text-xs font-medium rounded-md transition-colors duration-200 min-h-[32px] flex items-center justify-center ${
              option.active 
                ? 'text-green-600 font-semibold' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
