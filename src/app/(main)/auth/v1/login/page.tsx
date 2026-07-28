import Image from "next/image";

import { APP_CONFIG } from "@/config/app-config";

import adminImage from "../../../../../../media/adminImage.jpeg";
import logoImage from "../../../../../../media/logo.png";
import { LoginForm } from "../../_components/login-form";

export default function LoginV1() {
  return (
    <div className="flex h-dvh">
      {/* Photo panel */}
      <div className="relative hidden overflow-hidden lg:block lg:w-1/3">
        <Image src={adminImage} alt="" fill className="object-cover" priority />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/55" />
        {/* Content */}
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Image src={logoImage} alt={APP_CONFIG.name} width={64} height={64} className="mx-auto invert" />
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
