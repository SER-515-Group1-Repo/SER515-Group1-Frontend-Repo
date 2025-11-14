import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

export default function AssigneeDropdown({
  newIdea,
  setNewIdea,
  teamMembers = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selected = Array.isArray(newIdea.assignees) ? newIdea.assignees : [];
  const hasSelection = selected.length > 0;

  const memberNames = useMemo(
    () => teamMembers.map((m) => m.name),
    [teamMembers]
  );

  const toggleMember = (name) => {
    const next = selected.includes(name)
      ? selected.filter((n) => n !== name)
      : [...selected, name];

    setNewIdea({
      ...newIdea,
      assignees: next,
      assignee: next[0] ?? "",
    });
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="grid grid-cols-4 items-start gap-4">
      <Label htmlFor="assignees" className="text-right pt-2">
        Assignees
      </Label>

      <div className="col-span-3 relative" ref={ref}>
        <button
          type="button"
          id="assignees"
          onClick={() => setIsOpen((o) => !o)}
          className={`flex items-center justify-between h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-left text-sm
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      ${hasSelection ? "text-foreground" : "text-muted-foreground"}`}
        >
          <span className="truncate">
            {hasSelection ? selected.join(", ") : "Select one or more assignees"}
          </span>
          <ChevronDown
            className={`ml-2 h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover p-2 shadow-md">
            <div className="max-h-56 overflow-auto pr-1">
              {memberNames.map((name, idx) => {
                const checked = selected.includes(name);
                return (
                  <label
                    key={`${name}-${idx}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() => toggleMember(name)}
                    />
                    <span className="text-sm">{name}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setNewIdea({ ...newIdea, assignees: [], assignee: "" })
                }
                className="text-xs text-muted-foreground hover:underline"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-primary hover:underline"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
