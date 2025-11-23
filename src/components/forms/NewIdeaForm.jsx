import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import AssigneeDropdown from "@/components/common/AssigneeDropdown";
import { STATUS_OPTIONS } from "../../lib/constants";
import { Input } from "@/components/ui/input";
import TagsDropdown from "@/components/common/TagsDropdown";
import { ChevronDown } from "lucide-react";

const NewIdeaForm = ({
  newIdea,
  setNewIdea,
  teamMembers = [],
  selectedColumn,
}) => {
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const assigneeRef = useRef(null);

  const selectedAssignees = Array.isArray(newIdea.assignees)
    ? newIdea.assignees
    : newIdea.assignee
    ? [newIdea.assignee]
    : [];

  const hasAssignees = selectedAssignees.length > 0;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        setIsAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAssignee = (name) => {
    const next = selectedAssignees.includes(name)
      ? selectedAssignees.filter((a) => a !== name)
      : [...selectedAssignees, name];
    setNewIdea({
      ...newIdea,
      assignees: next,
      assignee: next[0] || "",
    });
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">
          Title
        </Label>
        <Input
          id="title"
          placeholder="e.g. Improve task filter UX"
          className="col-span-3"
          value={newIdea.title}
          onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="description" className="text-right pt-2">
          Description
        </Label>
        <textarea
          id="description"
          rows={4}
          placeholder="Briefly describe the idea…"
          className="col-span-3 h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                     ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={newIdea.description}
          onChange={(e) =>
            setNewIdea({ ...newIdea, description: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status
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

      <AssigneeDropdown
        newIdea={newIdea}
        setNewIdea={setNewIdea}
        teamMembers={teamMembers}
      />

      {/* Tags */}
      <TagsDropdown newIdea={newIdea} setNewIdea={setNewIdea} />
    </div>
  );
};

export default NewIdeaForm;
