import { Gem } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

import { LoginForm } from "../../_components/login-form";

export default function LoginV1() {
  return (
    <div className="flex h-dvh">
      {/* Photo panel */}
      <div className="relative hidden overflow-hidden lg:block lg:w-1/3">
        {/* biome-ignore lint/performance/noImgElement: decorative background */}
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900&q=80&fit=crop"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/55" />
        {/* Content */}
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Gem className="mx-auto size-12 text-white" />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-white">{APP_CONFIG.name}</h1>
              <p className="text-white/70 text-xl">Admin Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Login</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              Welcome back. Enter your email and password to access the admin panel.
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
