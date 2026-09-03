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
        .select("name, role_id")
        .eq("id", authUser.id)
        .single();

      let roleName: UserRole | null = null;

      if (profile?.role_id) {
        const { data: roleData } = await supabase
          .from("roles")
          .select("name")
          .eq("id", profile.role_id)
          .single();

        if (roleData?.name) {
          roleName = roleData.name.toLowerCase() as UserRole;
        }
      }

      setUser({
        userId: authUser.id,
        role: roleName,
        fullName: profile?.name ?? "",
        loading: false,
      });
    }

    fetchUser();
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
