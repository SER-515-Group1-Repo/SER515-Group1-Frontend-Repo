import React, { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Pencil,
  UserPlus,
  Trash2,
  ArrowUp,
  User,
  Tag,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVisibleFields } from "@/lib/constants";

export function TaskCard({ task, onEdit, onAssign, onDelete, onMoveToTop, onPreview, isOperationInProgress = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleDragStart = (e) => {
    if (isOperationInProgress) {
      e.preventDefault();
      return; // Prevent drag during operations
    }
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
    }
  };

  const handleAssign = () => {
    setIsMenuOpen(false);
    if (onAssign) {
      onAssign(task);
    }
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(task);
    }
  };

  const handleMoveToTop = () => {
    setIsMenuOpen(false);
    if (onMoveToTop) {
      onMoveToTop(task);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(task);
    }
  };

  const parsedTags = Array.isArray(task.tags)
    ? task.tags
    : typeof task.tags === "string"
    ? task.tags.split(",").map((t) => t.trim())
    : [];

  return (
    <div
      className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3 relative cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Header with Title and Menu */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex-1 cursor-pointer group"
          onClick={handlePreview}
        >
          <div className="text-xs font-semibold text-primary underline group-hover:text-primary/80">
            <span>#{task?.id || ""}</span> {task?.title || "Task"}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {task?.description ? task.description.substring(0, 60) + (task.description.length > 60 ? "..." : "") : ""}
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            disabled={isOperationInProgress}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-50 w-48 rounded-md border bg-white shadow-lg py-1">
              <button
                onClick={handlePreview}
                disabled={isOperationInProgress}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="h-4 w-4 text-teal-600" />
                <span className="text-teal-600">Preview</span>
              </button>
              <button
                onClick={handleEdit}
                disabled={isOperationInProgress}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pencil className="h-4 w-4 text-teal-600" />
                <span className="text-teal-600">Edit</span>
              </button>
              <button
                onClick={handleAssign}
                disabled={isOperationInProgress}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="h-4 w-4 text-teal-600" />
                <span className="text-teal-600">Assign To</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={isOperationInProgress}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 text-teal-600" />
                <span className="text-teal-600">Delete</span>
              </button>
              <button
                onClick={handleMoveToTop}
                disabled={isOperationInProgress}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUp className="h-4 w-4 text-teal-600" />
                <span className="text-teal-600">Move to top</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assignee Section */}
      {task?.assignee && task.assignee !== "Unassigned" && (
        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs w-fit">
          <User className="h-3 w-3 text-blue-600" />
          <span className="text-blue-600 font-medium">{task.assignee}</span>
        </div>
      )}

      {/* Story Points Section - only show for Ready To Commit and Sprint Ready */}
{(() => {
  const visibleFields = getVisibleFields(task?.status);
  if (visibleFields.storyPoints && task?.storyPoints) {
    return (
      <div className="flex items-center gap-1.5 bg-cyan-50 px-2.5 py-1 rounded-md text-xs w-fit border border-cyan-200 shadow-sm">
        <span className="text-cyan-700 font-semibold">{task.storyPoints}</span>
        <span className="text-cyan-600">points</span>
      </div>
    );
  }
  return null;
})()}

      {/* Tags Section */}
      {parsedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {parsedTags.map((tag, idx) => (
            <div
              key={idx}
              className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded flex items-center gap-1"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </div>
          ))}
        </div>
      )}

      {/* MVP Badge and MoSCoW Priority Badge */}
      <div className="flex flex-wrap gap-1 pt-1">
        {/* MVP Badge - Show when MVP Score >= 1.0 AND storyPoints field is visible (Ready To Commit, Sprint Ready) */}
        {(() => {
          const visibleFields = getVisibleFields(task?.status);
          // Only show MVP badge when storyPoints are visible (Ready To Commit, Sprint Ready)
          if (!visibleFields.storyPoints) return null;
          
          // Use actual bv field, default to 0 if not set
          const businessValue = task.bv ?? 0;
          const storyPoints = task.storyPoints ?? task.story_points ?? null;
          const hasValidValues = storyPoints !== null && storyPoints !== undefined && storyPoints > 0 && businessValue > 0;
          const mvpScore = hasValidValues ? businessValue / storyPoints : 0;
          
          if (mvpScore >= 1.0) {
            return (
              <div className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                MVP
              </div>
            );
          }
          return null;
        })()}

        {/* MoSCoW Priority Badge - Show when priority is set (not null/empty) */}
        {(() => {
          const moscowPriority = task.moscowPriority ?? task.moscow_priority ?? null;
          if (moscowPriority && moscowPriority !== "" && moscowPriority !== "Select priority (optional)") {
            return (
              <div className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                <Tag className="h-2.5 w-2.5" />
                {moscowPriority}
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}
