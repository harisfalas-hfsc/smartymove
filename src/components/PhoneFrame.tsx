import { type ReactNode } from "react";
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col">
        <div className="relative flex-1 bg-background">{children}</div>
      </div>
    </div>
  );
}
