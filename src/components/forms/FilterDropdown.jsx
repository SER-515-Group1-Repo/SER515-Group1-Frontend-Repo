import React, { useState, useEffect, useRef, useMemo } from "react";
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

  const { text, statuses, assignees, tags, startDate, endDate } = filters;
  const query = (text || "").trim().toLowerCase();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);

  const taskPasses = (task = {}) => {
    const t = (task.title || "").toLowerCase();
    const d = (task.description || "").toLowerCase();
    const taskTags = Array.isArray(task.tags) ? task.tags : [];
    const taskAssignee = task.assignee ?? task.assigne ?? "";

    const rawDate =
      task.created_at ||
      task.createdAt ||
      task.updated_at ||
      task.updatedAt ||
      task.date ||
      task.due_date ||
      null;
    const taskDate = rawDate ? new Date(rawDate) : null;

    if (query && !(t.includes(query) || d.includes(query))) return false;
    if (assignees?.size && !assignees.has(String(taskAssignee))) return false;
    if (tags?.size && !taskTags.some((tg) => tags.has(tg))) return false;

    if ((start || end) && !taskDate) return false;
    if (start && taskDate && taskDate < start) return false;
    if (end && taskDate && taskDate > end) return false;

    return true;
  };

  return (columns || []).map((col) => {
    const includeCol = !statuses?.size || statuses.has(col.title);
    return {
      ...col,
      tasks: includeCol ? (col.tasks || []).filter(taskPasses) : [],
    };
  });
}

export default function NewFilterDropdown({ value = null, onApply }) {
  const [open, setOpen] = useState(false);

  const [text, setText] = useState("");
  const [statuses, setStatuses] = useState(new Set());
  const [assignees, setAssignees] = useState(new Set());
  const [tags, setTags] = useState(new Set());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!value) {
      setText("");
      setStatuses(new Set());
      setAssignees(new Set());
      setTags(new Set());
      setStartDate("");
      setEndDate("");
      return;
    }
    setText(value.text || "");
    setStatuses(new Set(value.statuses || []));
    setAssignees(new Set(value.assignees || []));
    setTags(new Set(value.tags || []));
    setStartDate(value.startDate || "");
    setEndDate(value.endDate || "");
  }, [value]);

  const toggle = (setObj, v) => {
    const next = new Set(setObj);
    next.has(v) ? next.delete(v) : next.add(v);
    return next;
  };

  const clearAll = () => {
    setText("");
    setStatuses(new Set());
    setAssignees(new Set());
    setTags(new Set());
    setStartDate("");
    setEndDate("");

    onApply?.(null);

    setOpen(false);
  };

  const apply = () => {
    onApply?.({ text, statuses, assignees, tags, startDate, endDate });
    setOpen(false);
  };

  const summary = useMemo(() => {
    const parts = [];
    if (text) parts.push(`“${text}”`);
    if (statuses.size) parts.push(`${statuses.size} status`);
    if (assignees.size) parts.push(`${assignees.size} assignee`);
    if (tags.size) parts.push(`${tags.size} tag`);
    if (startDate || endDate)
      parts.push(
        `date${startDate ? ` ≥ ${startDate}` : ""}${
          endDate ? ` ≤ ${endDate}` : ""
        }`
      );
    return parts;
  }, [text, statuses, assignees, tags, startDate, endDate]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (text) c++;
    if (statuses.size) c++;
    if (assignees.size) c++;
    if (tags.size) c++;
    if (startDate || endDate) c++;
    return c;
  }, [text, statuses, assignees, tags, startDate, endDate]);

  const panelRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={panelRef}>
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {activeCount > 0 ? `Filter (${activeCount})` : "Filter"}
      </Button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[380px] origin-top-right rounded-2xl border bg-white p-4 shadow-xl"
          role="dialog"
          aria-label="Filter options"
        >
          {/* Summary chips */}
          {summary.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {summary.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Status */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold text-gray-500">
              Status
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-1 rounded-xl border p-2 hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={statuses.has(s)}
                    onChange={() => setStatuses((p) => toggle(p, s))}
                  />
                  <span className="text-sm">{s}</span>
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
                  key={s}
                  className="flex cursor-pointer items-center gap-1 rounded-xl border p-2 hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={assignees.has(s)}
                    onChange={() => setAssignees((p) => toggle(p, s))}
                  />
                  <span className="text-sm">{s}</span>
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
                    onChange={() => setTags((p) => toggle(p, s))}
                  />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Start</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">End</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
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
