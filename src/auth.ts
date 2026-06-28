import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password) return null;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (apiUrl) {
          try {
            const res = await fetch(`${apiUrl}/auth/admin-login`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Tenant-Domain": process.env.TENANT_DOMAIN ?? "admin",
              },
              body: JSON.stringify({ email, password }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            return {
              id: String(data.user.id),
              email: data.user.email,
              name: data.user.username ?? data.user.email,
              image: data.user.avatar || null,
              accessToken: data.accessToken ?? null,
              refreshToken: data.refreshToken ?? null,
              accessTokenExpiry: data.accessTokenExpiry ?? null,
              refreshTokenExpiry: data.refreshTokenExpiry ?? null,
            };
          } catch {
            return null;
          }
        }

        // Development fallback
        const devEmail = process.env.ADMIN_EMAIL ?? "admin@gemsbid.com";
        const devPassword = process.env.ADMIN_PASSWORD ?? "admin123";
        if (email === devEmail && password === devPassword) {
          return { id: "1", email, name: "Admin" };
        }

        return null;
      },
    }),
  ],
});
