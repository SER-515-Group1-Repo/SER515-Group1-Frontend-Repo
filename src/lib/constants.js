export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const nameRegex = /^[A-Za-z\s]+$/;
export const userNameRegex = /^[A-Za-z0-9]+$/;

export const STATUS_OPTIONS = [
  "Backlog",
  "Proposed",
  "Needs Refinement",
  "In Refinement",
  "Ready To Commit",
  "Sprint Ready",
];

// Fibonacci sequence values for story points (Agile/Scrum industry standard)
// Values beyond 13 indicate story should be broken down into smaller tasks
// Note: 0 is excluded because a 0-point story means no effort = not a real story
export const STORY_POINTS_OPTIONS = [1, 2, 3, 5, 8, 13, 21];

/**
 * Field visibility configuration per status.
 * Controls which fields are shown in forms based on the story's current status.
 * Fields become visible as stories progress through the workflow.
 * 
 * Backend Validation Rules:
 * - Backlog → Proposed: description, bv required
 * - Proposed → Needs Refinement: description, bv, acceptance_criteria required
 * - Needs Refinement → In Refinement: refinement_session_scheduled, groomed, dependencies, session_documented required
 * - In Refinement → Ready To Commit: story_points, acceptance_criteria, dependencies, team_approval, po_approval required
 * - Ready To Commit → Sprint Ready: sprint_capacity, skills_available, team_commits, tasks_identified required
 */
export const FIELD_VISIBILITY = {
  // Backlog: Basic info only - no AC or story points needed yet
  "Backlog": {
    acceptanceCriteria: false,
    storyPoints: false,
    bv: false,
    // Needs Refinement fields
    refinementSessionScheduled: false,
    groomed: false,
    dependencies: false,
    sessionDocumented: false,
    // In Refinement fields
    teamApproval: false,
    poApproval: false,
    // Ready To Commit fields
    sprintCapacity: false,
    skillsAvailable: false,
    teamCommits: false,
    tasksIdentified: false,
  },
  // Proposed: Show BV and AC (required to move forward)
  "Proposed": {
    acceptanceCriteria: true,
    storyPoints: false,
    bv: true,
    // Needs Refinement fields
    refinementSessionScheduled: false,
    groomed: false,
    dependencies: false,
    sessionDocumented: false,
    // In Refinement fields
    teamApproval: false,
    poApproval: false,
    // Ready To Commit fields
    sprintCapacity: false,
    skillsAvailable: false,
    teamCommits: false,
    tasksIdentified: false,
  },
  // Needs Refinement: Show refinement checklist fields
  "Needs Refinement": {
    acceptanceCriteria: true,
    storyPoints: false,
    bv: true,
    // Needs Refinement fields - required to move to In Refinement
    refinementSessionScheduled: true,
    groomed: true,
    dependencies: true,
    sessionDocumented: true,
    // In Refinement fields
    teamApproval: false,
    poApproval: false,
    // Ready To Commit fields
    sprintCapacity: false,
    skillsAvailable: false,
    teamCommits: false,
    tasksIdentified: false,
  },
  // In Refinement: Show story points, approvals
  "In Refinement": {
    acceptanceCriteria: true,
    storyPoints: true,
    bv: true,
    // Needs Refinement fields (already completed)
    refinementSessionScheduled: true,
    groomed: true,
    dependencies: true,
    sessionDocumented: true,
    // In Refinement fields - required to move to Ready To Commit
    teamApproval: true,
    poApproval: true,
    // Ready To Commit fields
    sprintCapacity: false,
    skillsAvailable: false,
    teamCommits: false,
    tasksIdentified: false,
  },
  // Ready To Commit: Show sprint planning fields
  "Ready To Commit": {
    acceptanceCriteria: true,
    storyPoints: true,
    bv: true,
    // Needs Refinement fields
    refinementSessionScheduled: true,
    groomed: true,
    dependencies: true,
    sessionDocumented: true,
    // In Refinement fields
    teamApproval: true,
    poApproval: true,
    // Ready To Commit fields - required to move to Sprint Ready
    sprintCapacity: true,
    skillsAvailable: true,
    teamCommits: true,
    tasksIdentified: true,
  },
  // Sprint Ready: All fields visible
  "Sprint Ready": {
    acceptanceCriteria: true,
    storyPoints: true,
    bv: true,
    refinementSessionScheduled: true,
    groomed: true,
    dependencies: true,
    sessionDocumented: true,
    teamApproval: true,
    poApproval: true,
    sprintCapacity: true,
    skillsAvailable: true,
    teamCommits: true,
    tasksIdentified: true,
  },
};

/**
 * Helper function to get visible fields for a status
 */
export const getVisibleFields = (status) => {
  return FIELD_VISIBILITY[status] || FIELD_VISIBILITY["Backlog"];
};
