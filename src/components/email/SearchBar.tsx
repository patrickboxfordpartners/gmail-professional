import { Search, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex items-center flex-1 max-w-xl mx-6">
      <div className="flex items-center flex-1 bg-secondary rounded-lg px-3.5 py-[7px] gap-2.5 border border-transparent focus-within:border-ring/40 focus-within:bg-card focus-within:shadow-stripe-sm transition-all duration-200">
        <Search className="h-[14px] w-[14px] text-muted-foreground shrink-0" strokeWidth={2.5} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search mail"
          className="flex-1 bg-transparent text-[13px] outline-none text-foreground placeholder:text-muted-foreground/60"
        />
        <button className="p-1 rounded hover:bg-muted transition-colors">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
