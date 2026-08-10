"use client";

import { useState } from "react";

import { useSession } from "next-auth/react";

import { apiRequest } from "@/lib/api-client";

import type { CreateVendorLotApiResponse, CreateVendorLotPayload } from "./vendor-lot-types";

export function useCreateVendorLot() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [isLoading, setIsLoading] = useState(false);

  async function createLot(payload: CreateVendorLotPayload) {
    setIsLoading(true);
    try {
      return await apiRequest<CreateVendorLotApiResponse>("/api/vendor/lots", token, {
        method: "POST",
        body: payload,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return { createLot, isLoading };
}
