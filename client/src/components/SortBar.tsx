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
      <span className="text-theme-muted">Trier par</span>
      <select
        value={activeSort}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-4 py-2 border border-theme-border rounded-lg bg-theme-elevated text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
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
