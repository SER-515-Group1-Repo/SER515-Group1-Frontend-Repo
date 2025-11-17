import React, { useState, useEffect, useRef } from "react";
import FilterDropdown from "@/components/forms/FilterDropdown";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/utils";

export function SearchBar({ onFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const isInitialMount = useRef(true);
  const hasUserInteracted = useRef(false);

  // Use ref to store the debounced function so it doesn't get recreated
  const debouncedFilterRef = useRef(
    debounce((term) => {
      onFilter(term);
    }, 500)
  );

  // Update the debounced function if onFilter changes (but don't call it)
  useEffect(() => {
    debouncedFilterRef.current = debounce((term) => {
      onFilter(term);
    }, 500);
    // Don't call it here, just update the ref
  }, [onFilter]);

  // Call debounced filter whenever searchTerm changes (but not on initial mount)
  useEffect(() => {
    // Skip the initial mount - only call when user actually types
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only call if user has interacted (changed the search term)
    if (hasUserInteracted.current) {
      // Call debounced filter for both empty and non-empty search terms
      // Empty string will trigger API call to show all ideas
      debouncedFilterRef.current(searchTerm);
    }
  }, [searchTerm]);

  // Track when user actually types in the input
  const handleInputChange = (e) => {
    hasUserInteracted.current = true;
    setSearchTerm(e.target.value);
  };

  return (
    <div className="flex items-center p-4 border-b">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search Idea"
          className="pl-10"
          value={searchTerm}
          onChange={handleInputChange}
        />
      </div>

      <FilterDropdown data={data} value={value} onApply={onFiltersChange} />
    </div>
  );
}
