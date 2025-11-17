import { Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ActionPopover } from "@/components/common/ActionPopover";

export function Header({ onCreateIdeaClick }) {
  const navigate = useNavigate();

  const { logout } = useAuth();

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
        <ActionPopover trigger={settingsTrigger} contentClassName="w-48 p-2">
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
    </header>
  );
}
