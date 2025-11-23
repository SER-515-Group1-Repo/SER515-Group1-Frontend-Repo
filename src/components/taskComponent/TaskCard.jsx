import React, { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Pencil,
  UserPlus,
  Trash2,
  ArrowUp,
  ListChecks,
  Target,
  User,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function TaskCard({ task, onEdit, onAssign, onDelete, onMoveToTop }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(task));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleEdit = () => {
    setIsMenuOpen(false);
    if (onEdit) {
      onEdit(task);
    } else {
      console.log("Edit card:", task);
    }
  };

  const handleAssign = () => {
    setIsMenuOpen(false);
    if (onAssign) {
      onAssign(task);
    } else {
      console.log("Assign To:", task);
    }
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(task);
    } else {
      console.log("Delete card:", task);
    }
  };

  const handleMoveToTop = () => {
    setIsMenuOpen(false);
    if (onMoveToTop) {
      onMoveToTop(task);
    } else {
      console.log("Move to top:", task);
    }
  };

  return (
    <div
      className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3 relative cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Header with Title and Menu */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div
            className="text-xs font-semibold text-primary underline hover:text-primary/80"
            onClick={handleEdit}
          >
            <span>#{task?.id || ""}</span> {task?.title || "Task"}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {task?.description || ""}
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-50 w-48 rounded-md border bg-white shadow-lg py-1">
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4 text-teal-600" />
                <span className="text-teal-600">Edit card</span>
              </button>
              <button
                onClick={handleAssign}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-gray-50"
              >
                <UserPlus className="h-4 w-4 text-teal-600" />
                <span className="text-teal-600">Assign To</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-gray-50"
              >
                <Trash2 className="h-4 w-4 text-teal-600" />
                <span className="text-teal-600">Delete card</span>
              </button>
              <button
                onClick={handleMoveToTop}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-gray-50"
              >
                <ArrowUp className="h-4 w-4 text-teal-600" />
                <span className="text-teal-600">Move to top</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Acceptance Criteria Section */}
      {task?.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
        <div className="border-t pt-2">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
            <ListChecks className="h-3 w-3" />
            <span>Acceptance Criteria:</span>
          </div>
          <ul className="space-y-1 pl-4">
            {task.acceptanceCriteria.map((criteria, idx) => (
              <li key={idx} className="text-xs text-muted-foreground list-disc">
                {criteria}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Story Points Badge */}
      {task?.storyPoints && (
        <div className="flex items-center gap-1 pt-1">
          <Target className="h-3 w-3 text-blue-600" />
          <span className="text-xs font-medium text-blue-600">
            {task.storyPoints} points
          </span>
        </div>
      )}

      {/* Assignee Section */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {task?.assignee && task.assignee !== "Unassigned" && (
          <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs">
            <User className="h-3 w-3 text-blue-600" />
            <span className="text-blue-600">{task.assignee}</span>
          </div>
        )}
      </div>

      {/* Tags Section */}
      {task?.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2">
          {Array.isArray(task.tags)
            ? task.tags.map((tag, idx) => (
                <div
                  key={idx}
                  className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded flex items-center gap-1"
                >
                  <Tag className="h-2 w-2" />
                  {tag}
                </div>
              ))
            : typeof task.tags === "string"
            ? task.tags.split(",").map((tag, idx) => (
                <div
                  key={idx}
                  className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded flex items-center gap-1"
                >
                  <Tag className="h-2 w-2" />
                  {tag.trim()}
                </div>
              ))
            : null}
        </div>
      )}
    </div>
  );
}
