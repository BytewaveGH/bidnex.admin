"use client";

import { useState } from "react";

import { useSession } from "next-auth/react";

import { apiRequest } from "@/lib/api-client";

type UploadVendorLotImagesApiResponse = {
  data?: unknown;
  status?: boolean;
  message?: string;
  error?: string;
};

export function useUploadVendorLotImages() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [isLoading, setIsLoading] = useState(false);

  async function uploadLotImages(lotId: string, files: File[]) {
    if (files.length === 0) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("images", file);
      }

      return await apiRequest<UploadVendorLotImagesApiResponse>(`/api/admin/lots/${lotId}/images`, token, {
        method: "POST",
        body: formData,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return { uploadLotImages, isLoading };
}
