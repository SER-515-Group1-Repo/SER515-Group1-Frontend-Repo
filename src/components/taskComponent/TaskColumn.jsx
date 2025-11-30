import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/taskComponent/TaskCard";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export function TaskColumn({
  id,
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
  const { setNodeRef, isOver } = useDroppable({
    id: id || title,
    disabled: isOperationInProgress,
  });

  const taskIds = tasks.map((task) => String(task.id));

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-72 border border-gray-100 rounded-lg p-4 bg-gray-50 flex flex-col h-full transition-colors ${
        isOver ? "bg-blue-50 border-blue-300" : ""
      }`}
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
          <Button variant="ghost" size="icon" disabled={isOperationInProgress}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Column Body */}
      <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <TaskCard
                key={task.id}
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
        </SortableContext>
      </div>
    </div>
  );
}
