import React, { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Send, ChevronDown } from "lucide-react";
import TagsDropdown from "@/components/common/TagsDropdown";
import { Checkbox } from "@/components/ui/checkbox";
import {
  STATUS_OPTIONS,
  STORY_POINTS_OPTIONS,
  getVisibleFields,
} from "../../lib/constants";

const EditStoryForm = ({ story, onSave, teamMembers }) => {
  // Validation state
  const [errorState, setErrorState] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    acceptanceCriteria: [],
    storyPoints: "",
    moscowPriority: "",
    assignees: [],
    tags: [],
    // New fields for validation
    bv: null,
    refinementSessionScheduled: false,
    groomed: false,
    dependencies: [],
    sessionDocumented: false,
    refinementDependencies: [],
    teamApproval: false,
    poApproval: false,
    sprintCapacity: null,
    skillsAvailable: false,
    teamCommits: false,
    tasksIdentified: false,
  });

  // NOTE: real-time validation removed for EditStoryForm; validations will be
  // performed on submit to reduce noisy/continual validation while editing.

  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const assigneeRef = useRef(null);

  // Get field visibility based on current status
  const visibleFields = useMemo(
    () => getVisibleFields(formData.status),
    [formData.status]
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

  useEffect(() => {
    // Only initialize form when story ID changes (new story selected), not on every story prop update
    if (story && story.id) {
      // Parse tags - could be string, array, or empty
      let parsedTags = [];
      if (story.tags) {
        if (typeof story.tags === "string") {
          parsedTags = story.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        } else if (Array.isArray(story.tags)) {
          parsedTags = story.tags;
        }
      }

      // Parse assignees - could be string, array, or empty
      let parsedAssignees = [];
      if (story.assignees) {
        if (Array.isArray(story.assignees)) {
          parsedAssignees = story.assignees;
        } else if (typeof story.assignees === "string") {
          parsedAssignees = story.assignees
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a);
        }
      }

      // Handle moscowPriority - check for null/undefined/empty string explicitly
      const moscowPriorityValue =
        story.moscowPriority ?? story.moscow_priority ?? null;
      const moscowPriority =
        moscowPriorityValue === null ||
        moscowPriorityValue === undefined ||
        moscowPriorityValue === ""
          ? ""
          : moscowPriorityValue;

      // Handle story points - convert null/undefined/0 to empty string for form display
      const storyPointsValue = story.storyPoints ?? story.story_points ?? null;
      const storyPointsFormValue =
        storyPointsValue === null ||
        storyPointsValue === undefined ||
        storyPointsValue === 0
          ? ""
          : storyPointsValue;

      const currentStatus = story.status || "";

      setFormData({
        title: story.title || "",
        description: story.description || "",
        status: currentStatus,
        acceptanceCriteria: Array.isArray(story.acceptanceCriteria)
          ? story.acceptanceCriteria
          : [],
        storyPoints: storyPointsFormValue,
        moscowPriority: moscowPriority,
        assignees: parsedAssignees,
        tags: parsedTags,
        // New validation fields - use camelCase from story or snake_case fallback
        bv: story.bv ?? null,
        refinementSessionScheduled:
          story.refinementSessionScheduled ??
          story.refinement_session_scheduled ??
          false,
        groomed: story.groomed ?? false,
        dependencies: story.dependencies ?? [],
        sessionDocumented:
          story.sessionDocumented ?? story.session_documented ?? false,
        refinementDependencies:
          story.refinementDependencies ?? story.refinement_dependencies ?? [],
        teamApproval: story.teamApproval ?? story.team_approval ?? false,
        poApproval: story.poApproval ?? story.po_approval ?? false,
        sprintCapacity: story.sprintCapacity ?? story.sprint_capacity ?? null,
        skillsAvailable:
          story.skillsAvailable ?? story.skills_available ?? false,
        teamCommits: story.teamCommits ?? story.team_commits ?? false,
        tasksIdentified:
          story.tasksIdentified ?? story.tasks_identified ?? false,
      });
      if (story.activity && Array.isArray(story.activity)) {
        const formattedActivity = story.activity.map((item) => {
          if (typeof item === "string") {
            return {
              text: item,
              timestamp: new Date().toLocaleString(),
              isFromBackend: true,
            };
          }
          if (item.action) {
            return {
              text: item.action,
              timestamp: item.timestamp || new Date().toLocaleString(),
              isFromBackend: true,
            };
          }
          return { ...item, isFromBackend: true };
        });
        setActivity(formattedActivity);
      } else {
        setActivity([]);
      }
    }
  }, [story?.id]);

  const updateCriteria = (index, value) => {
    const updated = [...formData.acceptanceCriteria];
    updated[index] = value;
    setFormData({ ...formData, acceptanceCriteria: updated });
  };

  const addCriterion = () => {
    if (formData.acceptanceCriteria.length >= 5) {
      alert("Maximum 5 acceptance criteria allowed");
      return;
    }
    setFormData({
      ...formData,
      acceptanceCriteria: [...formData.acceptanceCriteria, ""],
    });
  };

  const removeCriterion = (index) => {
    const updated = formData.acceptanceCriteria.filter((_, i) => i !== index);
    setFormData({ ...formData, acceptanceCriteria: updated });
  };

  // Dependencies functions
  const addDependency = () => {
    const currentDeps = formData.dependencies || [];
    if (currentDeps.length >= 10) {
      alert("Maximum 10 dependencies allowed");
      return;
    }
    setFormData({
      ...formData,
      dependencies: [...currentDeps, ""],
    });
  };

  const updateDependency = (index, value) => {
    const updated = [...(formData.dependencies || [])];
    updated[index] = value;
    setFormData({ ...formData, dependencies: updated });
  };

  const removeDependency = (index) => {
    const updated = (formData.dependencies || []).filter((_, i) => i !== index);
    setFormData({ ...formData, dependencies: updated });
  };

  // Refinement Dependencies functions
  const addRefinementDependency = () => {
    const currentDeps = formData.refinementDependencies || [];
    if (currentDeps.length >= 10) {
      alert("Maximum 10 refinement dependencies allowed");
      return;
    }
    setFormData({
      ...formData,
      refinementDependencies: [...currentDeps, ""],
    });
  };

  const updateRefinementDependency = (index, value) => {
    const updated = [...(formData.refinementDependencies || [])];
    updated[index] = value;
    setFormData({ ...formData, refinementDependencies: updated });
  };

  const removeRefinementDependency = (index) => {
    const updated = (formData.refinementDependencies || []).filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, refinementDependencies: updated });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const timestamp = new Date().toLocaleString();
      setActivity([...activity, { text: newComment, timestamp }]);
      setNewComment("");
    }
  };

  // Multi-select assignees helpers
  const toggleAssignee = (name) => {
    const current = formData.assignees || [];
    const next = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    setFormData({ ...formData, assignees: next });
  };

  const clearAssignees = () => {
    setFormData({ ...formData, assignees: [] });
  };

  // Form validation - same as NewIdeaForm (only title and description required)
  const isFormValid =
    (typeof formData.title === "string" && formData.title.trim() !== "") &&
    (typeof formData.description === "string" && formData.description.trim() !== "") &&
    formData.status !== "";

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation (title, description, status)
    if (!isFormValid) {
      const errors = {};
      if (!formData.title || formData.title.trim() === "") errors.title = "Title is required";
      if (!formData.description || formData.description.trim() === "") errors.description = "Description is required";
      setErrorState(errors);
      return;
    }

    // Visibility-dependent validation (bv, storyPoints) — match create behavior
    const submitErrors = {};
    if (
      visibleFields.bv &&
      (formData.bv === null || formData.bv === undefined || formData.bv === "")
    ) {
      submitErrors.bv = "Business value is required";
    } else if (visibleFields.bv && (formData.bv < 1 || formData.bv > 100)) {
      submitErrors.bv = "Business value must be 1-100";
    }

    const parsedStoryPointsValue =
      formData.storyPoints === null ||
      formData.storyPoints === undefined ||
      formData.storyPoints === "" ||
      formData.storyPoints === 0
        ? null
        : typeof formData.storyPoints === "string"
        ? parseInt(formData.storyPoints)
        : formData.storyPoints;
    if (visibleFields.storyPoints && parsedStoryPointsValue === null) {
      submitErrors.storyPoints = "Story points are required";
    } else if (
      visibleFields.storyPoints &&
      parsedStoryPointsValue !== null &&
      !STORY_POINTS_OPTIONS.includes(parsedStoryPointsValue)
    ) {
      submitErrors.storyPoints = "Invalid story points value";
    }

    if (Object.keys(submitErrors).length > 0) {
      setErrorState(submitErrors);
      return;
    }

    let finalActivity = [...activity];
    if (newComment.trim()) {
      const timestamp = new Date().toLocaleString();
      finalActivity.push({ text: newComment.trim(), timestamp });
    }

    const newComments = finalActivity.filter(
      (item) => item.text && !item.isFromBackend
    );

    const moscowPriorityValue =
      formData.moscowPriority !== null &&
      formData.moscowPriority !== undefined &&
      formData.moscowPriority !== "" &&
      formData.moscowPriority.trim() !== ""
        ? formData.moscowPriority.trim()
        : null;

    const storyPointsValue =
      formData.storyPoints === null ||
      formData.storyPoints === undefined ||
      formData.storyPoints === "" ||
      formData.storyPoints === 0
        ? null
        : typeof formData.storyPoints === "string"
        ? parseInt(formData.storyPoints)
        : formData.storyPoints;

    const submitData = {
      id: story.id, // Include id so backend knows which story to update
      title: formData.title,
      description: formData.description,
      status: formData.status,
      assignees: formData.assignees || [],
      tags: formData.tags || [],
      acceptance_criteria: formData.acceptanceCriteria.filter((c) => c.trim()),
      story_points: parsedStoryPointsValue,
      moscow_priority: moscowPriorityValue,
      bv:
        formData.bv !== null && formData.bv !== ""
          ? parseInt(formData.bv)
          : null,
      refinement_session_scheduled:
        formData.refinementSessionScheduled || false,
      groomed: formData.groomed || false,
      session_documented: formData.sessionDocumented || false,
      dependencies: (formData.dependencies || []).filter((d) => d && d.trim()),
      team_approval: formData.teamApproval || false,
      po_approval: formData.poApproval || false,
      sprint_capacity:
        formData.sprintCapacity !== null && formData.sprintCapacity !== ""
          ? parseInt(formData.sprintCapacity)
          : null,
      skills_available: formData.skillsAvailable || false,
      team_commits: formData.teamCommits || false,
      tasks_identified: formData.tasksIdentified || false,
      // Send activity - include only NEW user-added comments
      activity: newComments,
    };
    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Title */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-title" className="text-right">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="edit-title"
          placeholder="Enter the title"
          className={`col-span-3 ${errorState.title ? "border-red-500" : ""}`}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        {errorState.title && <p className="text-red-500 text-sm col-span-4">{errorState.title}</p>}
      </div>

      {/* Description */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="edit-description" className="text-right pt-2">
          Description <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="edit-description"
          placeholder="Describe the story"
          className={`col-span-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-vertical min-h-24 ${errorState.description ? "border-red-500" : ""}`}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
        />
        {errorState.description && <p className="text-red-500 text-sm col-span-4">{errorState.description}</p>}
      </div>

      {/* Acceptance Criteria */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">Acceptance Criteria</Label>
        <div className="col-span-3 space-y-2">
          {formData.acceptanceCriteria.map((criteria, index) => (
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
              disabled={formData.acceptanceCriteria.length >= 5}
            >
              + Add Criterion
            </Button>
            <span className="text-xs text-muted-foreground">
              {formData.acceptanceCriteria.length}/5 criteria
            </span>
          </div>
        </div>
      </div>

      {/* Story Points */}
      {/* Story Points - only show if required by FIELD_VISIBILITY for current status */}
      {visibleFields.storyPoints && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-story-points" className="text-right">
            Story Points
          </Label>
          <div className="col-span-3">
            <Input
              id="edit-story-points"
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="e.g., 8 (0-100)"
              value={formData.storyPoints ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === null) {
                  setFormData({ ...formData, storyPoints: null });
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 0 && num <= 100) {
                    setFormData({ ...formData, storyPoints: num });
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
      {/* Business Value */}
      {visibleFields.bv && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-bv" className="text-right">
            Business Value
          </Label>
          <div className="col-span-3">
            <Input
              id="edit-bv"
              type="number"
              min="1"
              max="100"
              placeholder="Enter business value (1-100)"
              value={formData.bv ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === null) {
                  setFormData({ ...formData, bv: null });
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 1 && num <= 100) {
                    setFormData({ ...formData, bv: num });
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

      {/* MoSCoW Priority */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-moscow-priority" className="text-right">
          MoSCoW Priority
        </Label>
        <div className="col-span-3">
          <select
            id="edit-moscow-priority"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={
              formData.moscowPriority === null ||
              formData.moscowPriority === undefined
                ? ""
                : formData.moscowPriority
            }
            onChange={(e) => {
              const val = e.target.value;
              setFormData({
                ...formData,
                moscowPriority: val === "" ? "" : val,
              });
            }}
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
        <Label htmlFor="edit-status" className="text-right">
          Status <span className="text-red-500">*</span>
        </Label>
        <div className="col-span-3">
          <select
            id="edit-status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
          >
            <option value="">Select a status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Business Value - visible from Proposed onwards */}
      {visibleFields.bv && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-bv" className="text-right">
            Business Value
          </Label>
          <div className="col-span-3">
            <Input
              id="edit-bv"
              type="number"
              min="1"
              max="100"
              placeholder="Enter business value (1-100)"
              value={formData.bv ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === null) {
                  setFormData({ ...formData, bv: null });
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 1 && num <= 100) {
                    setFormData({ ...formData, bv: num });
                  }
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required to move from Backlog to Proposed
            </p>
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
              id="edit-refinementSessionScheduled"
              checked={formData.refinementSessionScheduled || false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  refinementSessionScheduled: checked,
                })
              }
            />
            <Label
              htmlFor="edit-refinementSessionScheduled"
              className="text-sm font-normal"
            >
              Refinement Session Scheduled
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-groomed"
              checked={formData.groomed || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, groomed: checked })
              }
            />
            <Label htmlFor="edit-groomed" className="text-sm font-normal">
              Story is Groomed
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-sessionDocumented"
              checked={formData.sessionDocumented || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sessionDocumented: checked })
              }
            />
            <Label
              htmlFor="edit-sessionDocumented"
              className="text-sm font-normal"
            >
              Session Documented
            </Label>
          </div>

          {/* Dependencies */}
          <div className="space-y-2 pt-2">
            <Label className="text-sm">Dependencies</Label>
            {(formData.dependencies || []).map((dep, index) => (
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
              disabled={(formData.dependencies || []).length >= 10}
            >
              + Add Dependency
            </Button>
          </div>
        </div>
      )}

      {/* In Refinement Fields */}
      {visibleFields.refinementDependencies && (
        <div className="border rounded-lg p-4 space-y-3 bg-purple-50/50">
          <h4 className="font-medium text-sm text-purple-800">
            In Refinement Requirements
          </h4>

          {/* Refinement Dependencies */}
          <div className="space-y-2">
            <Label className="text-sm">Refinement Dependencies</Label>
            {(formData.refinementDependencies || []).map((dep, index) => (
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
              disabled={(formData.refinementDependencies || []).length >= 10}
            >
              + Add Refinement Dependency
            </Button>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="edit-teamApproval"
              checked={formData.teamApproval || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, teamApproval: checked })
              }
            />
            <Label htmlFor="edit-teamApproval" className="text-sm font-normal">
              Team Approval
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-poApproval"
              checked={formData.poApproval || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, poApproval: checked })
              }
            />
            <Label htmlFor="edit-poApproval" className="text-sm font-normal">
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
            <Label htmlFor="edit-sprintCapacity" className="text-right text-sm">
              Sprint Capacity
            </Label>
            <div className="col-span-3">
              <Input
                id="edit-sprintCapacity"
                type="number"
                min="1"
                placeholder="Enter sprint capacity"
                value={formData.sprintCapacity ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    sprintCapacity: val === "" ? null : parseInt(val),
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-skillsAvailable"
              checked={formData.skillsAvailable || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, skillsAvailable: checked })
              }
            />
            <Label
              htmlFor="edit-skillsAvailable"
              className="text-sm font-normal"
            >
              Skills Available in Team
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-teamCommits"
              checked={formData.teamCommits || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, teamCommits: checked })
              }
            />
            <Label htmlFor="edit-teamCommits" className="text-sm font-normal">
              Team Commits to Deliver
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-tasksIdentified"
              checked={formData.tasksIdentified || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, tasksIdentified: checked })
              }
            />
            <Label
              htmlFor="edit-tasksIdentified"
              className="text-sm font-normal"
            >
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
              {(formData.assignees || []).length === 0 ? (
                <span className="text-muted-foreground">
                  Select assignees...
                </span>
              ) : (
                (formData.assignees || []).map((name) => (
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
              {(formData.assignees || []).length > 0 && (
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
                      checked={(formData.assignees || []).includes(member.name)}
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
      <TagsDropdown newIdea={formData} setNewIdea={setFormData} />

      {/* Activity and Comments */}
      <div className="grid grid-cols-4 items-start gap-4 pt-4 border-t">
        <Label className="text-right pt-2">Activity & Comments</Label>
        <div className="col-span-3 space-y-3">
          {/* Activity Feed */}
          <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-50 rounded-md p-3">
            {activity && activity.length > 0 ? (
              activity.map((item, index) => (
                <div
                  key={index}
                  className="text-sm border-l-2 border-blue-300 pl-2 py-1"
                >
                  <p className="text-muted-foreground text-xs">
                    {item.timestamp}
                  </p>
                  <p className="text-foreground">{item.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No comments yet</p>
            )}
          </div>

          {/* Comment Input */}
          <div className="flex gap-2">
            <textarea
              placeholder="Add a comment..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              rows="2"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddComment}
              className="shrink-0 h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={!isFormValid}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default EditStoryForm;
