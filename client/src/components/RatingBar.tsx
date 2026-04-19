interface RatingBarProps {
  onRate: (rating: 1 | 2 | 3 | 4 | 5) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  selectedRating?: 1 | 2 | 3 | 4 | 5 | null;
}

const RATINGS = [
  { value: 1 as const, emoji: '😞', label: 'Very unhappy' },
  { value: 2 as const, emoji: '😕', label: 'Unhappy' },
  { value: 3 as const, emoji: '😐', label: 'Neutral' },
  { value: 4 as const, emoji: '🙂', label: 'Happy' },
  { value: 5 as const, emoji: '😄', label: 'Very happy' },
];

export default function RatingBar({
  onRate,
  isLoading = false,
  disabled = false,
  selectedRating = null,
}: RatingBarProps) {
  const handleClick = async (rating: 1 | 2 | 3 | 4 | 5) => {
    if (isLoading || disabled) return;
    await onRate(rating);
  };

  const isDisabled = isLoading || disabled;

  return (
    <div className="flex justify-center gap-4 md:gap-6">
      {RATINGS.map(({ value, emoji, label }) => (
        <button
          key={value}
          onClick={() => handleClick(value)}
          disabled={isDisabled}
          aria-label={`${label} - ${value} star${value !== 1 ? 's' : ''}`}
          className={`transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 rounded-lg ${
            selectedRating === value ? 'text-5xl text-amber-600' : 'text-4xl text-gray-400'
          } ${
            isDisabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-125 hover:text-amber-600 cursor-pointer'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
