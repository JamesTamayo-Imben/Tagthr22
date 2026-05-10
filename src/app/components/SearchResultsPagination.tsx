import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  currentPage: number;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  loading?: boolean;
};

export default function SearchResultsPagination({
  currentPage,
  onPrev,
  onNext,
  canPrev,
  canNext,
  loading = false,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-6">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev || loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] text-white text-sm font-medium hover:border-[#8B5CF6] disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>
      <span className="text-sm text-[#9CA3AF] tabular-nums">
        Page <span className="text-white font-semibold">{currentPage}</span>
        {loading ? <span className="ml-2 text-[#8B5CF6]">Loading…</span> : null}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext || loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] text-white text-sm font-medium hover:border-[#8B5CF6] disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
