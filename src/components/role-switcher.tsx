"use client";

import { useAuth } from "@/lib/auth-context";
import { userRoleLabels } from "@/lib/utils";
import { ChevronDown, User } from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const roles: UserRole[] = ["inspector", "operation_manager", "maintenance_worker", "reviewer"];

export function RoleSwitcher() {
  const { currentUser, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <User className="h-4 w-4" />
        <span>角色: {currentUser ? userRoleLabels[currentUser.role] : "未选择"}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="py-1">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-4 py-2 text-sm text-left transition-colors",
                    currentUser?.role === role
                      ? "bg-amber-50 text-amber-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {userRoleLabels[role]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
