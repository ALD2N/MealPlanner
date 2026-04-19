interface SortOption {
  id: string;
  label: string;
  field: string | null;
  dir: -1 | 0 | 1;
}

interface SortBarProps {
  options: SortOption[];
  activeSort: string;
  onSortChange: (sortId: string) => void;
}

export default function SortBar({ options, activeSort, onSortChange }: SortBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-600">Trier par</span>
      <select
        value={activeSort}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
