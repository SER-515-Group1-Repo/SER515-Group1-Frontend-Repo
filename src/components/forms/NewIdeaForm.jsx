// src/components/forms.jsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATUS_OPTIONS } from '../../lib/constants';

import TagsDropdown from "@/components/common/TagsDropdown";

const NewIdeaForm = ({ newIdea, setNewIdea, teamMembers, selectedColumn }) => {
  const teamMembersWithDefault = [
    { name: "Unassigned", id: 0, role: "" },
    ...teamMembers,
  ];



  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="idea-title" className="text-right">
          Title
        </Label>
        <Input
          id="idea-title"
          placeholder="Enter the title"
          className="col-span-3"
          value={newIdea.title}
          onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Description
        </Label>
        <textarea
          id="description"
          placeholder="Describe the new idea"
          className="col-span-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical min-h-24"
          value={newIdea.description}
          onChange={(e) =>
            setNewIdea({ ...newIdea, description: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status
        </Label>
        <select
          id="status"
          className="col-span-3 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={newIdea.status || selectedColumn || "Proposed"}
          onChange={(e) => setNewIdea({ ...newIdea, status: e.target.value })}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="assignee" className="text-right">
          Assignee
        </Label>
        <select
          id="assignee"
          className="col-span-3 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={newIdea.assignee || ""}
          onChange={(e) => setNewIdea({ ...newIdea, assignee: e.target.value })}
        >
          {teamMembersWithDefault.map((member, index) => (
            <option key={`${member.id}-${index}`} value={member.name}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <TagsDropdown newIdea={newIdea} setNewIdea={setNewIdea} />
    </div>
  );
};

export default NewIdeaForm;
