import "next-auth";
import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiry?: number;
    refreshTokenExpiry?: number;
    error?: "RefreshTokenExpired";
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: "RefreshTokenExpired";
    user: {
      id?: string;
    } & import("next-auth").DefaultSession["user"];
  }
  interface User {
    accessToken?: string | null;
    refreshToken?: string | null;
    accessTokenExpiry?: number | null;
    refreshTokenExpiry?: number | null;
  }
}
