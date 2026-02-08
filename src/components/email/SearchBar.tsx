import { Search, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 flex-1 max-w-2xl mx-4">
      <div className="flex items-center flex-1 bg-secondary rounded-lg px-3 py-1.5 gap-2 border border-transparent focus-within:border-ring focus-within:bg-background transition-colors">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search mail"
          className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
        />
        <button className="p-0.5 rounded hover:bg-muted transition-colors">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
