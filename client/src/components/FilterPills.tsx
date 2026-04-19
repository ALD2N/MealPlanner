interface FilterPillsProps {
  filters: Array<{ id: string; label: string }>;
  activeFilters: string[];
  onToggle: (filterId: string) => void;
}

export default function FilterPills({ filters, activeFilters, onToggle }: FilterPillsProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onToggle(filter.id)}
          className={`px-4 py-2 rounded-full transition ${
            activeFilters.includes(filter.id)
              ? 'bg-amber-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:border-amber-600'
          }`}
        >
          {filter.label} {activeFilters.includes(filter.id) && '×'}
        </button>
      ))}
    </div>
  );
}
