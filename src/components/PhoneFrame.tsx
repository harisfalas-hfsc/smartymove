import { type ReactNode } from "react";
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.04_210),_oklch(0.99_0.005_220))]">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col sm:py-8">
        <div className="relative flex-1 overflow-hidden bg-background sm:rounded-[2.5rem] sm:shadow-soft sm:ring-1 sm:ring-border">
          {children}
        </div>
      </div>
    </div>
  );
}
