import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastNotify } from "@/lib/utils";
import apiClient from "@/api/axios";

export function RoleAssignmentModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedUserRole, setSelectedUserRole] = useState({});
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchRoles();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await apiClient.get(
        `${import.meta.env.VITE_BASE_URL}/users`
      );
      setUsers(data || []);
      // Initialize selected roles
      const initialRoles = {};
      data.forEach((user) => {
        initialRoles[user.id] = user.role_code || "";
      });
      setSelectedUserRole(initialRoles);
    } catch (error) {
      console.error("Failed to load users:", error);
      toastNotify("Failed to load users", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const { data } = await apiClient.get(
        `${import.meta.env.VITE_BASE_URL}/roles`
      );
      setRoles(data || []);
    } catch (error) {
      console.error("Failed to load roles:", error);
      toastNotify("Failed to load roles", "error");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleAssignRole = async (userId, roleCode) => {
    if (!roleCode) {
      toastNotify("Please select a role", "warning");
      return;
    }

    setUpdatingUserId(userId);
    try {
      await apiClient.patch(
        `${import.meta.env.VITE_BASE_URL}/users/${userId}/role`,
        {
          role_code: roleCode,
        }
      );
      toastNotify("Role assigned successfully", "success");
    } catch (error) {
      console.error("Failed to assign role:", error);
      toastNotify(
        error?.response?.data?.detail || "Failed to assign role",
        "error"
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b flex justify-between items-center p-6">
          <h2 className="text-xl font-semibold">Assign Roles to Users</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {loadingUsers ? (
            <p className="text-center text-gray-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500">No users found</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Username: {user.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedUserRole[user.id] || ""}
                      onChange={(e) =>
                        setSelectedUserRole({
                          ...selectedUserRole,
                          [user.id]: e.target.value,
                        })
                      }
                      disabled={loadingRoles || updatingUserId === user.id}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
                    >
                      <option value="">Select role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.code}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={() =>
                        handleAssignRole(user.id, selectedUserRole[user.id])
                      }
                      disabled={
                        updatingUserId === user.id || !selectedUserRole[user.id]
                      }
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      {updatingUserId === user.id ? "Saving..." : "Assign"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 border-t p-4">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
