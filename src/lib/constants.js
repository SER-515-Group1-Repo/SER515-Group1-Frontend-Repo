export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const nameRegex = /^[A-Za-z\s]+$/;
export const userNameRegex = /^[A-Za-z0-9]+$/;

export const STATUS_OPTIONS = [
  "Proposed",
  "Needs Refinement",
  "In Refinement",
  "Ready To Commit",
  "Sprint Ready",
];

// Fibonacci sequence values for story points (Agile/Scrum industry standard)
// Values beyond 13 indicate story should be broken down into smaller tasks
export const STORY_POINTS_OPTIONS = [0, 1, 2, 3, 5, 8, 13, 21];