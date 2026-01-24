import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  isPremium: boolean;
  planType: string | null;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      return false;
    }

    setIsChecking(true);
    try {
      // Try to call the admin function - if it returns 403, user is not admin
      const { data, error } = await supabase.functions.invoke("admin", {
        body: { action: "list-users", perPage: 1 },
      });

      if (error) {
        setIsAdmin(false);
        return false;
      }

      setIsAdmin(true);
      return true;
    } catch {
      setIsAdmin(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  const listUsers = useCallback(async (page = 1, perPage = 50) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("admin", {
        body: { action: "list-users", page, perPage },
      });

      if (error) throw error;
      setUsers(data.users);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("admin", {
        body: { action: "search-users", query },
      });

      if (error) throw error;
      setUsers(data.users);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setPremium = useCallback(async (targetUserId: string, isPremium: boolean, planType = "yearly") => {
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("admin", {
        body: { action: "set-premium", targetUserId, isPremium, planType },
      });

      if (error) throw error;
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId
            ? {
                ...u,
                isPremium,
                subscriptionStatus: isPremium ? "active" : "canceled",
                planType: isPremium ? planType : u.planType,
              }
            : u
        )
      );

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  return {
    isAdmin,
    isChecking,
    users,
    isLoading,
    error,
    checkAdminStatus,
    listUsers,
    searchUsers,
    setPremium,
  };
}
