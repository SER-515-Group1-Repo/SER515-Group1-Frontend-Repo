import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Send } from "lucide-react";
import TagsDropdown from "@/components/common/TagsDropdown";
import { STATUS_OPTIONS } from "../../lib/constants";

const EditStoryForm = ({ story, onSave, teamMembers }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    acceptanceCriteria: [],
    storyPoints: "",
    assignee: "",
    tags: [],
  });

  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title || "",
        description: story.description || "",
        status: story.status || "",
        acceptanceCriteria: story.acceptanceCriteria || [],
        storyPoints: story.storyPoints || "",
        assignee: story.assignee || "",
        tags: story.tags || [],
      });
      // Initialize activity from story if available
      // Backend may return activity as array of strings or objects
      if (story.activity && Array.isArray(story.activity)) {
        const formattedActivity = story.activity.map((item) => {
          if (typeof item === "string") {
            return { text: item, timestamp: new Date().toLocaleString() };
          }
          // If it's an object with "action" property from backend
          if (item.action) {
            return {
              text: item.action,
              timestamp: item.timestamp || new Date().toLocaleString(),
            };
          }
          return item;
        });
        setActivity(formattedActivity);
      }
    }
  }, [story]);

  const updateCriteria = (index, value) => {
    const updated = [...formData.acceptanceCriteria];
    updated[index] = value;
    setFormData({ ...formData, acceptanceCriteria: updated });
  };

  const addCriterion = () => {
    // Check if we already have 5 criteria
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...story,
      ...formData,
      acceptanceCriteria: formData.acceptanceCriteria.filter((c) => c.trim()),
      storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null,
      activity,
    });
  };

  const teamMembersWithDefault = [
    { name: "Select an assignee", id: 0, role: "" },
    ...teamMembers,
  ];

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Title */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-title" className="text-right">
          Title
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
          Description
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
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Criterion ${index + 1}`}
                value={criteria}
                onChange={(e) => updateCriteria(index, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeCriterion(index)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="text-xs text-muted-foreground mb-2">
            {formData.acceptanceCriteria.length}/5 criteria
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCriterion}
            disabled={formData.acceptanceCriteria.length >= 5}
            className="w-full"
          >
            + Add Criterion
          </Button>
        </div>
      </div>

      {/* Story Points */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-story-points" className="text-right">
          Story Points
        </Label>
        <Input
          id="edit-story-points"
          type="number"
          min="0"
          max="100"
          placeholder="e.g., 8"
          className="col-span-3"
          value={formData.storyPoints}
          onChange={(e) =>
            setFormData({ ...formData, storyPoints: e.target.value })
          }
        />
      </div>

      {/* Status */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-status" className="text-right">
          Status
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

      {/* Assignee */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-assignee" className="text-right">
          Assignee
        </Label>
        <select
          id="edit-assignee"
          className="col-span-3 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.assignee}
          onChange={(e) =>
            setFormData({ ...formData, assignee: e.target.value })
          }
        >
          {teamMembersWithDefault.map((member, index) => (
            <option key={`${member.id}-${index}`} value={member.name}>
              {member.name}
            </option>
          ))}
        </select>
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
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

export default EditStoryForm;
