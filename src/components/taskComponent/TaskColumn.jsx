import React, { useState, useMemo, useEffect } from "react";
import { Plus, MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/taskComponent/TaskCard";

// Performance threshold: use pagination for columns with more than this many tasks
const PAGINATION_THRESHOLD = 20;
const INITIAL_ITEMS_TO_SHOW = 20;

export function TaskColumn({
  title,
  dotColor,
  tasks = [],
  onAddTask,
  onEdit,
  onDrop,
  onAssign,
  onDelete,
  onMoveToTop,
  onPreview,
  isOperationInProgress = false,
}) {
  const [showAll, setShowAll] = useState(false);
  
  // Reset showAll when tasks change significantly (e.g., after filter/search)
  useEffect(() => {
    if (tasks.length <= PAGINATION_THRESHOLD) {
      setShowAll(false);
    }
  }, [tasks.length]);
  
  // Memoize visible tasks to prevent unnecessary re-renders
  const visibleTasks = useMemo(() => {
    if (tasks.length <= PAGINATION_THRESHOLD || showAll) {
      return tasks;
    }
    return tasks.slice(0, INITIAL_ITEMS_TO_SHOW);
  }, [tasks, showAll]);

  const hasMoreTasks = tasks.length > INITIAL_ITEMS_TO_SHOW && !showAll;
  const remainingCount = tasks.length - INITIAL_ITEMS_TO_SHOW;

  const handleDragOver = (e) => {
    if (isOperationInProgress) return; // Prevent drag during operations
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#f3f4f6";
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "";

    if (isOperationInProgress) {
      e.preventDefault();
      return; // Prevent drop during operations
    }

    const taskData = e.dataTransfer.getData("application/json");
    if (taskData && onDrop) {
      const task = JSON.parse(taskData);
      onDrop(task, title);
    }
  };

  return (
    <div
      className="flex-1 min-w-72 border border-gray-100 rounded-lg p-4 bg-gray-50 flex flex-col h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4 flex-none">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <h2 className="font-semibold text-foreground">{title}</h2>
          {tasks.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          )}
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddTask && onAddTask(title)}
            disabled={isOperationInProgress}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={isOperationInProgress}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Column Body */}
      <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
        {visibleTasks.length > 0 ? (
          <>
            {visibleTasks.map((task, index) => (
              <TaskCard
                key={`${task.id}-${index}`}
                task={task}
                onEdit={onEdit}
                onAssign={onAssign}
                onDelete={onDelete}
                onMoveToTop={onMoveToTop}
                onPreview={onPreview}
                isOperationInProgress={isOperationInProgress}
              />
            ))}
            {hasMoreTasks && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(true)}
                  className="w-full text-xs"
                  disabled={isOperationInProgress}
                >
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Show {remainingCount} more
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-400 text-center mt-4">
            No tasks yet.
          </div>
        )}
      </div>
    </div>
  );
}
