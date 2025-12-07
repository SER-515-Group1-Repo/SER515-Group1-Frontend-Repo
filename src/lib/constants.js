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
export const STORY_POINTS_OPTIONS = [0, 1, 2, 3, 5, 8, 13, 21];

// MoSCoW Priority options
export const PRIORITY_OPTIONS = [
  "Must Have",
  "Should Have",
  "Could Have",
  "Won't Have",
];

// Business Value options (1-10 scale)
export const BUSINESS_VALUE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Status transition validation rules
// Defines what fields are required to move FROM one status TO another
export const TRANSITION_RULES = {
  // Forward transitions
  "Backlog->Proposed": {
    required: ["description", "businessValue"],
    message: "To move to Proposed, story needs: Description and Business Value",
  },
  "Proposed->Needs Refinement": {
    required: ["acceptanceCriteria", "priority"],
    message: "To move to Needs Refinement, story needs: At least 1 Acceptance Criterion and Priority",
  },
  "Needs Refinement->In Refinement": {
    required: ["sessionScheduled", "isGroomed", "dependenciesIdentified"],
    message: "To move to In Refinement: Session must be scheduled, story groomed, and dependencies identified",
  },
  "In Refinement->Ready To Commit": {
    required: ["storyPoints", "acceptanceCriteria", "dependenciesResolved", "teamApproval", "poApproval"],
    message: "To move to Ready To Commit: Story Points, AC, Dependencies Resolved, Team & PO Approval required",
  },
  "Ready To Commit->Sprint Ready": {
    required: ["capacityConfirmed", "skillsAvailable", "teamCommitted"],
    message: "To move to Sprint Ready: Capacity confirmed, skills available, and team committed",
  },
  // Backward transitions - always allowed (with warning)
  "Proposed->Backlog": { required: [], message: "", isBackward: true },
  "Needs Refinement->Proposed": { required: [], message: "", isBackward: true },
  "In Refinement->Needs Refinement": { required: [], message: "", isBackward: true },
  "Ready To Commit->In Refinement": { required: [], message: "", isBackward: true },
  "Sprint Ready->Ready To Commit": { required: [], message: "", isBackward: true },
};

// Helper function to validate a status transition
export const validateTransition = (story, fromStatus, toStatus) => {
  const transitionKey = `${fromStatus}->${toStatus}`;
  const rule = TRANSITION_RULES[transitionKey];

  // If no rule exists, check if it's a valid adjacent transition
  if (!rule) {
    const fromIndex = STATUS_OPTIONS.indexOf(fromStatus);
    const toIndex = STATUS_OPTIONS.indexOf(toStatus);
    
    // Allow skipping if going backward (with warning)
    if (toIndex < fromIndex) {
      return { 
        valid: true, 
        warnings: ["Moving story backward in the workflow"], 
        isBackward: true 
      };
    }
    
    // Block skipping forward stages
    if (toIndex > fromIndex + 1) {
      return { 
        valid: false, 
        errors: ["Cannot skip stages. Please move through each stage sequentially."],
        missingFields: []
      };
    }
    
    return { valid: true, warnings: [], errors: [] };
  }

  // Backward transitions are always allowed
  if (rule.isBackward) {
    return { valid: true, warnings: ["Moving story backward in the workflow"], isBackward: true };
  }

  // Check required fields
  const missingFields = [];
  
  for (const field of rule.required) {
    switch (field) {
      case "description":
        if (!story.description || story.description.trim() === "") {
          missingFields.push("Description");
        }
        break;
      case "businessValue":
        if (!story.businessValue) {
          missingFields.push("Business Value");
        }
        break;
      case "acceptanceCriteria":
        const ac = story.acceptanceCriteria || [];
        const validAC = ac.filter(c => c && c.trim() !== "");
        if (validAC.length === 0) {
          missingFields.push("At least 1 Acceptance Criterion");
        }
        break;
      case "priority":
        if (!story.priority) {
          missingFields.push("Priority");
        }
        break;
      case "storyPoints":
        if (story.storyPoints === null || story.storyPoints === undefined || story.storyPoints === "") {
          missingFields.push("Story Points");
        }
        break;
      case "sessionScheduled":
        if (!story.sessionScheduled) {
          missingFields.push("Refinement Session Scheduled");
        }
        break;
      case "isGroomed":
        if (!story.isGroomed) {
          missingFields.push("Story Groomed");
        }
        break;
      case "dependenciesIdentified":
        if (!story.dependenciesIdentified) {
          missingFields.push("Dependencies Identified");
        }
        break;
      case "dependenciesResolved":
        if (!story.dependenciesResolved) {
          missingFields.push("Dependencies Resolved");
        }
        break;
      case "teamApproval":
        if (!story.teamApproval) {
          missingFields.push("Team Approval");
        }
        break;
      case "poApproval":
        if (!story.poApproval) {
          missingFields.push("PO Approval");
        }
        break;
      case "capacityConfirmed":
        if (!story.capacityConfirmed) {
          missingFields.push("Capacity Confirmed");
        }
        break;
      case "skillsAvailable":
        if (!story.skillsAvailable) {
          missingFields.push("Skills Available");
        }
        break;
      case "teamCommitted":
        if (!story.teamCommitted) {
          missingFields.push("Team Committed");
        }
        break;
    }
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      errors: [rule.message],
      missingFields,
    };
  }

  return { valid: true, warnings: [], errors: [], missingFields: [] };
};