import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import AssigneeDropdown from "@/components/common/AssigneeDropdown";
import { STATUS_OPTIONS } from "../../lib/constants";
import { Input } from "@/components/ui/input";
import TagsDropdown from "@/components/common/TagsDropdown";
import { ChevronDown } from "lucide-react";

const NewIdeaForm = ({
  newIdea,
  setNewIdea,
  teamMembers = [],
  selectedColumn,
}) => {
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const assigneeRef = useRef(null);
  // Local state for acceptance criteria template and GWT structured values
  const [localTemplate, setLocalTemplate] = useState(newIdea.acceptanceTemplate || 'numbered');
  const [gwtCriteriaLocal, setGwtCriteriaLocal] = useState([]);

  const combineGwtToString = (g) => {
    const given = g.given?.trim() || "";
    const when = g.when?.trim() || "";
    const then = g.then?.trim() || "";
    return `Given: ${given} | When: ${when} | Then: ${then}`;
  };

  const parseStringToGwt = (str) => {
    if (!str || typeof str !== 'string') return { given: '', when: '', then: '' };
    const givenMatch = str.match(/Given:\s*([^|]*)/i);
    const whenMatch = str.match(/When:\s*([^|]*)/i);
    const thenMatch = str.match(/Then:\s*([^|]*)/i);
    if (givenMatch || whenMatch || thenMatch) {
      return {
        given: givenMatch ? givenMatch[1].trim() : '',
        when: whenMatch ? whenMatch[1].trim() : '',
        then: thenMatch ? thenMatch[1].trim() : '',
      };
    }
    return { given: str, when: '', then: '' };
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        setIsAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">
          Title
        </Label>
        <Input
          id="title"
          placeholder="e.g. Improve task filter UX"
          className="col-span-3"
          value={newIdea.title}
          onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="description" className="text-right pt-2">
          Description
        </Label>
        <textarea
          id="description"
          rows={4}
          placeholder="Briefly describe the idea…"
          className="col-span-3 h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                     ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

      <AssigneeDropdown
        newIdea={newIdea}
        setNewIdea={setNewIdea}
        teamMembers={teamMembers}
      />

      {/* Tags */}
      <TagsDropdown newIdea={newIdea} setNewIdea={setNewIdea} />

      {/* Acceptance Criteria */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">Acceptance Criteria</Label>
        <div className="col-span-3 space-y-2">
          <div className="flex items-center gap-4 mb-2">
            <label className="text-sm flex items-center gap-2">
              <input
                type="radio"
                name="new-ac-template"
                value="numbered"
                checked={localTemplate === 'numbered'}
                onChange={() => setLocalTemplate('numbered')}
              />
              <span className="text-sm">Numbered list</span>
            </label>
            <label className="text-sm flex items-center gap-2">
              <input
                type="radio"
                name="new-ac-template"
                value="gwt"
                checked={localTemplate === 'gwt'}
                onChange={() => {
                  setLocalTemplate('gwt');
                  const parsed = (newIdea.acceptanceCriteria || []).map((s) => parseStringToGwt(s));
                  setGwtCriteriaLocal(parsed.length ? parsed : [{ given: '', when: '', then: '' }]);
                  setNewIdea({ ...newIdea, acceptanceTemplate: 'gwt', acceptanceCriteria: parsed.map((g) => combineGwtToString(g)) });
                }}
              />
              <span className="text-sm">Given / When / Then</span>
            </label>
          </div>

          {(newIdea.acceptanceCriteria || []).map((criteria, index) => (
            <div key={index} className="flex gap-2">
              {localTemplate === 'gwt' ? (
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input placeholder="Given..." value={gwtCriteriaLocal[index]?.given || ''} onChange={(e) => {
                    const updated = [...gwtCriteriaLocal];
                    updated[index] = { ...updated[index], given: e.target.value };
                    setGwtCriteriaLocal(updated);
                    setNewIdea({ ...newIdea, acceptanceCriteria: updated.map((g) => combineGwtToString(g)) });
                  }} />
                  <Input placeholder="When..." value={gwtCriteriaLocal[index]?.when || ''} onChange={(e) => {
                    const updated = [...gwtCriteriaLocal];
                    updated[index] = { ...updated[index], when: e.target.value };
                    setGwtCriteriaLocal(updated);
                    setNewIdea({ ...newIdea, acceptanceCriteria: updated.map((g) => combineGwtToString(g)) });
                  }} />
                  <Input placeholder="Then..." value={gwtCriteriaLocal[index]?.then || ''} onChange={(e) => {
                    const updated = [...gwtCriteriaLocal];
                    updated[index] = { ...updated[index], then: e.target.value };
                    setGwtCriteriaLocal(updated);
                    setNewIdea({ ...newIdea, acceptanceCriteria: updated.map((g) => combineGwtToString(g)) });
                  }} />
                </div>
              ) : (
                <Input placeholder={`Criterion ${index + 1}`} value={criteria} onChange={(e) => setNewIdea({ ...newIdea, acceptanceCriteria: (newIdea.acceptanceCriteria || []).map((c, i) => i === index ? e.target.value : c) })} className="flex-1" />
              )}
              <button type="button" className="p-2 rounded border" onClick={() => {
                const updated = (newIdea.acceptanceCriteria || []).filter((_, i) => i !== index);
                setNewIdea({ ...newIdea, acceptanceCriteria: updated });
                if (localTemplate === 'gwt') {
                  const gwtUpdated = gwtCriteriaLocal.filter((_, i) => i !== index);
                  setGwtCriteriaLocal(gwtUpdated);
                }
              }}>Remove</button>
            </div>
          ))}

          <div className="text-xs text-muted-foreground mb-2">{(newIdea.acceptanceCriteria || []).length}/5 criteria</div>
          <button type="button" className="w-full rounded border py-2" onClick={() => {
            if ((newIdea.acceptanceCriteria || []).length >= 5) return alert('Maximum 5 acceptance criteria allowed');
            if (localTemplate === 'gwt') {
              const updatedGwt = [...gwtCriteriaLocal, { given: '', when: '', then: '' }];
              setGwtCriteriaLocal(updatedGwt);
              setNewIdea({ ...newIdea, acceptanceCriteria: updatedGwt.map((g) => combineGwtToString(g)), acceptanceTemplate: 'gwt' });
            } else {
              setNewIdea({ ...newIdea, acceptanceCriteria: [...(newIdea.acceptanceCriteria || []), ''] });
            }
          }}>+ Add Criterion</button>
        </div>
      </div>
    </div>
  );
};

export default NewIdeaForm;
