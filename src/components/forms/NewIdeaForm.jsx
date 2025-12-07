import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { STATUS_OPTIONS } from "../../lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TagsDropdown from "@/components/common/TagsDropdown";
import { X, ChevronDown } from "lucide-react";

const NewIdeaForm = ({
  newIdea,
  setNewIdea,
  teamMembers = [],
  selectedColumn,
}) => {
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const assigneeRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        setIsAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Acceptance Criteria functions
  const addCriterion = () => {
    const currentCriteria = newIdea.acceptanceCriteria || [];
    if (currentCriteria.length >= 5) {
      alert("Maximum 5 acceptance criteria allowed");
      return;
    }
    setNewIdea({
      ...newIdea,
      acceptanceCriteria: [...currentCriteria, ""],
    });
  };

  const updateCriteria = (index, value) => {
    const updated = [...(newIdea.acceptanceCriteria || [])];
    updated[index] = value;
    setNewIdea({ ...newIdea, acceptanceCriteria: updated });
  };

  const removeCriterion = (index) => {
    const updated = (newIdea.acceptanceCriteria || []).filter(
      (_, i) => i !== index
    );
    setNewIdea({ ...newIdea, acceptanceCriteria: updated });
  };

  // Multi-select assignees
  const selectedAssignees = Array.isArray(newIdea.assignees)
    ? newIdea.assignees
    : [];

  const toggleAssignee = (name) => {
    const current = selectedAssignees;
    const next = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    setNewIdea({ ...newIdea, assignees: next });
  };

  const clearAssignees = () => {
    setNewIdea({ ...newIdea, assignees: [] });
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g. Improve task filter UX"
          className="col-span-3"
          value={newIdea.title || ""}
          onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
          required
        />
      </div>

      {/* Description */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="description" className="text-right pt-2">
          Description <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="description"
          rows={4}
          placeholder="Briefly describe the idea…"
          className="col-span-3 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-vertical"
          value={newIdea.description || ""}
          onChange={(e) =>
            setNewIdea({ ...newIdea, description: e.target.value })
          }
          required
        />
      </div>

      {/* Acceptance Criteria */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">Acceptance Criteria</Label>
        <div className="col-span-3 space-y-2">
          {(newIdea.acceptanceCriteria || []).map((criteria, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground w-6">
                {index + 1}.
              </span>
              <Input
                placeholder={`Enter criterion ${index + 1}...`}
                value={criteria}
                onChange={(e) => updateCriteria(index, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCriterion(index)}
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCriterion}
              disabled={(newIdea.acceptanceCriteria || []).length >= 5}
            >
              + Add Criterion
            </Button>
            <span className="text-xs text-muted-foreground">
              {(newIdea.acceptanceCriteria || []).length}/5 criteria
            </span>
          </div>
        </div>
      </div>

      {/* Story Points */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="story-points" className="text-right">
          Story Points
        </Label>
        <div className="col-span-3">
          <Input
            id="story-points"
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="e.g., 8 (0-100)"
            value={newIdea.storyPoints ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || val === null) {
                setNewIdea({ ...newIdea, storyPoints: null });
              } else {
                const num = parseInt(val);
                if (!isNaN(num) && num >= 0 && num <= 100) {
                  setNewIdea({ ...newIdea, storyPoints: num });
                }
              }
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Valid range: 0-100
          </p>
        </div>
      </div>

      {/* Business Value */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="business-value" className="text-right">
          Business Value
        </Label>
        <div className="col-span-3">
          <Input
            id="business-value"
            type="number"
            min="0"
            max="10"
            step="1"
            placeholder="e.g., 8 (0-10) or leave empty"
            value={newIdea.businessValue ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || val === null) {
                setNewIdea({ ...newIdea, businessValue: null });
              } else {
                const num = parseInt(val);
                if (!isNaN(num) && num >= 0 && num <= 10) {
                  // Allow 0 as a valid value (means no business value)
                  setNewIdea({ ...newIdea, businessValue: num });
                }
              }
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Product Owner assigns value (1-10). MVP Score = BV / SP
          </p>
        </div>
      </div>

      {/* MoSCoW Priority */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="moscow-priority" className="text-right">
          MoSCoW Priority
        </Label>
        <div className="col-span-3">
          <select
            id="moscow-priority"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={newIdea.moscowPriority || ""}
            onChange={(e) =>
              setNewIdea({
                ...newIdea,
                moscowPriority: e.target.value || null,
              })
            }
          >
            <option value="">Select priority (optional)</option>
            <option value="Must">Must</option>
            <option value="Should">Should</option>
            <option value="Could">Could</option>
            <option value="Won't">Won't</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Override MVP score sorting with MoSCoW priority
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status <span className="text-red-500">*</span>
        </Label>
        <select
          id="status"
          className="col-span-3 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={newIdea.status || selectedColumn || "Proposed"}
          onChange={(e) => setNewIdea({ ...newIdea, status: e.target.value })}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Assignees (Multi-Select) */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">Assignees</Label>
        <div className="col-span-3 relative" ref={assigneeRef}>
          <div
            onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
            className="min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer flex items-center justify-between"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedAssignees.length === 0 ? (
                <span className="text-muted-foreground">
                  Select assignees...
                </span>
              ) : (
                selectedAssignees.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs"
                  >
                    {name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAssignee(name);
                      }}
                    />
                  </span>
                ))
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              {selectedAssignees.length > 0 && (
                <X
                  className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAssignees();
                  }}
                />
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          {isAssigneeOpen && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-auto">
              {teamMembers.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No team members available
                </div>
              ) : (
                teamMembers.map((member, index) => (
                  <div
                    key={`${member.id}-${index}`}
                    onClick={() => toggleAssignee(member.name)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(member.name)}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{member.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <TagsDropdown newIdea={newIdea} setNewIdea={setNewIdea} />
    </div>
  );
};

export default NewIdeaForm;
