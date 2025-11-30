import { useState, useRef, useEffect } from "react";
import { Plus, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/taskComponent/TaskCard";

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
  onSort,
  isOperationInProgress = false,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (sortBy) => {
    if (onSort) {
      onSort(title, sortBy);
    }
    setIsMenuOpen(false);
  };

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
        </div>

        <div className="flex items-center">
          {}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddTask && onAddTask(title)}
            disabled={isOperationInProgress}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <div className="relative" ref={menuRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={isOperationInProgress}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-md border bg-white shadow-lg z-20">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" />
                  Sort by
                </div>
                <button
                  onClick={() => handleSort("title")}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent"
                >
                  Title (A-Z)
                </button>
                <button
                  onClick={() => handleSort("storyPoints")}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent"
                >
                  Story Points
                </button>
                <button
                  onClick={() => handleSort("dateCreated")}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent"
                >
                  Date Created
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column Body */}
      <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
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
          ))
        ) : (
          <div className="text-sm text-gray-400 text-center mt-4">
            No tasks yet.
          </div>
        )}
      </div>
    </div>
  );
}
