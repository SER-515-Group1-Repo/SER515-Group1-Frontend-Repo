import React, { useState, useEffect, useRef } from "react";
import FilterDropdown from "@/components/forms/FilterDropdown";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/utils";

export function SearchBar({ onFilter, onFiltersChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const isInitialMount = useRef(true);
  const hasUserInteracted = useRef(false);

  // Try to load filters from localStorage if available
  const getInitialFilterValue = () => {
    if (typeof window !== 'undefined') {
      if (window.__dashboardFiltersValue) return window.__dashboardFiltersValue;
      try {
        const s = localStorage.getItem('board_filters_v1');
        return s ? JSON.parse(s) : undefined;
      } catch { return undefined; }
    }
    return undefined;
  };
  const [filterValue, setFilterValue] = useState(getInitialFilterValue);

  const debouncedFilterRef = useRef(
    debounce((term) => {
      onFilter(term);
    }, 500)
  );

  useEffect(() => {
    debouncedFilterRef.current = debounce((term) => {
      onFilter(term);
    }, 500);
  }, [onFilter]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (hasUserInteracted.current) {
      debouncedFilterRef.current(searchTerm);
    }
  }, [searchTerm]);

  const handleInputChange = (e) => {
    hasUserInteracted.current = true;
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handler = () => {
        setFilterValue(window.__dashboardFiltersValue);
      };
      window.addEventListener('dashboardFiltersChanged', handler);
      return () => window.removeEventListener('dashboardFiltersChanged', handler);
    }
  }, []);

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

      <FilterDropdown onApply={filters => {
        if (!filters) {
          if (typeof window !== 'undefined') window.__dashboardFiltersValue = undefined;
          setFilterValue(undefined);
        } else {
          if (typeof window !== 'undefined') window.__dashboardFiltersValue = filters;
          setFilterValue(filters);
        }
        onFiltersChange(filters);
        if (typeof window !== 'undefined') {
          const event = new Event('dashboardFiltersChanged');
          window.dispatchEvent(event);
        }
      }} value={filterValue} />
    </div>
  );
}
