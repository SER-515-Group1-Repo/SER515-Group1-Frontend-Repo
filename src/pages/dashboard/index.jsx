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
import { STORY_POINTS_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";

const initialColumns = [
  {
    title: "Backlog",
    dotColor: "bg-slate-400",
    tasks: [],
  },
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

// Helper function to sort tasks by MoSCoW priority (primary) and MVP score (secondary)
// MoSCoW: Must > Should > Could > Won't ("Must" stories always come first)
// MVP Score = Business Value (bv) / Story Points (tiebreaker within same MoSCoW priority)
const sortTasksByMVP = (tasks) => {
  const moscowOrder = { Must: 4, Should: 3, Could: 2, "Won't": 1 };
  return [...tasks].sort((a, b) => {
    // Get MoSCoW priority scores
    const aMoscow = moscowOrder[a.moscowPriority || a.moscow_priority] || 0;
    const bMoscow = moscowOrder[b.moscowPriority || b.moscow_priority] || 0;

    // MoSCoW is PRIMARY - "Must" stories always come first
    if (bMoscow !== aMoscow) {
      return bMoscow - aMoscow;
    }

    // MVP score is SECONDARY (tiebreaker within same MoSCoW priority)
    // Calculate MVP scores dynamically from current values
    const aBV = a.bv ?? 0;
    const aSP = a.storyPoints ?? a.story_points ?? null;
    const aHasValidValues =
      aSP !== null && aSP !== undefined && aSP > 0 && aBV > 0;
    const aScore = aHasValidValues ? aBV / aSP : 0;

    const bBV = b.bv ?? 0;
    const bSP = b.storyPoints ?? b.story_points ?? null;
    const bHasValidValues =
      bSP !== null && bSP !== undefined && bSP > 0 && bBV > 0;
    const bScore = bHasValidValues ? bBV / bSP : 0;

    return bScore - aScore;
  });
};

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
    assignees: [],
    status: "",
    tags: [],
    acceptanceCriteria: [],
    storyPoints: null,
    // Validation fields
    bv: null,
    refinementSessionScheduled: false,
    groomed: false,
    dependencies: [],
    sessionDocumented: false,
    refinementDependencies: [],
    teamApproval: false,
    poApproval: false,
    sprintCapacity: null,
    skillsAvailable: false,
    teamCommits: false,
    tasksIdentified: false,
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
      assignees: [],
      status: columnTitle,
      tags: [],
      acceptanceCriteria: [],
      storyPoints: null,
      moscowPriority: null,
      bv: null,
      refinementSessionScheduled: false,
      groomed: false,
      dependencies: [],
      sessionDocumented: false,
      teamApproval: false,
      poApproval: false,
      sprintCapacity: null,
      skillsAvailable: false,
      teamCommits: false,
      tasksIdentified: false,
    });
    setSelectedColumn(columnTitle);
    setIsModalOpen(true);
  };

  const handleExportClickJSON = async () => {
    try {
      const sprintReadyColumn = columnData.find(
        (col) => col.title === "Sprint Ready"
      );

      if (!sprintReadyColumn || sprintReadyColumn.tasks.length === 0) {
        toastNotify("No stories in 'Sprint Ready' to export.", "warning");
        return;
      }

      const now = new Date();
      const nowISO = now.toISOString();

      const exportOwner = {
        email: "rmarath4@asu.edu",
        name: "Agile Dashboard Export",
      };

      // 3. Define the project's workflow statuses
      const userStoryStatuses = [
        {
          name: "New",
          slug: "new",
          order: 1,
          is_closed: false,
          color: "#70728F",
        },
        {
          name: "In progress",
          slug: "in-progress",
          order: 3,
          is_closed: false,
          color: "#E47C40",
        },
        {
          name: "Ready for test",
          slug: "ready-for-test",
          order: 4,
          is_closed: false,
          color: "#E4CE40",
        },
        {
          name: "Done",
          slug: "done",
          order: 5,
          is_closed: true,
          color: "#A8E440",
        },
      ];

      // 4. Define the project's point system
      const storyPoints = [
        { name: "?", order: 0, value: null },
        { name: "1", order: 1, value: 1 },
        { name: "2", order: 2, value: 2 },
        { name: "3", order: 3, value: 3 },
        { name: "5", order: 4, value: 5 },
        { name: "8", order: 5, value: 8 },
        { name: "13", order: 6, value: 13 },
        { name: "21", order: 7, value: 21 },
      ];

      // 5. Define project roles
      const projectRoles = [
        { name: "Developer", slug: "dev", order: 40 },
        { name: "Product Manager", slug: "product-manager", order: 50 },
        { name: "Scrum Master", slug: "scrum-master", order: 60 },
        { name: "Stakeholder", slug: "stakeholder", order: 70 },
      ];

      const mappedUserStories = sprintReadyColumn.tasks.map((task, index) => {
        const acceptanceCriteriaMarkdown = (
          task.acceptanceCriteria ||
          task.acceptance_criteria ||
          []
        )
          .filter((ac) => ac && ac.trim() !== "")
          .map((ac) => `- ${ac}`)
          .join("\n");

        const fullDescription =
          `${task.description || ""}\n\n` +
          (acceptanceCriteriaMarkdown
            ? `**Acceptance Criteria:**\n${acceptanceCriteriaMarkdown}`
            : "");

        return {
          ref: index + 1,
          subject: task.title || "Untitled Story",
          description: fullDescription,
          status: "New",
          owner: exportOwner.email,
          assigned_to: null,
          created_date: task.created_at || nowISO,
          modified_date: nowISO,
          finish_date: null,
          is_closed: false,
          is_blocked: false,
          blocked_note: "",
          backlog_order: Date.now() + index,
          sprint_order: index + 1,
          kanban_order: Date.now() + index,
          version: 1,
          watchers: [],
          tags: task.tags || [],
          role_points: [
            {
              role: "Developer",
              points: task.storyPoints || task.story_points || "?",
            },
          ],
          history: [
            {
              user: [exportOwner.email, exportOwner.name],
              created_at: nowISO,
              type: 2,
              comment: "Exported from Agile Dashboard",
              diff: null,
              snapshot: { subject: task.title, status: "New" },
            },
          ],
        };
      });

      const taigaProjectExport = {
        name: `Sprint Ready Export - ${now.toLocaleDateString()}`,
        slug: `sprint-ready-export-${Date.now()}`,
        description:
          "User stories from the 'Sprint Ready' column, exported from the Agile Dashboard.",
        created_date: nowISO,
        modified_date: nowISO,
        owner: exportOwner.email,
        watchers: [exportOwner.email],
        memberships: [
          {
            user: exportOwner.email,
            role: "Product Manager",
            email: exportOwner.email,
          },
        ],
        us_statuses: userStoryStatuses,
        points: storyPoints,
        roles: projectRoles,
        priorities: [
          { name: "Low", order: 1, color: "#A8E440" },
          { name: "Normal", order: 3, color: "#E4CE40" },
          { name: "High", order: 5, color: "#E47C40" },
        ],
        epic_statuses: [],
        task_statuses: [],
        issue_statuses: [],
        issue_types: [],
        severities: [],
        swimlanes: [],
        user_stories: mappedUserStories,
        epics: [],
        tasks: [],
        issues: [],
        milestones: [],
        is_private: false,
        is_backlog_activated: true,
        is_kanban_activated: true,
        is_wiki_activated: true,
        is_issues_activated: true,
        is_epics_activated: true,
      };

      const jsonContent = JSON.stringify(taigaProjectExport, null, 2);
      const blob = new Blob([jsonContent], {
        type: "application/json;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `taiga-project-export-${now.toISOString().split("T")[0]}.json`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastNotify(
        `Successfully exported ${sprintReadyColumn.tasks.length} stories.`,
        "success"
      );
    } catch (error) {
      console.error("Failed to export stories to JSON:", error);
      toastNotify("An error occurred during the export.", "error");
    }
  };

  const handleSaveIdea = async () => {
    // Validate required fields
    if (!newIdea.title || !newIdea.title.trim()) {
      toastNotify("Title is required!", "error");
      return;
    }

    if (!newIdea.description || !newIdea.description.trim()) {
      toastNotify("Description is required!", "error");
      return;
    }

    // Validate story points if provided (must be Fibonacci sequence)
    if (
      newIdea.storyPoints !== null &&
      newIdea.storyPoints !== undefined &&
      newIdea.storyPoints !== ""
    ) {
      const points = parseInt(newIdea.storyPoints);
      if (isNaN(points) || !STORY_POINTS_OPTIONS.includes(points)) {
        toastNotify(
          `Story points must be a Fibonacci number: ${STORY_POINTS_OPTIONS.join(
            ", "
          )}`,
          "error"
        );
        return;
      }
    }

    try {
      // Filter out empty acceptance criteria
      const filteredCriteria = (newIdea.acceptanceCriteria || []).filter(
        (c) => c && c.trim()
      );

      // Filter out empty dependencies
      const filteredDependencies = (newIdea.dependencies || []).filter(
        (d) => d && d.trim()
      );

      const filteredRefinementDependencies = (
        newIdea.refinementDependencies || []
      ).filter((d) => d && d.trim());

      const payload = {
        title: newIdea.title.trim(),
        description: newIdea.description.trim(),
        assignees: newIdea.assignees || [],
        tags: newIdea.tags || [],
        status: newIdea.status || selectedColumn || "Backlog",
        acceptance_criteria: filteredCriteria,
        story_points:
          newIdea.storyPoints !== null &&
          newIdea.storyPoints !== undefined &&
          newIdea.storyPoints !== "" &&
          newIdea.storyPoints !== 0
            ? parseInt(newIdea.storyPoints)
            : null,
        moscow_priority: newIdea.moscowPriority || null,
        // Validation fields for status transitions
        bv:
          newIdea.bv !== null && newIdea.bv !== ""
            ? parseInt(newIdea.bv)
            : null,
        refinement_session_scheduled:
          newIdea.refinementSessionScheduled || false,
        groomed: newIdea.groomed || false,
        dependencies: (newIdea.dependencies || []).filter((d) => d && d.trim()),
        session_documented: newIdea.sessionDocumented || false,
        team_approval: newIdea.teamApproval || false,
        po_approval: newIdea.poApproval || false,
        sprint_capacity:
          newIdea.sprintCapacity !== null && newIdea.sprintCapacity !== ""
            ? parseInt(newIdea.sprintCapacity)
            : null,
        skills_available: newIdea.skillsAvailable || false,
        team_commits: newIdea.teamCommits || false,
        tasks_identified: newIdea.tasksIdentified || false,
      };

      const { data } = await apiClient.post(
        `${import.meta.env.VITE_BASE_URL}/stories`,
        payload
      );

      // Normalize the response for frontend state
      // Use actual bv field, default to 0 if not set
      const businessValue = data?.story?.bv ?? 0;
      const storyPoints =
        data?.story?.storyPoints ?? data?.story?.story_points ?? null;
      const hasValidValues =
        storyPoints !== null &&
        storyPoints !== undefined &&
        storyPoints > 0 &&
        businessValue > 0;
      const mvpScore = hasValidValues ? businessValue / storyPoints : 0;

      const userTask = {
        ...data?.story,
        id: data?.story?.id
          ? String(data.story.id)
          : String(nextTaskId.current++),
        acceptanceCriteria:
          data?.story?.acceptanceCriteria ||
          data?.story?.acceptance_criteria ||
          [],
        storyPoints: storyPoints,
        bv: businessValue,
        moscowPriority:
          data?.story?.moscowPriority ?? data?.story?.moscow_priority ?? null,
        mvpScore: mvpScore,
      };

      const updatedColumns = originalColumnData.map((col) => {
        if (col.title === (newIdea.status || selectedColumn)) {
          const tasksWithNew = [...col.tasks, userTask];
          return { ...col, tasks: sortTasksByMVP(tasksWithNew) };
        }
        return col;
      });
      setOriginalColumnData(updatedColumns);
      setColumnData(updatedColumns);

      toastNotify("Idea created successfully!", "success");

      setIsModalOpen(false);
      setNewIdea({
        title: "",
        description: "",
        assignees: [],
        status: "",
        tags: [],
        acceptanceCriteria: [],
        storyPoints: null,
        moscowPriority: null,
        bv: null,
        refinementSessionScheduled: false,
        groomed: false,
        dependencies: [],
        sessionDocumented: false,
        teamApproval: false,
        poApproval: false,
        sprintCapacity: null,
        skillsAvailable: false,
        teamCommits: false,
        tasksIdentified: false,
      });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        console.error(err.response.data.message);
        toastNotify(err.response.data.message, "error");
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.detail
      ) {
        const detail = err.response.data.detail;
        const msg =
          typeof detail === "object"
            ? detail.message || JSON.stringify(detail)
            : detail;
        toastNotify(msg, "error");
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

  // Handle Sort for column
  const handleSort = (columnTitle, sortBy) => {
    setColumnData((prevColumns) => {
      return prevColumns.map((col) => {
        if (col.title === columnTitle) {
          const sortedTasks = [...col.tasks].sort((a, b) => {
            switch (sortBy) {
              case "title":
                return (a.title || "").localeCompare(b.title || "");
              case "storyPoints":
                // Sort by story points (nulls/undefined at the end)
                const aPoints = a.storyPoints ?? a.story_points ?? Infinity;
                const bPoints = b.storyPoints ?? b.story_points ?? Infinity;
                return aPoints - bPoints;
              case "dateCreated":
                // Sort by created_at (newest first)
                const aDate = new Date(a.created_at || 0);
                const bDate = new Date(b.created_at || 0);
                return bDate - aDate;
              default:
                return 0;
            }
          });
          return { ...col, tasks: sortedTasks };
        }
        return col;
      });
    });
    toastNotify(
      `Sorted by ${
        sortBy === "storyPoints"
          ? "story points"
          : sortBy === "dateCreated"
          ? "date created"
          : "title"
      }`,
      "success"
    );
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

      // Prepare payload - send only snake_case (backend standard) to avoid duplicates
      // Don't spread task to avoid duplicate fields
      // Business value is not sent - always defaults to 5
      const updatePayload = {
        title: task.title,
        description: task.description,
        status: newStatus,
        assignees: task.assignees || [],
        tags: task.tags || [],
        acceptance_criteria:
          task.acceptance_criteria || task.acceptanceCriteria || [],
        story_points:
          task.story_points !== undefined
            ? task.story_points
            : task.storyPoints,
        moscow_priority:
          task.moscow_priority !== undefined
            ? task.moscow_priority
            : task.moscowPriority,
        activity: task.activity || [],
        bv: task.bv ?? task.businessValue ?? null,
        refinement_session_scheduled:
          task.refinement_session_scheduled ??
          task.refinementSessionScheduled ??
          false,
        groomed: task.groomed ?? false,
        dependencies: task.dependencies ?? "",
        session_documented:
          task.session_documented ?? task.sessionDocumented ?? false,
        team_approval: task.team_approval ?? task.teamApproval ?? false,
        po_approval: task.po_approval ?? task.poApproval ?? false,
        sprint_capacity: task.sprint_capacity ?? task.sprintCapacity ?? null,
        skills_available:
          task.skills_available ?? task.skillsAvailable ?? false,
        team_commits: task.team_commits ?? task.teamCommits ?? false,
        tasks_identified:
          task.tasks_identified ?? task.tasksIdentified ?? false,
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

      // Normalize story points from backend response
      // Use actual bv field, default to 0 if not set
      const businessValue = updatedTask.bv ?? 0;
      const storyPoints =
        updatedTask.story_points !== undefined &&
        updatedTask.story_points !== null
          ? updatedTask.story_points
          : updatedTask.storyPoints !== undefined &&
            updatedTask.storyPoints !== null
          ? updatedTask.storyPoints
          : null;

      // Calculate MVP score - both bv and story_points must be valid and > 0
      const hasValidValues =
        storyPoints !== null &&
        storyPoints !== undefined &&
        storyPoints > 0 &&
        businessValue > 0;
      const mvpScore = hasValidValues ? businessValue / storyPoints : 0;

      // Ensure camelCase fields for frontend state with proper defaults
      updatedTask = {
        ...updatedTask,
        acceptanceCriteria: Array.isArray(updatedTask.acceptance_criteria)
          ? updatedTask.acceptance_criteria
          : Array.isArray(updatedTask.acceptanceCriteria)
          ? updatedTask.acceptanceCriteria
          : [],
        storyPoints: storyPoints, // Preserve the actual value from backend
        story_points: storyPoints,
        bv: businessValue,
        moscowPriority:
          updatedTask.moscow_priority === null ||
          updatedTask.moscow_priority === undefined ||
          updatedTask.moscow_priority === ""
            ? null
            : updatedTask.moscow_priority ?? updatedTask.moscowPriority ?? null,
        mvpScore: mvpScore,
        // Normalize validation fields for consistent access
        refinementSessionScheduled:
          updatedTask.refinementSessionScheduled ??
          updatedTask.refinement_session_scheduled ??
          false,
        refinement_session_scheduled:
          updatedTask.refinementSessionScheduled ??
          updatedTask.refinement_session_scheduled ??
          false,
        groomed: updatedTask.groomed ?? false,
        dependencies: updatedTask.dependencies ?? "",
        sessionDocumented:
          updatedTask.sessionDocumented ??
          updatedTask.session_documented ??
          false,
        session_documented:
          updatedTask.sessionDocumented ??
          updatedTask.session_documented ??
          false,
        teamApproval:
          updatedTask.teamApproval ?? updatedTask.team_approval ?? false,
        team_approval:
          updatedTask.teamApproval ?? updatedTask.team_approval ?? false,
        poApproval: updatedTask.poApproval ?? updatedTask.po_approval ?? false,
        po_approval: updatedTask.poApproval ?? updatedTask.po_approval ?? false,
        sprintCapacity:
          updatedTask.sprintCapacity ?? updatedTask.sprint_capacity ?? null,
        sprint_capacity:
          updatedTask.sprintCapacity ?? updatedTask.sprint_capacity ?? null,
        skillsAvailable:
          updatedTask.skillsAvailable ?? updatedTask.skills_available ?? false,
        skills_available:
          updatedTask.skillsAvailable ?? updatedTask.skills_available ?? false,
        teamCommits:
          updatedTask.teamCommits ?? updatedTask.team_commits ?? false,
        team_commits:
          updatedTask.teamCommits ?? updatedTask.team_commits ?? false,
        tasksIdentified:
          updatedTask.tasksIdentified ?? updatedTask.tasks_identified ?? false,
        tasks_identified:
          updatedTask.tasksIdentified ?? updatedTask.tasks_identified ?? false,
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
          // Re-sort the target column by MVP score
          targetColumn.tasks = sortTasksByMVP(targetColumn.tasks);
        } else {
          console.error(
            "Target column not found for status:",
            updatedTask.status
          );
          // Rollback on error
          toastNotify("Error: Could not move task to target column.", "error");
          return originalColumnData;
        }

        // Re-sort all columns
        return newBoard.map((col) => ({
          ...col,
          tasks: sortTasksByMVP(col.tasks),
        }));
      });

      // Also update originalColumnData to keep it in sync
      setOriginalColumnData((prevColumns) => {
        if (!Array.isArray(prevColumns)) {
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
          targetColumn.tasks = sortTasksByMVP(targetColumn.tasks);
        }

        return newBoard.map((col) => ({
          ...col,
          tasks: sortTasksByMVP(col.tasks),
        }));
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
      // Explicitly handle null values - don't use || operator which treats null as falsy
      const storyPointsValue =
        updatedTask.story_points !== undefined
          ? updatedTask.story_points
          : updatedTask.storyPoints !== undefined
          ? updatedTask.storyPoints
          : null;

      // Extract moscowPriority - check both camelCase and snake_case, handle empty string
      const moscowPriorityValue =
        updatedTask.moscow_priority !== undefined &&
        updatedTask.moscow_priority !== null &&
        updatedTask.moscow_priority !== ""
          ? updatedTask.moscow_priority
          : updatedTask.moscowPriority !== undefined &&
            updatedTask.moscowPriority !== null &&
            updatedTask.moscowPriority !== ""
          ? updatedTask.moscowPriority
          : null;

      // Build update payload - send only snake_case (backend standard) to avoid duplicates
      const updatePayload = {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        assignees: updatedTask.assignees || [],
        tags: updatedTask.tags || [],
        acceptance_criteria:
          updatedTask.acceptance_criteria ||
          updatedTask.acceptanceCriteria ||
          [],
        story_points: storyPointsValue,
        moscow_priority: moscowPriorityValue, // Explicitly set - null if cleared, value if set
        activity: updatedTask.activity || [],
        // Validation fields for status transitions
        bv: updatedTask.bv ?? null,
        // Needs Refinement fields
        refinement_session_scheduled:
          updatedTask.refinement_session_scheduled ??
          updatedTask.refinementSessionScheduled ??
          false,
        groomed: updatedTask.groomed ?? false,
        dependencies: updatedTask.dependencies ?? "",
        session_documented:
          updatedTask.session_documented ??
          updatedTask.sessionDocumented ??
          false,
        // In Refinement fields
        team_approval:
          updatedTask.team_approval ?? updatedTask.teamApproval ?? false,
        po_approval: updatedTask.po_approval ?? updatedTask.poApproval ?? false,
        // Ready To Commit fields
        sprint_capacity:
          updatedTask.sprint_capacity ?? updatedTask.sprintCapacity ?? null,
        skills_available:
          updatedTask.skills_available ?? updatedTask.skillsAvailable ?? false,
        team_commits:
          updatedTask.team_commits ?? updatedTask.teamCommits ?? false,
        tasks_identified:
          updatedTask.tasks_identified ?? updatedTask.tasksIdentified ?? false,
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

      // Normalize story points from backend response
      // Use actual bv field, default to 0 if not set
      const businessValue = savedTask.bv ?? 0;
      const storyPoints =
        savedTask.story_points !== undefined && savedTask.story_points !== null
          ? savedTask.story_points
          : savedTask.storyPoints !== undefined &&
            savedTask.storyPoints !== null
          ? savedTask.storyPoints
          : null;

      // Calculate MVP score - both bv and story_points must be valid and > 0
      const hasValidValues =
        storyPoints !== null &&
        storyPoints !== undefined &&
        storyPoints > 0 &&
        businessValue > 0;
      const mvpScore = hasValidValues ? businessValue / storyPoints : 0;

      // Ensure camelCase fields for frontend state with proper defaults
      savedTask = {
        ...savedTask,
        acceptanceCriteria: Array.isArray(savedTask.acceptance_criteria)
          ? savedTask.acceptance_criteria
          : Array.isArray(savedTask.acceptanceCriteria)
          ? savedTask.acceptanceCriteria
          : [],
        storyPoints: storyPoints, // Preserve the actual value from backend
        story_points: storyPoints,
        bv: businessValue,
        moscowPriority:
          savedTask.moscow_priority !== undefined &&
          savedTask.moscow_priority !== null &&
          savedTask.moscow_priority !== ""
            ? savedTask.moscow_priority
            : savedTask.moscowPriority !== undefined &&
              savedTask.moscowPriority !== null &&
              savedTask.moscowPriority !== ""
            ? savedTask.moscowPriority
            : null,
        mvpScore: mvpScore,
        // Normalize validation fields for consistent access
        refinementSessionScheduled:
          savedTask.refinementSessionScheduled ??
          savedTask.refinement_session_scheduled ??
          false,
        refinement_session_scheduled:
          savedTask.refinementSessionScheduled ??
          savedTask.refinement_session_scheduled ??
          false,
        groomed: savedTask.groomed ?? false,
        dependencies: savedTask.dependencies ?? "",
        sessionDocumented:
          savedTask.sessionDocumented ?? savedTask.session_documented ?? false,
        session_documented:
          savedTask.sessionDocumented ?? savedTask.session_documented ?? false,
        teamApproval:
          savedTask.teamApproval ?? savedTask.team_approval ?? false,
        team_approval:
          savedTask.teamApproval ?? savedTask.team_approval ?? false,
        poApproval: savedTask.poApproval ?? savedTask.po_approval ?? false,
        po_approval: savedTask.poApproval ?? savedTask.po_approval ?? false,
        sprintCapacity:
          savedTask.sprintCapacity ?? savedTask.sprint_capacity ?? null,
        sprint_capacity:
          savedTask.sprintCapacity ?? savedTask.sprint_capacity ?? null,
        skillsAvailable:
          savedTask.skillsAvailable ?? savedTask.skills_available ?? false,
        skills_available:
          savedTask.skillsAvailable ?? savedTask.skills_available ?? false,
        teamCommits: savedTask.teamCommits ?? savedTask.team_commits ?? false,
        team_commits: savedTask.teamCommits ?? savedTask.team_commits ?? false,
        tasksIdentified:
          savedTask.tasksIdentified ?? savedTask.tasks_identified ?? false,
        tasks_identified:
          savedTask.tasksIdentified ?? savedTask.tasks_identified ?? false,
      };

      // Check if status changed - compare ORIGINAL status from selectedTask with NEW status from backend
      const originalStatus = selectedTask?.status;
      const newStatus = savedTask.status;
      const statusChanged = originalStatus !== newStatus;

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
            // Re-sort the target column by MVP score
            targetColumn.tasks = sortTasksByMVP(targetColumn.tasks);
          } else {
            console.warn(
              "Target column not found for status:",
              savedTask.status
            );
            // Return original columns if validation fails
            return prevColumns;
          }

          // Re-sort all columns
          return newBoard.map((col) => ({
            ...col,
            tasks: sortTasksByMVP(col.tasks),
          }));
        } else {
          // Status same - just update in place and re-sort
          return prevColumns.map((col) => {
            const updatedTasks = col.tasks.map((task) =>
              task.id === savedTask.id ? savedTask : task
            );
            return {
              ...col,
              tasks: sortTasksByMVP(updatedTasks),
            };
          });
        }
      });

      // Also update originalColumnData to keep it in sync
      setOriginalColumnData((prevColumns) => {
        if (!Array.isArray(prevColumns)) {
          return prevColumns;
        }

        if (statusChanged) {
          const newBoard = prevColumns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== savedTask.id),
          }));

          const targetColumn = newBoard.find(
            (col) => col.title === savedTask.status
          );
          if (targetColumn) {
            targetColumn.tasks.push(savedTask);
            targetColumn.tasks = sortTasksByMVP(targetColumn.tasks);
          }

          return newBoard.map((col) => ({
            ...col,
            tasks: sortTasksByMVP(col.tasks),
          }));
        } else {
          return prevColumns.map((col) => {
            const updatedTasks = col.tasks.map((task) =>
              task.id === savedTask.id ? savedTask : task
            );
            return {
              ...col,
              tasks: sortTasksByMVP(updatedTasks),
            };
          });
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

          // Calculate MVP score: Business Value (from bv field) / Story Points
          const businessValue = idea.bv ?? 0;
          const storyPoints = idea.storyPoints ?? idea.story_points ?? null;
          const hasValidValues =
            storyPoints !== null &&
            storyPoints !== undefined &&
            storyPoints > 0 &&
            businessValue > 0;
          if (hasValidValues) {
            idea.mvpScore = businessValue / storyPoints;
          } else {
            idea.mvpScore = 0;
          }

          // Normalize bv and storyPoints for consistent access
          idea.bv = businessValue;
          idea.storyPoints = storyPoints;
          idea.story_points = storyPoints;

          // Normalize moscowPriority - ensure null/empty string is treated as null
          const moscowPriorityValue =
            idea.moscowPriority ?? idea.moscow_priority ?? null;
          idea.moscowPriority =
            moscowPriorityValue === null ||
            moscowPriorityValue === undefined ||
            moscowPriorityValue === ""
              ? null
              : moscowPriorityValue;
          idea.moscow_priority = idea.moscowPriority;

          // Normalize all validation fields for consistent access (both camelCase and snake_case)
          // Needs Refinement fields
          idea.refinementSessionScheduled =
            idea.refinementSessionScheduled ??
            idea.refinement_session_scheduled ??
            false;
          idea.refinement_session_scheduled = idea.refinementSessionScheduled;
          idea.groomed = idea.groomed ?? false;
          idea.dependencies = idea.dependencies ?? "";
          idea.sessionDocumented =
            idea.sessionDocumented ?? idea.session_documented ?? false;
          idea.session_documented = idea.sessionDocumented;

          // In Refinement fields
          idea.teamApproval = idea.teamApproval ?? idea.team_approval ?? false;
          idea.team_approval = idea.teamApproval;
          idea.poApproval = idea.poApproval ?? idea.po_approval ?? false;
          idea.po_approval = idea.poApproval;

          // Ready To Commit fields (Sprint Planning)
          idea.sprintCapacity =
            idea.sprintCapacity ?? idea.sprint_capacity ?? null;
          idea.sprint_capacity = idea.sprintCapacity;
          idea.skillsAvailable =
            idea.skillsAvailable ?? idea.skills_available ?? false;
          idea.skills_available = idea.skillsAvailable;
          idea.teamCommits = idea.teamCommits ?? idea.team_commits ?? false;
          idea.team_commits = idea.teamCommits;
          idea.tasksIdentified =
            idea.tasksIdentified ?? idea.tasks_identified ?? false;
          idea.tasks_identified = idea.tasksIdentified;

          const column = newBoard.find((col) => col.title === idea.status);
          if (column) {
            column.tasks.push(idea);
          } else {
            console.warn("Column not found for status:", idea.status);
          }
        });

        // Sort tasks within each column by MVP score using the reusable function
        newBoard.forEach((col) => {
          col.tasks = sortTasksByMVP(col.tasks);
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
      params.push(`assignees=${[...f.assignees].join(",")}`);
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

  // Only title and description are required - assignees is optional
  const isFormValid =
    newIdea.title.trim() !== "" && newIdea.description.trim() !== "";

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
      <Header
        onCreateIdeaClick={handleOpenCreateModal}
        onExportClick={handleExportClickJSON}
      />
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
              onAssign={handleEditTask}
              onDelete={handleDeleteTask}
              onMoveToTop={handleMoveToTop}
              onSort={handleSort}
              isOperationInProgress={isSaving || isLoading}
              onPreview={handlePreviewTask}
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
          className="sm:max-w-3xl"
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
