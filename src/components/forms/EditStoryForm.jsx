import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Send, ChevronDown, AlertTriangle, CheckCircle } from "lucide-react";
import TagsDropdown from "@/components/common/TagsDropdown";
import { 
  STATUS_OPTIONS, 
  STORY_POINTS_OPTIONS, 
  PRIORITY_OPTIONS, 
  BUSINESS_VALUE_OPTIONS,
  validateTransition 
} from "../../lib/constants";

const EditStoryForm = ({ story, onSave, teamMembers }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    acceptanceCriteria: [],
    storyPoints: "",
    assignees: [],
    tags: [],
    // New fields for validation matrix
    businessValue: "",
    priority: "",
    sessionScheduled: false,
    isGroomed: false,
    dependenciesIdentified: false,
    dependenciesResolved: false,
    teamApproval: false,
    poApproval: false,
    capacityConfirmed: false,
    skillsAvailable: false,
    teamCommitted: false,
  });

  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [validationWarning, setValidationWarning] = useState(null);
  const [originalStatus, setOriginalStatus] = useState("");
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

  useEffect(() => {
    if (story) {
      // Parse tags - could be string, array, or empty
      let parsedTags = [];
      if (story.tags) {
        if (typeof story.tags === 'string') {
          parsedTags = story.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (Array.isArray(story.tags)) {
          parsedTags = story.tags;
        }
      }
      
      // Parse assignees - could be string, array, or empty
      let parsedAssignees = [];
      if (story.assignees) {
        if (Array.isArray(story.assignees)) {
          parsedAssignees = story.assignees;
        } else if (typeof story.assignees === 'string') {
          parsedAssignees = story.assignees.split(',').map(a => a.trim()).filter(a => a);
        }
      }
      
      const currentStatus = story.status || "";
      setOriginalStatus(currentStatus);
      setValidationWarning(null);
      
      setFormData({
        title: story.title || "",
        description: story.description || "",
        status: currentStatus,
        acceptanceCriteria: Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria : [],
        storyPoints: story.storyPoints !== undefined && story.storyPoints !== null ? story.storyPoints : "",
        assignees: parsedAssignees,
        tags: parsedTags,
        // New fields - use dummy data for now (will come from backend later)
        businessValue: story.businessValue || "",
        priority: story.priority || "",
        sessionScheduled: story.sessionScheduled || false,
        isGroomed: story.isGroomed || false,
        dependenciesIdentified: story.dependenciesIdentified || false,
        dependenciesResolved: story.dependenciesResolved || false,
        teamApproval: story.teamApproval || false,
        poApproval: story.poApproval || false,
        capacityConfirmed: story.capacityConfirmed || false,
        skillsAvailable: story.skillsAvailable || false,
        teamCommitted: story.teamCommitted || false,
      });
      if (story.activity && Array.isArray(story.activity)) {
        const formattedActivity = story.activity.map((item) => {
          if (typeof item === "string") {
            return { text: item, timestamp: new Date().toLocaleString(), isFromBackend: true };
          }
          if (item.action) {
            return {
              text: item.action,
              timestamp: item.timestamp || new Date().toLocaleString(),
              isFromBackend: true,  // Mark as existing backend entry
            };
          }
          return { ...item, isFromBackend: true };
        });
        setActivity(formattedActivity);
      } else {
        // Clear activity if no activity in story (different task opened)
        setActivity([]);
      }
    }
  }, [story]);

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

  // Handle status change with validation
  const handleStatusChange = (newStatus) => {
    if (newStatus === originalStatus || !originalStatus) {
      setFormData({ ...formData, status: newStatus });
      setValidationWarning(null);
      return;
    }

    const validation = validateTransition(formData, originalStatus, newStatus);
    
    if (!validation.valid) {
      setValidationWarning({
        type: "error",
        message: validation.errors[0],
        missingFields: validation.missingFields,
      });
      // Still allow the change but show warning
      setFormData({ ...formData, status: newStatus });
    } else if (validation.isBackward) {
      setValidationWarning({
        type: "warning",
        message: "Moving story backward in the workflow",
        missingFields: [],
      });
      setFormData({ ...formData, status: newStatus });
    } else {
      setValidationWarning(null);
      setFormData({ ...formData, status: newStatus });
    }
  };

  // Form validation - same as NewIdeaForm (only title and description required)
  const isFormValid =
    formData.title.trim() !== "" &&
    formData.description.trim() !== "" &&
    formData.status !== "";

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    // If there's an unsent comment in the textarea, add it to activity before saving
    let finalActivity = [...activity];
    if (newComment.trim()) {
      const timestamp = new Date().toLocaleString();
      finalActivity.push({ text: newComment.trim(), timestamp });
    }
    
    // Get only NEW user-added comments (items without isFromBackend flag)
    const newComments = finalActivity.filter((item) => item.text && !item.isFromBackend);
    
    const submitData = {
      ...story,
      ...formData,
      acceptanceCriteria: formData.acceptanceCriteria.filter((c) => c.trim()),
      storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null,
      // Also send snake_case versions for backend compatibility
      acceptance_criteria: formData.acceptanceCriteria.filter((c) => c.trim()),
      story_points: formData.storyPoints ? parseInt(formData.storyPoints) : null,
      business_value: formData.businessValue ? parseInt(formData.businessValue) : null,
      // New validation fields (will be stored when backend supports them)
      businessValue: formData.businessValue ? parseInt(formData.businessValue) : null,
      priority: formData.priority || null,
      sessionScheduled: formData.sessionScheduled,
      isGroomed: formData.isGroomed,
      dependenciesIdentified: formData.dependenciesIdentified,
      dependenciesResolved: formData.dependenciesResolved,
      teamApproval: formData.teamApproval,
      poApproval: formData.poApproval,
      capacityConfirmed: formData.capacityConfirmed,
      skillsAvailable: formData.skillsAvailable,
      teamCommitted: formData.teamCommitted,
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
          className="col-span-3"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      {/* Description */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="edit-description" className="text-right pt-2">
          Description <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="edit-description"
          placeholder="Describe the story"
          className="col-span-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-vertical min-h-24"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
        />
      </div>

      {/* Acceptance Criteria */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">Acceptance Criteria</Label>
        <div className="col-span-3 space-y-2">
          {formData.acceptanceCriteria.map((criteria, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
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
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-story-points" className="text-right">
          Story Points
        </Label>
        <div className="col-span-3">
          <select
            id="edit-story-points"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.storyPoints === null || formData.storyPoints === "" ? "" : formData.storyPoints}
            onChange={(e) => {
              const val = e.target.value;
              setFormData({ 
                ...formData, 
                storyPoints: val === "" ? "" : parseInt(val) 
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
          <p className="text-xs text-muted-foreground mt-1">Fibonacci sequence values</p>
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
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">Select a status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {/* Validation Warning */}
          {validationWarning && (
            <div className={`mt-2 p-2 rounded-md text-sm flex items-start gap-2 ${
              validationWarning.type === "error" 
                ? "bg-red-50 border border-red-200 text-red-700" 
                : "bg-yellow-50 border border-yellow-200 text-yellow-700"
            }`}>
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{validationWarning.message}</p>
                {validationWarning.missingFields && validationWarning.missingFields.length > 0 && (
                  <ul className="mt-1 text-xs list-disc list-inside">
                    {validationWarning.missingFields.map((field, idx) => (
                      <li key={idx}>{field}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Business Value */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-business-value" className="text-right">
          Business Value
        </Label>
        <div className="col-span-3">
          <select
            id="edit-business-value"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.businessValue}
            onChange={(e) => setFormData({ ...formData, businessValue: e.target.value ? parseInt(e.target.value) : "" })}
          >
            <option value="">Select business value...</option>
            {BUSINESS_VALUE_OPTIONS.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">Scale of 1-10 (10 = highest value)</p>
        </div>
      </div>

      {/* Priority */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-priority" className="text-right">
          Priority
        </Label>
        <select
          id="edit-priority"
          className="col-span-3 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        >
          <option value="">Select priority...</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      {/* Refinement Checklist - Only show for relevant statuses */}
      {(formData.status === "Needs Refinement" || formData.status === "In Refinement" || 
        formData.status === "Ready To Commit" || formData.status === "Sprint Ready") && (
        <div className="grid grid-cols-4 items-start gap-4 pt-2 border-t">
          <Label className="text-right pt-2">Refinement Checklist</Label>
          <div className="col-span-3 space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sessionScheduled}
                onChange={(e) => setFormData({ ...formData, sessionScheduled: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Refinement session scheduled</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isGroomed}
                onChange={(e) => setFormData({ ...formData, isGroomed: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Story has been groomed</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dependenciesIdentified}
                onChange={(e) => setFormData({ ...formData, dependenciesIdentified: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Dependencies identified</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dependenciesResolved}
                onChange={(e) => setFormData({ ...formData, dependenciesResolved: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Dependencies resolved</span>
            </label>
          </div>
        </div>
      )}

      {/* Approval Checklist - Only show for Ready To Commit and Sprint Ready */}
      {(formData.status === "Ready To Commit" || formData.status === "Sprint Ready") && (
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right pt-2">Approvals</Label>
          <div className="col-span-3 space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.teamApproval}
                onChange={(e) => setFormData({ ...formData, teamApproval: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="flex items-center gap-1">
                Team approval
                {formData.teamApproval && <CheckCircle className="h-3 w-3 text-green-500" />}
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.poApproval}
                onChange={(e) => setFormData({ ...formData, poApproval: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="flex items-center gap-1">
                Product Owner approval
                {formData.poApproval && <CheckCircle className="h-3 w-3 text-green-500" />}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Sprint Readiness - Only show for Sprint Ready */}
      {formData.status === "Sprint Ready" && (
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right pt-2">Sprint Readiness</Label>
          <div className="col-span-3 space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.capacityConfirmed}
                onChange={(e) => setFormData({ ...formData, capacityConfirmed: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Capacity confirmed</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.skillsAvailable}
                onChange={(e) => setFormData({ ...formData, skillsAvailable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Required skills available</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.teamCommitted}
                onChange={(e) => setFormData({ ...formData, teamCommitted: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Team committed to delivery</span>
            </label>
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
                <span className="text-muted-foreground">Select assignees...</span>
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
        <Button type="submit" disabled={!isFormValid}>Save Changes</Button>
      </div>
    </form>
  );
};

export default EditStoryForm;
