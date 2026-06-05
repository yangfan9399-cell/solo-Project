import { createContext, useContext } from "react";
import type { UserRole } from "./utils";

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useCurrentRole() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useCurrentRole must be used within AppProvider");
  }
  return context;
}
