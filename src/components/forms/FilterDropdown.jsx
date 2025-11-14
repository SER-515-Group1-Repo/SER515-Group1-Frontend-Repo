import React, { useMemo, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STATUS_OPTIONS } from "../../lib/constants";

const ALL_ASSIGNEE = ["Akshat", "Balaji", "Charith", "Rahul", "Vishesh"];
const ALL_TAGS = [
  "Frontend",
  "Backend",
  "Research",
  "Refactor",
  "Bug",
  "Testing",
];

// eslint-disable-next-line react-refresh/only-export-components
export function applyFilters(columns = [], filters) {
  if (!filters) return columns;

  const { text, statuses, assignees, tags } = filters;
  const query = (text || "").trim().toLowerCase();

  const taskPasses = (task = {}) => {
    const t = (task.title || "").toLowerCase();
    const d = (task.description || "").toLowerCase();
    const taskTags = Array.isArray(task.tags) ? task.tags : [];
    const taskAssignee = task.assignee ?? task.assigne ?? ""; // <-- handles backend 'assigne'

    if (query && !(t.includes(query) || d.includes(query))) return false;
    if (assignees?.size && !assignees.has(String(taskAssignee))) return false;
    if (tags?.size && ![...tags].every((tg) => taskTags.includes(tg)))
      return false;

    return true;
  };

  return columns.map((col) => {
    const includeCol = !statuses?.size || statuses.has(col.title);
    return {
      ...col,
      tasks: includeCol ? (col.tasks || []).filter(taskPasses) : [],
    };
  });
}

export default function FilterDropdown({ data = [], onApply }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [statuses, setStatuses] = useState(new Set()); // Set of status names (strings)
  const [assignees, setAssignees] = useState(new Set()); // Set of assignee names (strings)
  const [tags, setTags] = useState(new Set()); // Set of tag strings

  // (Optional) Derived options from live data; not used in UI below but kept for future
  const { assigneeOptions, tagOptions } = useMemo(() => {
    const a = new Set();
    const t = new Set();
    data.forEach((col) => {
      (col.tasks || []).forEach((task) => {
        const asg = task?.assignee ?? task?.assigne;
        if (asg) a.add(String(asg));
        (Array.isArray(task?.tags) ? task.tags : []).forEach(
          (tg) => tg && t.add(String(tg))
        );
      });
    });
    return { assigneeOptions: [...a].sort(), tagOptions: [...t].sort() };
  }, [data]);

  const toggle = (setObj, value) => {
    const next = new Set(setObj);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  };

  const clearAll = () => {
    setText("");
    setStatuses(new Set());
    setAssignees(new Set());
    setTags(new Set());
    onApply?.({
      text: "",
      statuses: new Set(),
      assignees: new Set(),
      tags: new Set(),
    });
  };

  const apply = () => {
    onApply?.({ text, statuses, assignees, tags });
    setOpen(false);
  };

  // Close on outside click + Esc
  const panelRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={panelRef}>
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Filter
      </Button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[360px] origin-top-right rounded-2xl border bg-white p-4 shadow-xl"
          role="dialog"
          aria-label="Filter options"
        >
          {/* Text search */}
          <div className="mb-4 space-y-2">
            <div className="text-xs font-semibold text-gray-500">Search</div>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Title or description…"
            />
          </div>

          {/* Statuses */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold text-gray-500">
              Status
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-1 rounded-xl border p-2 hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={statuses.has(s.name)}
                    onChange={() => setStatuses((prev) => toggle(prev, s.name))}
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Assignees */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold text-gray-500">
              Assignee
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ASSIGNEE.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-1 rounded-xl border p-2 hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={assignees.has(s.name)}
                    onChange={() =>
                      setAssignees((prev) => toggle(prev, s.name))
                    }
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold text-gray-500">Tags</div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_TAGS.map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-1 rounded-xl border p-2 hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={tags.has(s)}
                    onChange={() => setTags((prev) => toggle(prev, s))}
                  />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-3">
            <button
              onClick={clearAll}
              className="text-sm text-gray-600 underline"
            >
              Clear all
            </button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={apply}>Apply</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
