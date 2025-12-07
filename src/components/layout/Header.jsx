import { Settings, LogOut, Users } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ActionPopover } from "@/components/common/ActionPopover";
import { RoleAssignmentModal } from "@/components/common/RoleAssignmentModal";

export function Header({ onCreateIdeaClick, onExportClick }) {
  const navigate = useNavigate();
  const { logout, role: userRole } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);

  const settingsTrigger = (
    <Button variant="outline" size="icon">
      <Settings className="w-5 h-5" />
    </Button>
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2 cursor-pointer">
        <h1 className="text-xl font-semibold">Project Board</h1>
      </div>

      <div className="flex items-center space-x-4">
        {}
        <Button onClick={() => onCreateIdeaClick("Proposed")}>
          + Create Idea
        </Button>
        <Button variant="secondary" onClick={() => onExportClick()}>
          Export
        </Button>

        <ActionPopover trigger={settingsTrigger} contentClassName="w-48 p-2">
          {userRole === "product-manager" && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowRoleModal(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Assign Role</span>
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
        </ActionPopover>
      </div>

      {/* Role Assignment Modal */}
      <RoleAssignmentModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />
    </header>
  );
}
