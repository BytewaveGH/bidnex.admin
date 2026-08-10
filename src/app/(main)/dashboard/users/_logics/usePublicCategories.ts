"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import { apiRequest } from "@/lib/api-client";

export type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconUrl?: string;
  createdAt: string;
};

type PublicCategoriesResponse = {
  data: PublicCategory[];
  status: boolean;
};

export function usePublicCategories(enabled = true) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function fetchCategories() {
      setIsLoading(true);
      setError(null);

      try {
        const body = await apiRequest<PublicCategoriesResponse>("/api/public/categories", token);
        if (cancelled) return;
        setCategories(body.data ?? []);
      } catch {
        if (!cancelled) {
          setError("Failed to load categories.");
          setCategories([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [enabled, token]);

  return { categories, isLoading, error };
}
