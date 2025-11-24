import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { Header } from "@/components/layout/Header";
import { TaskColumn } from "@/components/Task/TaskColumn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import EditStoryForm from "@/components/forms/EditStoryForm";

import apiClient from "@/api/axios";

import { applyFilters } from "@/components/forms/FilterDropdown";
import NewIdeaForm from "@/components/forms/NewIdeaForm";
import { toastNotify } from "@/lib/utils";

const initialColumns = [
  {
    title: "Proposed",
    dotColor: "bg-gray-400",
    tasks: [],
  },
  {
    title: "Needs Refinement",
    dotColor: "bg-blue-500",
    tasks: [],
  },
  {
    title: "In Refinement",
    dotColor: "bg-yellow-500",
    tasks: [],
  },
  {
    title: "Ready To Commit",
    dotColor: "bg-purple-500",
    tasks: [],
  },
  {
    title: "Sprint Ready",
    dotColor: "bg-green-500",
    tasks: [],
  },
];

const dummyTeamMembers = [
  { id: 1, name: "Akshat", role: "Developer" },
  { id: 2, name: "Balaji", role: "Developer" },
  { id: 3, name: "Charith", role: "Developer" },
  { id: 4, name: "Rahul", role: "Developer" },
  { id: 5, name: "Vishesh", role: "Developer" },
];

const FILTER_LS_KEY = "board_filters_v1";

const filtersToPlain = (f) =>
  !f
    ? null
    : {
        text: f.text || "",
        statuses: [...(f.statuses || new Set())],
        assignees: [...(f.assignees || new Set())],
        tags: [...(f.tags || new Set())],
        startDate: f.startDate || "",
        endDate: f.endDate || "",
      };

const plainToFilters = (p) =>
  !p
    ? null
    : {
        text: p.text || "",
        statuses: new Set(p.statuses || []),
        assignees: new Set(p.assignees || []),
        tags: new Set(p.tags || []),
        startDate: p.startDate || "",
        endDate: p.endDate || "",
      };

const saveFiltersLS = (f) => {
  try {
    localStorage.setItem(FILTER_LS_KEY, JSON.stringify(filtersToPlain(f)));
  } catch {}
};
const loadFiltersLS = () => {
  try {
    const s = localStorage.getItem(FILTER_LS_KEY);
    return s ? plainToFilters(JSON.parse(s)) : null;
  } catch {
    return null;
  }
};

const decodeUnderscore = (v) => (v ? v.replace(/_/g, " ") : "");
const queryToFilters = (search) => {
  const q = new URLSearchParams(search);
  const split = (k) =>
    q
      .get(k)
      ?.split(",")
      .map((x) => decodeUnderscore(x))
      .filter(Boolean) || [];
  const text = decodeUnderscore(q.get("q") || "");
  const statuses = new Set(split("status"));
  const assignees = new Set(split("assignees"));
  const tags = new Set(split("tags"));
  const startDate = q.get("start") || "";
  const endDate = q.get("end") || "";
  if (
    !text &&
    !statuses.size &&
    !assignees.size &&
    !tags.size &&
    !startDate &&
    !endDate
  )
    return null;
  return { text, statuses, assignees, tags, startDate, endDate };
};

const DashboardPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [columnData, setColumnData] = useState(initialColumns);
  const [originalColumnData, setOriginalColumnData] = useState(initialColumns);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasInitialLoad = useRef(false);
  const [newIdea, setNewIdea] = useState({
    title: "",
    description: "",
    assignee: "",
    status: "",
    tags: [],
    acceptanceCriteria: [],
    storyPoints: null,
  });
  const [filters, setFilters] = useState(null);

  const nextTaskId = useRef(
    Math.max(
      ...initialColumns.flatMap((col) =>
        col.tasks.map((t) => parseInt(t.id, 10) || 0)
      ),
      0
    ) + 1
  );

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleOpenCreateModal = (columnTitle) => {
    setNewIdea({
      title: "",
      description: "",
      assignee: "",
      status: columnTitle,
      tags: [],
      acceptanceCriteria: [],
      storyPoints: null,
    });
    setSelectedColumn(columnTitle);
    setIsModalOpen(true);
  };

  const handleSaveIdea = async () => {
    try {
      const { data } = await apiClient.post(
        `${import.meta.env.VITE_BASE_URL}/stories`,
        {
          title: newIdea.title,
          description: newIdea.description,
          assignee: newIdea.assignee,
          tags: newIdea.tags || [],
          status: newIdea.status || selectedColumn || "Proposed",
          acceptanceCriteria: newIdea.acceptanceCriteria || [],
          storyPoints: newIdea.storyPoints,
        }
      );

      const userTask = {
        ...data?.story,
        id: String(nextTaskId.current++),
      };

      const updatedColumns = originalColumnData.map((col) =>
        col.title === (newIdea.status || selectedColumn)
          ? { ...col, tasks: [...col.tasks, userTask] }
          : col
      );
      setOriginalColumnData(updatedColumns);
      setColumnData(updatedColumns);

      toastNotify("Idea created successfully!", "success");

      setIsModalOpen(false);
      setNewIdea({
        title: "",
        description: "",
        assignee: "",
        status: "",
        tags: [],
        acceptanceCriteria: [],
        storyPoints: null,
      });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        console.error(err.response.data.message);
        toastNotify(err.response.data.message, "error");
      } else {
        console.error("An unexpected error occurred. Please try again.");
        toastNotify("Failed to save idea. Please try again.", "error");
      }
    }
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setEditModalOpen(true);
  };

  const handleDropTask = async (task, newStatus) => {
    if (task.status === newStatus) return;

    try {
      const token = localStorage.getItem("authToken");

      await apiClient.put(
        `${import.meta.env.VITE_BASE_URL}/stories/${task.id}`,
        {
          ...task,
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setColumnData((prevColumns) => {
        const newBoard = prevColumns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== task.id),
        }));

        const targetColumn = newBoard.find((col) => col.title === newStatus);
        if (targetColumn) {
          targetColumn.tasks.push({
            ...task,
            status: newStatus,
          });
        }

        return newBoard;
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
      alert("Failed to update task status. Please try again.");
    }
  };

  const handleSaveEdit = async (updatedTask) => {
    try {
      await apiClient.put(
        `${import.meta.env.VITE_BASE_URL}/stories/${updatedTask.id}`,
        updatedTask
      );

      setColumnData((prevColumns) => {
        return prevColumns.map((col) => ({
          ...col,
          tasks: col.tasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          ),
        }));
      });

      setEditModalOpen(false);
      setSelectedTask(null);
      toastNotify("Story updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update story:", err);
      toastNotify("Failed to update story. Please try again.", "error");
    }
  };

  const fetchIdeas = useCallback(
    async (searchTerm = "", isUserSearch = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_BASE_URL;
        let url;

        if (!isUserSearch) {
          url = `${baseUrl}/stories`;
        } else {
          if (searchTerm && searchTerm.trim() !== "") {
            const trimmedTerm = searchTerm.trim();
            const isInteger = /^\d+$/.test(trimmedTerm);
            const searchValue = isInteger
              ? parseInt(trimmedTerm, 10)
              : trimmedTerm;
            url = `${baseUrl}/filter?search=${encodeURIComponent(searchValue)}`;
          } else {
            url = `${baseUrl}/filter?search=`;
          }
        }

        const { data } = await apiClient.get(url);

        const newBoard = JSON.parse(JSON.stringify(initialColumns));

        data.forEach((idea) => {
          const column = newBoard.find((col) => col.title === idea.status);
          if (column) {
            column.tasks.push(idea);
          }
        });

        if (!searchTerm || searchTerm.trim() === "") {
          setOriginalColumnData(newBoard);
        }
        setColumnData(newBoard);
      } catch (err) {
        console.error("Failed to load ideas. Please try again later.", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load ideas. Please try again later."
        );
        if (searchTerm && searchTerm.trim() !== "") {
          setColumnData(originalColumnData);
        } else {
          setColumnData(initialColumns);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleFilter = useCallback(
    (searchTerm) => {
      fetchIdeas(searchTerm, true);
    },
    [fetchIdeas]
  );

  const handleFiltersChange = async (f) => {
    if (!f) {
      setFilters(null);
      try {
        localStorage.removeItem(FILTER_LS_KEY);
      } catch {
        toastNotify(
          "Failed to clear saved filters from local storage.",
          "error"
        );
      }
      window.history.replaceState(null, "", window.location.pathname);
      await fetchIdeas();
      return;
    }
    setFilters(f);
    const baseUrl = import.meta.env.VITE_BASE_URL;
    // Manually build query string to avoid encoding commas
    const params = [];
    if (f.text) params.push(`q=${encodeURIComponent(f.text)}`);
    if (f.statuses?.size) params.push(`status=${[...f.statuses].join(",")}`);
    if (f.assignees?.size)
      params.push(`assignee=${[...f.assignees].join(",")}`);
    if (f.tags?.size) params.push(`tags=${[...f.tags].join(",")}`);
    if (f.startDate) params.push(`start=${encodeURIComponent(f.startDate)}`);
    if (f.endDate) params.push(`end=${encodeURIComponent(f.endDate)}`);
    const queryString = params.join("&");
    // Update the URL to reflect filters
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${queryString ? `?${queryString}` : ""}`
    );
    const url = `${baseUrl}/stories?${queryString}`;
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get(url);
      const newBoard = JSON.parse(JSON.stringify(initialColumns));
      data.forEach((idea) => {
        const column = newBoard.find((col) => col.title === idea.status);
        if (column) {
          column.tasks.push(idea);
        }
      });
      setColumnData(newBoard);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load filtered ideas. Please try again later."
      );
      setColumnData(initialColumns);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    newIdea.title.trim() !== "" &&
    newIdea.description.trim() !== "" &&
    newIdea.assignee.trim() !== "";

  useEffect(() => {
    if (!hasInitialLoad.current) {
      hasInitialLoad.current = true;
      setTeamMembers(dummyTeamMembers);
      const savedFilters = loadFiltersLS();
      if (savedFilters) {
        setFilters(savedFilters);
        handleFiltersChange(savedFilters);
      } else {
        fetchIdeas();
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__dashboardFiltersValue = filters;
    }
    if (!filters) return;
    saveFiltersLS(filters);
  }, [filters]);

  const filteredColumns = applyFilters(columnData, filters);

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header onCreateIdeaClick={handleOpenCreateModal} />
      <SearchBar
        onFilter={handleFilter}
        onFiltersChange={handleFiltersChange}
      />
      {isLoading ? (
        <div className="flex flex-grow items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      ) : error ? (
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => fetchIdeas()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <section className="flex flex-grow p-4 space-x-4 overflow-scroll">
          {filteredColumns.map((column, index) => (
            <TaskColumn
              key={`${column.title}-${index}`}
              title={column.title}
              dotColor={column.dotColor}
              tasks={column.tasks}
              onAddTask={handleOpenCreateModal}
              onEdit={handleEditTask}
              onDrop={handleDropTask}
            />
          ))}
        </section>
      )}

      {/* Create New Idea Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Idea"
          description="Fill in the details for your new idea. Click save when you're done."
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveIdea} disabled={!isFormValid}>
                Save Idea
              </Button>
            </>
          }
        >
          <NewIdeaForm
            newIdea={newIdea}
            setNewIdea={setNewIdea}
            teamMembers={teamMembers}
            selectedColumn={selectedColumn}
          />
        </Modal>
      )}

      {/* Edit Story Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Story</DialogTitle>
            <DialogDescription>
              Update the details of your story. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <EditStoryForm
              story={selectedTask}
              onSave={handleSaveEdit}
              teamMembers={teamMembers}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
