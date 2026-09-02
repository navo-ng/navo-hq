"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeEntity(
  table: string,
  filter: string | null,
  onInsert?: (payload: unknown) => void,
  onUpdate?: (payload: unknown) => void,
  onDelete?: (payload: unknown) => void
) {
  const supabase = createClient();

  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table, filter: filter || undefined },
        (payload) => onInsertRef.current?.(payload)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table, filter: filter || undefined },
        (payload) => onUpdateRef.current?.(payload)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table, filter: filter || undefined },
        (payload) => onDeleteRef.current?.(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, table, filter]);
}
