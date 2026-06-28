"use client";

import { useEffect } from "react";

import { signOut, useSession } from "next-auth/react";

export function SessionGuard() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshTokenExpired") {
      void signOut({ callbackUrl: "/auth/v1/login" });
    }
  }, [session?.error]);

  return null;
}
