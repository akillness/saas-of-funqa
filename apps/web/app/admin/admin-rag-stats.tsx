"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { fetchRagStats } from "@/lib/funqa-api";

type AdminRagStatsProps = {
  documentLabel: string;
  chunkLabel: string;
  unavailable: string;
};

type Stats = {
  documentCount: number;
  chunkCount: number;
};

export function AdminRagStats({ documentLabel, chunkLabel, unavailable }: AdminRagStatsProps) {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (loading || !user) {
      setStats(null);
      return () => {
        cancelled = true;
      };
    }

    void user
      .getIdToken()
      .then(fetchRagStats)
      .then((next) => {
        if (!cancelled) setStats(next);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  return (
    <>
      <div>
        <dt>{documentLabel}</dt>
        <dd>{stats ? String(stats.documentCount) : unavailable}</dd>
      </div>
      <div>
        <dt>{chunkLabel}</dt>
        <dd>{stats ? String(stats.chunkCount) : unavailable}</dd>
      </div>
    </>
  );
}
