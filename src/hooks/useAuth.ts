// Re-export from AuthContext — single source of truth for auth state
// This file exists for backward compatibility so all existing imports keep working
import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  return useAuthContext();
}
