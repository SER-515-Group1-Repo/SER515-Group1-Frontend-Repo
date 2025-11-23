import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task/TaskCard";

export function TaskColumn({
  title,
  dotColor,
  tasks = [],
  onAddTask,
  onEdit,
  onDrop,
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#f3f4f6";
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "";

    const taskData = e.dataTransfer.getData("application/json");
    if (taskData && onDrop) {
      const task = JSON.parse(taskData);
      onDrop(task, title);
    }
  };

  return (
    <div
      className="flex-1 min-w-72 border border-gray-100 rounded-lg p-4 bg-gray-50"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddTask && onAddTask(title)}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Column Body */}
      <div className="space-y-4">
        {tasks.map((task, index) => (
          <TaskCard key={`${task.id}-${index}`} task={task} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
