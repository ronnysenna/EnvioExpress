"use client";

import { useState, useEffect, useCallback } from "react";

interface TrialInfo {
  isOnTrial: boolean;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  hasTrialExpired: boolean;
  canAccessFeatures: boolean;
}

interface UseTrialStatusReturn {
  trial: TrialInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canAccess: (feature?: string) => boolean;
  isBlocked: boolean;
}

export function useTrialStatus(): UseTrialStatusReturn {
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrialStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/subscription/status");

      if (!response.ok) {
        throw new Error("Failed to fetch trial status");
      }

      const data = await response.json();
      setTrial(data.trial || null);
    } catch (err) {
      console.error("Error fetching trial status:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrialStatus();
  }, [fetchTrialStatus]);

  const canAccess = useCallback(
    (_feature?: string) => {
      if (!trial) return false;
      return trial.canAccessFeatures;
    },
    [trial]
  );

  const isBlocked = !trial?.canAccessFeatures;

  return {
    trial,
    loading,
    error,
    refresh: fetchTrialStatus,
    canAccess,
    isBlocked,
  };
}

// Hook para verificar limites de plano para ações específicas
interface UsePlanLimitsReturn {
  checkLimit: (action: string) => Promise<{
    allowed: boolean;
    limit?: number;
    current?: number;
    error?: string;
  }>;
  loading: boolean;
}

export function usePlanLimits(): UsePlanLimitsReturn {
  const [loading, setLoading] = useState(false);

  const checkLimit = useCallback(async (action: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/subscription/check-limits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Failed to check limits");
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking limits:", error);
      return {
        allowed: false,
        error: "Erro ao verificar limites",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkLimit,
    loading,
  };
}
