import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Send, ChevronDown } from "lucide-react";
import TagsDropdown from "@/components/common/TagsDropdown";
import { STATUS_OPTIONS, STORY_POINTS_OPTIONS } from "../../lib/constants";

const EditStoryForm = ({ story, onSave, teamMembers }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    acceptanceCriteria: [],
    storyPoints: "",
    businessValue: "",
    moscowPriority: "",
    assignees: [],
    tags: [],
  });

  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState("");
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

  useEffect(() => {
    // Only initialize form when story ID changes (new story selected), not on every story prop update
    if (story && story.id) {
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
      
      // Handle moscowPriority - check for null/undefined/empty string explicitly
      const moscowPriorityValue = story.moscowPriority ?? story.moscow_priority ?? null;
      const moscowPriority = (moscowPriorityValue === null || moscowPriorityValue === undefined || moscowPriorityValue === "") ? "" : moscowPriorityValue;
      
      // Handle story points - convert null/undefined/0 to empty string for form display
      const storyPointsValue = story.storyPoints ?? story.story_points ?? null;
      const storyPointsFormValue = (storyPointsValue === null || storyPointsValue === undefined || storyPointsValue === 0) ? "" : storyPointsValue;
      
      // Handle business value - convert null/undefined/0 to empty string for form display
      const businessValueValue = story.businessValue ?? story.business_value ?? null;
      const businessValueFormValue = (businessValueValue === null || businessValueValue === undefined || businessValueValue === 0) ? "" : businessValueValue;
      
      setFormData({
        title: story.title || "",
        description: story.description || "",
        status: story.status || "",
        acceptanceCriteria: Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria : [],
        storyPoints: storyPointsFormValue,
        businessValue: businessValueFormValue,
        moscowPriority: moscowPriority,
        assignees: parsedAssignees,
        tags: parsedTags,
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
  }, [story?.id]); // Only re-initialize when story ID changes, not when story properties update

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
    
    // Handle moscowPriority - convert empty string to null, preserve actual values
    const moscowPriorityValue = (formData.moscowPriority !== null && 
                                 formData.moscowPriority !== undefined && 
                                 formData.moscowPriority !== "" && 
                                 formData.moscowPriority.trim() !== "") 
      ? formData.moscowPriority.trim() 
      : null;
    
    // Handle story points and business value - convert empty string, 0, or null to null
    // Empty string means user cleared the field
    const storyPointsValue = (formData.storyPoints === null || formData.storyPoints === undefined || formData.storyPoints === "" || formData.storyPoints === 0)
      ? null
      : (typeof formData.storyPoints === 'string' ? parseInt(formData.storyPoints) : formData.storyPoints);
    
    const businessValueValue = (formData.businessValue === null || formData.businessValue === undefined || formData.businessValue === "" || formData.businessValue === 0)
      ? null
      : (typeof formData.businessValue === 'string' ? parseInt(formData.businessValue) : formData.businessValue);
    
    // Build submit data - send only snake_case (backend standard) to avoid duplicates
    // Don't spread story/formData to avoid duplicate fields
    // Include id from story so handleSaveEdit can use it
    const submitData = {
      id: story.id, // Include id so backend knows which story to update
      title: formData.title,
      description: formData.description,
      status: formData.status,
      assignees: formData.assignees || [],
      tags: formData.tags || [],
      acceptance_criteria: formData.acceptanceCriteria.filter((c) => c.trim()),
      story_points: storyPointsValue,
      business_value: businessValueValue,
      moscow_priority: moscowPriorityValue,
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

      {/* Business Value */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-business-value" className="text-right">
          Business Value
        </Label>
        <div className="col-span-3">
          <Input
            id="edit-business-value"
            type="number"
            min="0"
            max="10"
            step="1"
            placeholder="e.g., 8 (0-10) or leave empty"
            value={formData.businessValue === null || formData.businessValue === undefined || formData.businessValue === "" ? "" : String(formData.businessValue)}
            onChange={(e) => {
              const val = e.target.value;
              // When user clears the field, set to empty string (will be converted to null on submit)
              if (val === "" || val === null) {
                setFormData({ ...formData, businessValue: "" });
              } else {
                const num = parseInt(val);
                if (!isNaN(num) && num >= 0 && num <= 10) {
                  setFormData({ ...formData, businessValue: num });
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
        <Label htmlFor="edit-moscow-priority" className="text-right">
          MoSCoW Priority
        </Label>
        <div className="col-span-3">
          <select
            id="edit-moscow-priority"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.moscowPriority === null || formData.moscowPriority === undefined ? "" : formData.moscowPriority}
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
        <select
          id="edit-status"
          className="col-span-3 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="">Select a status</option>
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
