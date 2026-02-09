import { Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const handleFilterClick = () => {
    toast.info("Search filters coming soon");
  };

  return (
    <div className="flex items-center flex-1 max-w-xl mx-2 md:mx-6">
      <div className="flex items-center flex-1 bg-secondary rounded-lg px-3 md:px-3.5 py-2 md:py-[7px] gap-2 md:gap-2.5 border border-transparent focus-within:border-ring/40 focus-within:bg-card focus-within:shadow-stripe-sm transition-all duration-200">
        <Search className="h-4 w-4 md:h-[14px] md:w-[14px] text-muted-foreground shrink-0" strokeWidth={2.5} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          className="flex-1 bg-transparent text-[14px] md:text-[13px] outline-none text-foreground placeholder:text-muted-foreground/60"
        />
        <button
          onClick={handleFilterClick}
          className="min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 md:p-1 flex items-center justify-center rounded hover:bg-muted active:bg-muted/80 transition-colors"
          aria-label="Search filters"
        >
          <SlidersHorizontal className="h-4 w-4 md:h-3.5 md:w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
