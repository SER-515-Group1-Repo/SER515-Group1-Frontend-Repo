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
  { title: "Needs Refinement", dotColor: "bg-blue-500", tasks: [
      { id: "4", title: "API Documentation", description: "Create comprehensive API documentation for all endpoints.", assignee: "Akshat", status: "Needs Refinement", tags: ["Backend", "Research"] },
      { id: "5", title: "UI Component Library", description: "Build reusable UI components for the dashboard.", assignee: "Balaji", status: "Needs Refinement", tags: ["Frontend", "UI/UX"] },
    ]},
  { title: "In Refinement", dotColor: "bg-yellow-500", tasks: [
      { id: "6", title: "Task Management Features", description: "Implement drag-and-drop functionality for task cards.", assignee: "Rahul", status: "In Refinement", tags: ["Frontend", "Testing"] },
    ]},
  { title: "Ready To Commit", dotColor: "bg-purple-500", tasks: [
      { id: "7", title: "Code Review System", description: "Set up automated code review process with GitHub Actions.", assignee: "Charith", status: "Ready To Commit", tags: ["DevOps", "Testing"] },
      { id: "8", title: "Error Handling", description: "Implement comprehensive error handling across the application.", assignee: "Akshat", status: "Ready To Commit", tags: ["Backend", "Bug"] },
    ]},
  { title: "Sprint Ready", dotColor: "bg-green-500", tasks: [
      { id: "9", title: "Initial UI Mockups", description: "Created wireframes and basic mockups for the dashboard.", assignee: "Balaji", status: "Sprint Ready", tags: ["Frontend", "Research"] },
      { id: "10", title: "Database Connection", description: "Established connection between backend and PostgreSQL database.", assignee: "Rahul", status: "Sprint Ready", tags: ["Backend", "Database"] },
      { id: "11", title: "Frontend Routing", description: "Implemented React Router for navigation between pages.", assignee: "Charith", status: "Sprint Ready", tags: ["Frontend", "Refactor"] },
    ]},
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
  !f ? null : {
    text: f.text || "",
    statuses: [...(f.statuses || new Set())],
    assignees: [...(f.assignees || new Set())],
    tags: [...(f.tags || new Set())],
    startDate: f.startDate || "",
    endDate: f.endDate || "",
  };

const plainToFilters = (p) =>
  !p ? null : {
    text: p.text || "",
    statuses: new Set(p.statuses || []),
    assignees: new Set(p.assignees || []),
    tags: new Set(p.tags || []),
    startDate: p.startDate || "",
    endDate: p.endDate || "",
  };

const saveFiltersLS = (f) => { try { localStorage.setItem(FILTER_LS_KEY, JSON.stringify(filtersToPlain(f))); } catch {} };
const loadFiltersLS = () => { try { const s = localStorage.getItem(FILTER_LS_KEY); return s ? plainToFilters(JSON.parse(s)) : null; } catch { return null; } };

const decodeUnderscore = (v) => (v ? v.replace(/_/g, " ") : "");
const queryToFilters = (search) => {
  const q = new URLSearchParams(search);
  const split = (k) => (q.get(k)?.split(",").map((x) => decodeUnderscore(x)).filter(Boolean)) || [];
  const text = decodeUnderscore(q.get("q") || "");
  const statuses = new Set(split("status"));
  const assignees = new Set(split("assignees"));
  const tags = new Set(split("tags"));
  const startDate = q.get("start") || "";
  const endDate = q.get("end") || "";
  if (!text && !statuses.size && !assignees.size && !tags.size && !startDate && !endDate) return null;
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

  // NEW: Edit Modal State
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

      const updatedColumns = originalColumnData.map((col) =>
        col.title === (newIdea.status || selectedColumn)
          ? { ...col, tasks: [...col.tasks, data?.story] }
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

  // NEW: Handle Edit Task
  const handleEditTask = (task) => {
    setSelectedTask(task);
    setEditModalOpen(true);
  };

  // NEW: Handle Drop Task (Drag and Drop to change status)
  const handleDropTask = async (task, newStatus) => {
    if (task.status === newStatus) return; // No change needed

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

      // Update local state
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

      // Update local state
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

        // Backend already filters the data, so use it directly
        // No need for client-side filtering as backend handles both ID and title searches
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
        // If search fails, fall back to original data
        if (searchTerm && searchTerm.trim() !== "") {
          setColumnData(originalColumnData);
        } else {
          // If initial load fails, show empty columns
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
      fetchIdeas(searchTerm, true); // true indicates it's a user-initiated search
    },
    [fetchIdeas]
  );

  const IdeaFormFooter = () => (
    <>
      <Button variant="outline" onClick={() => setIsModalOpen(false)}>
        Cancel
      </Button>
      <Button
        onClick={() => {
          handleSaveIdea();
        }}
        disabled={!isFormValid}
      >
        Save Idea
      </Button>
    </>
  );
const handleFiltersChange = async (f) => {
  const isEmpty =
    !f ||
    (!f.text?.trim() &&
      !(f.statuses && f.statuses.size) &&
      !(f.assignees && f.assignees.size) &&
      !(f.tags && f.tags.size) &&
      !f.startDate &&
      !f.endDate);

  if (isEmpty) {
    window.history.replaceState(null, "", window.location.pathname);

    try { localStorage.removeItem("board_filters_v1"); } catch {}

    setFilters(null);

    await fetchIdeas();
    return;
  }

  const q = new URLSearchParams();
  if (f.text) q.set("q", f.text.replace(/\s+/g, "_"));
  if (f.statuses?.size) q.set("status", [...f.statuses].join(",").replace(/\s+/g, "_"));
  if (f.assignees?.size) q.set("assignees", [...f.assignees].join(",").replace(/\s+/g, "_"));
  if (f.tags?.size) q.set("tags", [...f.tags].join(",").replace(/\s+/g, "_"));
  if (f.startDate) q.set("start", f.startDate);
  if (f.endDate) q.set("end", f.endDate);

  const queryString = q.toString().replace(/\+/g, "_");
  const newUrl = `${window.location.pathname}?${queryString}`;
  window.history.replaceState(null, "", newUrl);

  setFilters(f);

  await fetchIdeas();
};



  const isFormValid =
    newIdea.title.trim() !== "" &&
    newIdea.description.trim() !== "" &&
    newIdea.assignee.trim() !== "";

  useEffect(() => {
    // Only fetch on initial load once
    if (!hasInitialLoad.current) {
      hasInitialLoad.current = true;
      fetchIdeas();
      setTeamMembers(dummyTeamMembers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchIdeas is stable, doesn't need to be in deps

  useEffect(() => {
    const fromURL = queryToFilters(window.location.search);
    if (fromURL) setFilters(fromURL);
    else {
      const fromLS = loadFiltersLS();
      if (fromLS) setFilters(fromLS);
    }
  }, []);

  useEffect(() => {
    if (!filters) return;
    saveFiltersLS(filters);
  }, [filters]);

  const filteredColumns = applyFilters(columnData, filters);

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header onCreateIdeaClick={handleOpenCreateModal} />
      <SearchBar onFilter={handleFilter} />
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
          {columnData.map((column, index) => (
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
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveIdea} disabled={!isFormValid}>Save Idea</Button>
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
