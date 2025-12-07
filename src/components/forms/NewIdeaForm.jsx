import React, { useState, useRef, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  STATUS_OPTIONS,
  STORY_POINTS_OPTIONS,
  getVisibleFields,
} from "../../lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TagsDropdown from "@/components/common/TagsDropdown";
import { X, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const NewIdeaForm = ({
  newIdea,
  setNewIdea,
  teamMembers = [],
  selectedColumn,
}) => {
  // Validation state
  const [errorState, setErrorState] = useState({});
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const assigneeRef = useRef(null);

  // Get field visibility based on current status
  const currentStatus = newIdea.status || selectedColumn || "Backlog";
  const visibleFields = useMemo(
    () => getVisibleFields(currentStatus),
    [currentStatus]
  );

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

  // Dependencies functions
  const addDependency = () => {
    const currentDeps = newIdea.dependencies || [];
    if (currentDeps.length >= 10) {
      alert("Maximum 10 dependencies allowed");
      return;
    }
    setNewIdea({
      ...newIdea,
      dependencies: [...currentDeps, ""],
    });
  };

  const updateDependency = (index, value) => {
    const updated = [...(newIdea.dependencies || [])];
    updated[index] = value;
    setNewIdea({ ...newIdea, dependencies: updated });
  };

  const removeDependency = (index) => {
    const updated = (newIdea.dependencies || []).filter((_, i) => i !== index);
    setNewIdea({ ...newIdea, dependencies: updated });
  };

  // Refinement Dependencies functions
  const addRefinementDependency = () => {
    const currentDeps = newIdea.refinementDependencies || [];
    if (currentDeps.length >= 10) {
      alert("Maximum 10 refinement dependencies allowed");
      return;
    }
    setNewIdea({
      ...newIdea,
      refinementDependencies: [...currentDeps, ""],
    });
  };

  const updateRefinementDependency = (index, value) => {
    const updated = [...(newIdea.refinementDependencies || [])];
    updated[index] = value;
    setNewIdea({ ...newIdea, refinementDependencies: updated });
  };

  const removeRefinementDependency = (index) => {
    const updated = (newIdea.refinementDependencies || []).filter(
      (_, i) => i !== index
    );
    setNewIdea({ ...newIdea, refinementDependencies: updated });
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

  // Note: Real-time validation removed for NewIdeaForm — validation occurs when creating the idea (handleSaveIdea in the dashboard page)

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
          className={`col-span-3 ${errorState.title ? "border-red-500" : ""}`}
          value={newIdea.title || ""}
          onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
          required
        />
        {errorState.title && <p className="text-red-500 text-sm col-span-4">{errorState.title}</p>}
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
          className={`col-span-3 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-vertical ${errorState.description ? "border-red-500" : ""}`}
          value={newIdea.description || ""}
          onChange={(e) =>
            setNewIdea({ ...newIdea, description: e.target.value })
          }
          required
        />
        {errorState.description && <p className="text-red-500 text-sm col-span-4">{errorState.description}</p>}
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

      {/* Story Points - only show if required by FIELD_VISIBILITY */}
      {visibleFields.storyPoints && (
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
              className={errorState.storyPoints ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Valid range: 0-100
            </p>
            {errorState.storyPoints && <p className="text-red-500 text-sm">{errorState.storyPoints}</p>}
          </div>
        </div>
      )}

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
          value={currentStatus}
          onChange={(e) => setNewIdea({ ...newIdea, status: e.target.value })}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Business Value - visible from Proposed onwards */}
      {visibleFields.bv && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="bv" className="text-right">
            Business Value
          </Label>
          <div className="col-span-3">
            <Input
              id="bv"
              type="number"
              min="1"
              max="100"
              placeholder="Enter business value (1-100)"
              value={newIdea.bv ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === null) {
                  setNewIdea({ ...newIdea, bv: null });
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 1 && num <= 100) {
                    setNewIdea({ ...newIdea, bv: num });
                  }
                }
              }}
              className={errorState.bv ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required to move from Backlog to Proposed
            </p>
            {errorState.bv && <p className="text-red-500 text-sm">{errorState.bv}</p>}
          </div>
        </div>
      )}

      {/* Needs Refinement Fields */}
      {visibleFields.refinementSessionScheduled && (
        <div className="border rounded-lg p-4 space-y-3 bg-blue-50/50">
          <h4 className="font-medium text-sm text-blue-800">
            Refinement Checklist
          </h4>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="refinementSessionScheduled"
              checked={newIdea.refinementSessionScheduled || false}
              onCheckedChange={(checked) =>
                setNewIdea({ ...newIdea, refinementSessionScheduled: checked })
              }
            />
            <Label
              htmlFor="refinementSessionScheduled"
              className="text-sm font-normal"
            >
              Refinement Session Scheduled
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="groomed"
              checked={newIdea.groomed || false}
              onCheckedChange={(checked) =>
                setNewIdea({ ...newIdea, groomed: checked })
              }
            />
            <Label htmlFor="groomed" className="text-sm font-normal">
              Story is Groomed
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sessionDocumented"
              checked={newIdea.sessionDocumented || false}
              onCheckedChange={(checked) =>
                setNewIdea({ ...newIdea, sessionDocumented: checked })
              }
            />
            <Label htmlFor="sessionDocumented" className="text-sm font-normal">
              Session Documented
            </Label>
          </div>

          {/* Dependencies */}
          <div className="space-y-2 pt-2">
            <Label className="text-sm">Dependencies</Label>
            {(newIdea.dependencies || []).map((dep, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder={`Dependency ${index + 1}...`}
                  value={dep}
                  onChange={(e) => updateDependency(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDependency(index)}
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDependency}
              disabled={(newIdea.dependencies || []).length >= 10}
            >
              + Add Dependency
            </Button>
          </div>
        </div>
      )}

      {/* In Refinement Fields */}
      {visibleFields.storyPoints && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="story-points" className="text-right">
            Story Points
          </Label>
          <div className="col-span-3">
            <select
              id="story-points"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newIdea.storyPoints ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setNewIdea({
                  ...newIdea,
                  storyPoints: val === "" ? null : parseInt(val),
                });
              }}
            >
              <option value="">Select story points...</option>
              {STORY_POINTS_OPTIONS.map((points) => (
                <option key={points} value={points}>
                  {points}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Fibonacci sequence values - Required for Ready To Commit
            </p>
          </div>
        </div>
      )}

      {visibleFields.refinementDependencies && (
        <div className="border rounded-lg p-4 space-y-3 bg-purple-50/50">
          <h4 className="font-medium text-sm text-purple-800">
            In Refinement Requirements
          </h4>

          {/* Refinement Dependencies */}
          <div className="space-y-2">
            <Label className="text-sm">Refinement Dependencies</Label>
            {(newIdea.refinementDependencies || []).map((dep, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder={`Refinement dependency ${index + 1}...`}
                  value={dep}
                  onChange={(e) =>
                    updateRefinementDependency(index, e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRefinementDependency(index)}
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRefinementDependency}
              disabled={(newIdea.refinementDependencies || []).length >= 10}
            >
              + Add Refinement Dependency
            </Button>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="teamApproval"
              checked={newIdea.teamApproval || false}
              onCheckedChange={(checked) =>
                setNewIdea({ ...newIdea, teamApproval: checked })
              }
            />
            <Label htmlFor="teamApproval" className="text-sm font-normal">
              Team Approval
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="poApproval"
              checked={newIdea.poApproval || false}
              onCheckedChange={(checked) =>
                setNewIdea({ ...newIdea, poApproval: checked })
              }
            />
            <Label htmlFor="poApproval" className="text-sm font-normal">
              PO Approval
            </Label>
          </div>
        </div>
      )}

      {/* Ready To Commit Fields */}
      {visibleFields.sprintCapacity && (
        <div className="border rounded-lg p-4 space-y-3 bg-green-50/50">
          <h4 className="font-medium text-sm text-green-800">
            Sprint Planning
          </h4>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sprintCapacity" className="text-right text-sm">
              Sprint Capacity
            </Label>
            <div className="col-span-3">
              <Input
                id="sprintCapacity"
                type="number"
                min="1"
                placeholder="Enter sprint capacity"
                value={newIdea.sprintCapacity ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewIdea({
                    ...newIdea,
                    sprintCapacity: val === "" ? null : parseInt(val),
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="skillsAvailable"
              checked={newIdea.skillsAvailable || false}
              onCheckedChange={(checked) =>
                setNewIdea({ ...newIdea, skillsAvailable: checked })
              }
            />
            <Label htmlFor="skillsAvailable" className="text-sm font-normal">
              Skills Available in Team
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="teamCommits"
              checked={newIdea.teamCommits || false}
              onCheckedChange={(checked) =>
                setNewIdea({ ...newIdea, teamCommits: checked })
              }
            />
            <Label htmlFor="teamCommits" className="text-sm font-normal">
              Team Commits to Deliver
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tasksIdentified"
              checked={newIdea.tasksIdentified || false}
              onCheckedChange={(checked) =>
                setNewIdea({ ...newIdea, tasksIdentified: checked })
              }
            />
            <Label htmlFor="tasksIdentified" className="text-sm font-normal">
              Tasks Identified
            </Label>
          </div>
        </div>
      )}

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
