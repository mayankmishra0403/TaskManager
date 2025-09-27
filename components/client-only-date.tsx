"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface ClientOnlyDateProps {
  date: string | Date;
  addSuffix?: boolean;
}

export function ClientOnlyDate({ date, addSuffix = true }: ClientOnlyDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="text-xs text-muted-foreground">...</span>;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {formatDistanceToNow(new Date(date), { addSuffix })}
    </span>
  );
}
