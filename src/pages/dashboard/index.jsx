import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { Header } from "@/components/layout/Header";
import { TaskColumn } from "@/components/taskComponent/TaskColumn";
import { TaskPreviewModal } from "@/components/taskComponent/TaskPreviewModal";
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
  } catch {
    toastNotify("Failed to save filters to local storage.", "error");
  }
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
  const [isSaving, setIsSaving] = useState(false); // Track if any operation is in progress
  const [operationInProgress, setOperationInProgress] = useState(null); // Track which operation
  const hasInitialLoad = useRef(false);
  const abortControllerRef = useRef(null); // For canceling requests
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

  // NEW: Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTask, setPreviewTask] = useState(null);

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
          assignee: newIdea.assignee || "Unassigned",
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

  // NEW: Handle Preview Task (Open preview modal)
  const handlePreviewTask = (task) => {
    setPreviewTask(task);
    setPreviewModalOpen(true);
  };

  const handleDeleteTask = async (task) => {
    try {
      // Validate task
      if (!task || !task.id) {
        toastNotify("Invalid task. Cannot delete.", "error");
        return;
      }

      // Prevent concurrent operations
      if (isSaving || operationInProgress) {
        toastNotify(
          "Another operation is in progress. Please wait.",
          "warning"
        );
        return;
      }

      // Confirm deletion
      const confirmed = window.confirm(
        `Are you sure you want to delete "${task.title}"? This action cannot be undone.`
      );
      if (!confirmed) return;

      setIsSaving(true);
      setOperationInProgress("delete");

      // Store original state for rollback on error
      const originalColumnData = JSON.parse(JSON.stringify(columnData));

      const response = await apiClient.delete(
        `${import.meta.env.VITE_BASE_URL}/stories/${task.id}`
      );

      // Validate response
      if (response.status !== 200) {
        throw new Error(`Delete failed with status ${response.status}`);
      }

      // Verify task was actually deleted by checking response
      if (response.data && response.data.id !== task.id) {
        console.warn("Response ID mismatch");
      }

      setColumnData((prevColumns) => {
        if (!Array.isArray(prevColumns)) {
          console.error("Invalid column data");
          return prevColumns;
        }

        return prevColumns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== task.id),
        }));
      });

      toastNotify("Story deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete story:", err);
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to delete story. Please try again.";
      toastNotify(errorMsg, "error");
    } finally {
      setIsSaving(false);
      setOperationInProgress(null);
    }
  };

  const handleMoveToTop = async (task) => {
    // Move task to top of its current column by updating order
    setColumnData((prevColumns) => {
      return prevColumns.map((col) => {
        if (col.title === task.status) {
          const filtered = col.tasks.filter((t) => t.id !== task.id);
          return {
            ...col,
            tasks: [task, ...filtered],
          };
        }
        return col;
      });
    });
    toastNotify("Task moved to top!", "success");
  };

  // NEW: Handle Drop Task (Drag and Drop to change status)
  const handleDropTask = async (task, newStatus) => {
    if (!task || !newStatus) return; // Validate inputs
    if (task.status === newStatus) return; // No change needed

    // Prevent concurrent operations
    if (isSaving || operationInProgress) {
      toastNotify("Another operation is in progress. Please wait.", "warning");
      return;
    }

    try {
      setIsSaving(true);
      setOperationInProgress("drag-drop");

      // Store original state for rollback on error
      const originalColumnData = JSON.parse(JSON.stringify(columnData));

      // Prepare payload with proper field names for backend
      const updatePayload = {
        ...task,
        status: newStatus,
        // Ensure snake_case fields are included
        acceptance_criteria:
          task.acceptance_criteria || task.acceptanceCriteria || [],
        story_points:
          task.story_points !== undefined
            ? task.story_points
            : task.storyPoints,
        // Also include camelCase for compatibility
        acceptanceCriteria:
          task.acceptanceCriteria || task.acceptance_criteria || [],
        storyPoints:
          task.storyPoints !== undefined ? task.storyPoints : task.story_points,
      };

      const response = await apiClient.put(
        `${import.meta.env.VITE_BASE_URL}/stories/${task.id}`,
        updatePayload
      );

      // Validate response
      if (!response.data || !response.data.story) {
        throw new Error("Invalid response from server");
      }

      // Use the response data from backend which includes activity and status
      let updatedTask = response.data.story;

      // Ensure camelCase fields for frontend state with proper defaults
      updatedTask = {
        ...updatedTask,
        acceptanceCriteria: Array.isArray(updatedTask.acceptance_criteria)
          ? updatedTask.acceptance_criteria
          : Array.isArray(updatedTask.acceptanceCriteria)
          ? updatedTask.acceptanceCriteria
          : [],
        storyPoints:
          updatedTask.story_points !== undefined &&
          updatedTask.story_points !== null
            ? updatedTask.story_points
            : updatedTask.storyPoints !== undefined &&
              updatedTask.storyPoints !== null
            ? updatedTask.storyPoints
            : null,
      };

      // Verify status actually changed
      if (updatedTask.status !== newStatus) {
        toastNotify(
          "Warning: Status change may not have persisted correctly.",
          "warning"
        );
        // Still update UI with what we got
        newStatus = updatedTask.status;
      }

      // Validate status exists in initialColumns
      const validStatusesForDrop = initialColumns.map((col) => col.title);
      if (!validStatusesForDrop.includes(updatedTask.status)) {
        console.error("Invalid status:", updatedTask.status);
        toastNotify(
          `Error: Invalid status "${updatedTask.status}". Please refresh and try again.`,
          "error"
        );
        await fetchIdeas();
        return;
      }

      // Update local state with backend response
      setColumnData((prevColumns) => {
        if (!Array.isArray(prevColumns)) {
          console.error("Invalid column data");
          return prevColumns;
        }

        const newBoard = prevColumns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== task.id),
        }));

        const targetColumn = newBoard.find(
          (col) => col.title === updatedTask.status
        );
        if (targetColumn) {
          targetColumn.tasks.push(updatedTask);
        } else {
          console.error(
            "Target column not found for status:",
            updatedTask.status
          );
          // Rollback on error
          toastNotify("Error: Could not move task to target column.", "error");
          return originalColumnData;
        }

        return newBoard;
      });

      toastNotify("Task moved successfully!", "success");
    } catch (err) {
      console.error("Failed to update task status:", err);
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to move task. Please try again.";
      toastNotify(errorMsg, "error");

      // Refresh data on error to stay in sync
      await fetchIdeas();
    } finally {
      setIsSaving(false);
      setOperationInProgress(null);
    }
  };

  const handleSaveEdit = async (updatedTask) => {
    try {
      // Prevent multiple concurrent saves
      if (isSaving || operationInProgress === "save") {
        toastNotify("Save already in progress. Please wait.", "warning");
        return;
      }

      // Validate required fields
      if (!updatedTask.title || !updatedTask.title.trim()) {
        toastNotify("Title is required!", "error");
        return;
      }

      if (!updatedTask.description || !updatedTask.description.trim()) {
        toastNotify("Description is required!", "error");
        return;
      }

      if (!updatedTask.status) {
        toastNotify("Status is required!", "error");
        return;
      }

      // Validate status exists
      const validStatuses = initialColumns.map((col) => col.title);
      if (!validStatuses.includes(updatedTask.status)) {
        toastNotify(`Invalid status: ${updatedTask.status}`, "error");
        return;
      }

      // Validate story points if present
      if (
        updatedTask.storyPoints !== null &&
        updatedTask.storyPoints !== undefined &&
        updatedTask.storyPoints !== ""
      ) {
        const points = parseInt(updatedTask.storyPoints);
        if (isNaN(points) || points < 0 || points > 100) {
          toastNotify("Story points must be between 0 and 100!", "error");
          return;
        }
      }

      // Validate task ID
      if (!updatedTask.id) {
        toastNotify("Invalid task. Please try again.", "error");
        return;
      }

      setIsSaving(true);
      setOperationInProgress("save");

      // Prepare payload with proper field names for backend
      const updatePayload = {
        ...updatedTask,
        // Ensure snake_case fields are included
        acceptance_criteria:
          updatedTask.acceptance_criteria ||
          updatedTask.acceptanceCriteria ||
          [],
        story_points:
          updatedTask.story_points !== undefined
            ? updatedTask.story_points
            : updatedTask.storyPoints,
        // Also include camelCase for compatibility
        acceptanceCriteria:
          updatedTask.acceptanceCriteria ||
          updatedTask.acceptance_criteria ||
          [],
        storyPoints:
          updatedTask.storyPoints !== undefined
            ? updatedTask.storyPoints
            : updatedTask.story_points,
      };

      const response = await apiClient.put(
        `${import.meta.env.VITE_BASE_URL}/stories/${updatedTask.id}`,
        updatePayload
      );

      // Validate response structure
      if (!response.data || !response.data.story) {
        throw new Error("Invalid response from server");
      }

      // Use the response data from backend which includes activity
      let savedTask = response.data.story;

      // Validate savedTask has required fields
      if (!savedTask || !savedTask.id) {
        throw new Error("Invalid task data received from server");
      }

      // Validate status exists in initialColumns
      const validStatusesForSave = initialColumns.map((col) => col.title);
      if (!validStatusesForSave.includes(savedTask.status)) {
        throw new Error(
          `Invalid status "${savedTask.status}" returned from server`
        );
      }

      // Ensure camelCase fields for frontend state with proper defaults
      savedTask = {
        ...savedTask,
        acceptanceCriteria: Array.isArray(savedTask.acceptance_criteria)
          ? savedTask.acceptance_criteria
          : Array.isArray(savedTask.acceptanceCriteria)
          ? savedTask.acceptanceCriteria
          : [],
        storyPoints:
          savedTask.story_points !== undefined &&
          savedTask.story_points !== null
            ? savedTask.story_points
            : savedTask.storyPoints !== undefined &&
              savedTask.storyPoints !== null
            ? savedTask.storyPoints
            : null,
      };

      // Check if status changed - use updatedTask (the request data) not stale selectedTask
      const oldStatus = updatedTask.status;
      const statusChanged = oldStatus !== savedTask.status;

      // Update local state with backend response
      setColumnData((prevColumns) => {
        if (!Array.isArray(prevColumns)) {
          console.error("Invalid column data");
          return prevColumns;
        }

        if (statusChanged) {
          // Status changed - need to move task to different column
          const newBoard = prevColumns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== savedTask.id),
          }));

          const targetColumn = newBoard.find(
            (col) => col.title === savedTask.status
          );
          if (targetColumn) {
            targetColumn.tasks.push(savedTask);
          } else {
            console.warn(
              "Target column not found for status:",
              savedTask.status
            );
            // Return original columns if validation fails
            return prevColumns;
          }

          return newBoard;
        } else {
          // Status same - just update in place
          return prevColumns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) =>
              task.id === savedTask.id ? savedTask : task
            ),
          }));
        }
      });

      setEditModalOpen(false);
      setSelectedTask(null);
      setPreviewTask(savedTask);
      toastNotify("Story updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update story:", err);
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to update story. Please try again.";
      toastNotify(errorMsg, "error");

      // Refresh data on error to stay in sync
      fetchIdeas();
    } finally {
      setIsSaving(false);
      setOperationInProgress(null);
    }
  };

  // Track the latest request to prevent race conditions
  const latestRequestRef = useRef(null);

  const fetchIdeas = useCallback(
    async (searchTerm = "", isUserSearch = false) => {
      // Create unique ID for this request
      const requestId = Date.now() + Math.random();
      latestRequestRef.current = requestId;

      // Prevent concurrent operations during active save/delete/drag
      if (operationInProgress) {
        console.warn("Fetch cancelled: operation in progress");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_BASE_URL;
        let url;

        // Validate search term
        if (searchTerm !== "" && typeof searchTerm !== "string") {
          console.error("Invalid search term type");
          searchTerm = "";
        }

        if (!isUserSearch) {
          url = `${baseUrl}/stories`;
        } else {
          if (searchTerm && searchTerm.trim() !== "") {
            const trimmedTerm = searchTerm.trim();
            const isInteger = /^\d+$/.test(trimmedTerm);
            const searchValue = isInteger
              ? parseInt(trimmedTerm, 10)
              : trimmedTerm;
            // Properly encode search value
            url = `${baseUrl}/filter?search=${encodeURIComponent(searchValue)}`;
          } else {
            url = `${baseUrl}/filter?search=`;
          }
        }

        const { data } = await apiClient.get(url);

        // Check if this is still the latest request (prevent race condition)
        if (latestRequestRef.current !== requestId) {
          console.warn("Fetch cancelled: newer request in progress");
          return;
        }

        // Validate response is an array
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format: expected array");
        }

        const newBoard = JSON.parse(JSON.stringify(initialColumns));

        data.forEach((idea) => {
          // Validate task object
          if (!idea || !idea.status) {
            console.warn("Invalid task object:", idea);
            return;
          }

          const column = newBoard.find((col) => col.title === idea.status);
          if (column) {
            column.tasks.push(idea);
          } else {
            console.warn("Column not found for status:", idea.status);
          }
        });

        // Check again if still latest request before state update
        if (latestRequestRef.current !== requestId) {
          console.warn("Fetch cancelled: newer request in progress");
          return;
        }

        if (!searchTerm || searchTerm.trim() === "") {
          setOriginalColumnData(newBoard);
        }
        setColumnData(newBoard);
      } catch (err) {
        console.error("Failed to load ideas:", err);

        // Only update state if this is still the latest request
        if (latestRequestRef.current !== requestId) {
          console.warn("Fetch error ignored: newer request in progress");
          return;
        }

        // Enhanced error handling with better categorization
        let errorMessage = "Failed to load stories. Please try again later.";
        
        if (err.response) {
          // Server responded with error status
          const status = err.response.status;
          if (status === 401) {
            errorMessage = "Authentication failed. Please log in again.";
          } else if (status === 403) {
            errorMessage = "You don't have permission to view stories.";
          } else if (status === 404) {
            errorMessage = "Stories endpoint not found. Please contact support.";
          } else if (status >= 500) {
            errorMessage = "Server error. Please try again in a moment.";
          } else if (err.response.data?.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data?.message) {
            errorMessage = err.response.data.message;
          }
        } else if (err.request) {
          // Request was made but no response received
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        if (searchTerm && searchTerm.trim() !== "") {
          setColumnData(originalColumnData);
        } else {
          setColumnData(initialColumns);
        }
      } finally {
        // Only clear loading if this is still the latest request
        if (latestRequestRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [operationInProgress, originalColumnData] // Include operationInProgress in deps
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
      // Enhanced error handling for filters
      let errorMessage = "Failed to load filtered stories. Please try again later.";
      
      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (status >= 500) {
          errorMessage = "Server error. Please try again in a moment.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setColumnData(initialColumns);
      toastNotify(errorMessage, "error");
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

  // Check if backlog is completely empty (all columns have no tasks)
  const isBacklogEmpty = filteredColumns.every((col) => col.tasks.length === 0);

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header onCreateIdeaClick={handleOpenCreateModal} />
      <SearchBar
        onFilter={handleFilter}
        onFiltersChange={handleFiltersChange}
      />
      {isLoading ? (
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading stories...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-red-500 mb-2 font-medium">Failed to load stories</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchIdeas()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : isBacklogEmpty ? (
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-24 h-24 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No stories yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Get started by creating your first user story. Click the "+" button in any column to add a new story.
            </p>
            <button
              onClick={() => handleOpenCreateModal("Proposed")}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Create Your First Story
            </button>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-grow">
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
                onAssign={handleEditTask}
                onDelete={handleDeleteTask}
                onMoveToTop={handleMoveToTop}
                isOperationInProgress={isSaving || isLoading}
                onPreview={handlePreviewTask}
              />
            ))}
          </section>
          {/* Loading overlay for operations */}
          {isSaving && operationInProgress && (
            <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-10">
              <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm text-gray-700">
                  {operationInProgress === "save" && "Saving story..."}
                  {operationInProgress === "delete" && "Deleting story..."}
                  {operationInProgress === "drag-drop" && "Moving story..."}
                  {!["save", "delete", "drag-drop"].includes(operationInProgress) && "Processing..."}
                </span>
              </div>
            </div>
          )}
        </div>
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

      {/* Preview Task Modal */}
      <TaskPreviewModal
        task={previewTask}
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onEdit={handleEditTask}
      />
    </div>
  );
};

export default DashboardPage;
