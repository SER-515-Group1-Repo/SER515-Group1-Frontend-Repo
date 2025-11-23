import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Tag, Target, ListChecks, Pencil, Clock } from "lucide-react";

export function TaskPreviewModal({ task, isOpen, onClose, onEdit }) {
  if (!task) return null;

  const parsedTags = Array.isArray(task.tags)
    ? task.tags
    : typeof task.tags === "string"
    ? task.tags.split(",").map((t) => t.trim())
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between w-full">
            <div>
              <DialogTitle className="text-2xl">
                #{task.id} - {task.title}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {task.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Status
              </label>
              <p className="text-sm text-gray-600 mt-1">{task.status}</p>
            </div>

            {/* Assignee */}
            {task.assignee && task.assignee !== "Unassigned" && (
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Assignee
                </label>
                <p className="text-sm text-gray-600 mt-1">{task.assignee}</p>
              </div>
            )}

            {/* Story Points */}
            {task.storyPoints && (
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Story Points
                </label>
                <p className="text-sm text-gray-600 mt-1">{task.storyPoints}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {parsedTags.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {parsedTags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acceptance Criteria */}
          {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <ListChecks className="h-4 w-4" />
                Acceptance Criteria
              </label>
              <ul className="space-y-2 mt-2">
                {task.acceptanceCriteria.map((criteria, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-600 flex items-start gap-2"
                  >
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Activity / Comments */}
          {task.activity && task.activity.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Activity
              </label>
              <div className="space-y-3 mt-2 max-h-48 overflow-y-auto">
                {task.activity.map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded p-3 text-xs text-gray-700 border-l-2 border-blue-500"
                  >
                    <p className="font-medium text-gray-800">
                      {typeof entry === "string" ? entry : entry.action}
                    </p>
                    {typeof entry === "object" && entry.timestamp && (
                      <p className="text-gray-500 mt-1">{entry.timestamp}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onEdit(task);
              onClose();
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
