"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

interface CurrentUser {
  userId: string;
  role: UserRole | null;
  fullName: string;
  loading: boolean;
}

const UserContext = createContext<CurrentUser>({
  userId: "",
  role: null,
  fullName: "",
  loading: true,
});

export function useCurrentUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser>({
    userId: "",
    role: null,
    fullName: "",
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    async function fetchUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser({ userId: "", role: null, fullName: "", loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role_id, roles(name)")
        .eq("id", authUser.id)
        .single();

      const roles = profile?.roles as { name: UserRole }[] | undefined;
      setUser({
        userId: authUser.id,
        role: roles?.[0]?.name ?? null,
        fullName: profile?.name ?? "",
        loading: false,
      });
    }

    fetchUser();
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
