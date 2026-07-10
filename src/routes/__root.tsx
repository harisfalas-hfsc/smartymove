import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PaywallProvider } from "@/lib/paywall";
import { SisterAppsPopup } from "@/components/growth/SisterAppsPopup";
import { BottomTabs } from "@/components/BottomTabs";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SmartyMove — AI Movement Intelligence Platform | Movement Score & Corrective Coach" },
      { name: "description", content: "SmartyMove is the AI Movement Intelligence Platform. Scan your movement with your phone camera, get your Smarty Movement Score™, Movement Age™, and a personalized 5-minute daily corrective exercise program." },
      { name: "author", content: "SmartyMove" },
      { name: "keywords", content: "movement screening, movement analysis, movement assessment, movement intelligence, AI movement coach, functional movement screen, FMS, mobility assessment, movement score, movement age, corrective exercise, injury prevention, biomechanics, movement quality, postural assessment, movement patterns, movement compensation, dynamic stability, joint mobility, movement rehabilitation, human performance assessment, digital physiotherapy, movement diagnostics, movement scanner, AI mobility assessment, AI functional assessment, movement health, movement risk, movement readiness, corrective training, mobility exercises, stability exercises" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "google", content: "notranslate" },
      { name: "application-name", content: "SmartyMove" },
      { name: "apple-mobile-web-app-title", content: "SmartyMove" },
      { name: "theme-color", content: "#38bdf8" },
      { property: "og:site_name", content: "SmartyMove" },
      { property: "og:locale", content: "en_US" },
      { property: "og:title", content: "SmartyMove — AI Movement Intelligence Platform" },
      { property: "og:description", content: "Scan your movement. Get your Smarty Movement Score™ and Movement Age™. Fix your weakest link in 5 minutes a day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@smartymove" },
      { name: "twitter:title", content: "SmartyMove — AI Movement Intelligence Platform" },
      { name: "twitter:description", content: "Scan your movement. Get your Smarty Movement Score™ and Movement Age™. Fix your weakest link in 5 minutes a day." },
      { property: "og:image", content: "https://smartymove.com/__l5e/assets-v1/55cc1cbc-55bc-4e27-b23e-f04ea9e5e5b4/smartymove-social.png" },
      { name: "twitter:image", content: "https://smartymove.com/__l5e/assets-v1/55cc1cbc-55bc-4e27-b23e-f04ea9e5e5b4/smartymove-social.png" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", href: "/__l5e/assets-v1/96e554d0-a8d8-4890-8280-4c595e2d844e/favicon.png" },
      { rel: "apple-touch-icon", href: "/__l5e/assets-v1/96e554d0-a8d8-4890-8280-4c595e2d844e/favicon.png" },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "https://smartymove.com/#organization",
          name: "SmartyMove",
          alternateName: ["Smarty Move", "SmartyMove AI"],
          url: "https://smartymove.com",
          logo: "https://smartymove.com/__l5e/assets-v1/96e554d0-a8d8-4890-8280-4c595e2d844e/favicon.png",
          email: "smartymove@outlook.com",
          description: "SmartyMove is the AI Movement Intelligence Platform: a camera-based functional movement screen, Movement Score, Movement Age, and personalized corrective exercise program.",
          foundingDate: "2024",
          knowsAbout: [
            "Functional Movement Screening", "Movement Analysis", "Movement Assessment",
            "Corrective Exercise", "Mobility", "Stability", "Biomechanics",
            "Injury Prevention", "Postural Assessment", "Movement Quality",
            "AI Movement Analysis", "Digital Physiotherapy", "Human Performance"
          ],
          parentOrganization: { "@type": "Organization", name: "Smarty" },
          sameAs: [
            "https://smartygym.app",
            "https://smartygym.com",
            "https://smartydiet.com",
            "https://www.facebook.com/share/1BNn6zb2SJ/",
            "https://www.instagram.com/thesmartymove"
          ],
          contactPoint: [{
            "@type": "ContactPoint",
            email: "smartymove@outlook.com",
            contactType: "customer support",
            availableLanguage: ["English"]
          }],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://smartymove.com/#website",
          name: "SmartyMove",
          alternateName: "SmartyMove — AI Movement Intelligence Platform",
          url: "https://smartymove.com",
          inLanguage: "en",
          publisher: { "@id": "https://smartymove.com/#organization" },
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://smartymove.com/learn?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "@id": "https://smartymove.com/#software",
          name: "SmartyMove",
          applicationCategory: ["HealthApplication", "LifestyleApplication", "MedicalApplication"],
          applicationSubCategory: "AI Movement Intelligence Platform",
          operatingSystem: "Web, iOS, Android",
          description:
            "AI Movement Intelligence Platform. Camera-based functional movement screen, Smarty Movement Score™, Movement Age™, and personalized corrective exercise program.",
          url: "https://smartymove.com",
          featureList: [
            "AI camera-based movement screen",
            "8 functional movement pattern tests",
            "Smarty Movement Score™ (0–100)",
            "Smarty Movement Age™",
            "Smarty Mobility Index™ and Stability Index™",
            "Root-cause corrective exercise engine",
            "14-day rescan and phased progression",
            "On-device pose detection (private by design)"
          ],
          keywords: "AI movement screening, movement analysis, functional movement screen, corrective exercise, movement score, movement age, mobility assessment, biomechanics",
          offers: {
            "@type": "Offer",
            price: "4.99",
            priceCurrency: "EUR",
            category: "subscription",
          },
          publisher: { "@type": "Organization", name: "SmartyMove" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <PaywallProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <SisterAppsPopup />
        <BottomTabs />
      </PaywallProvider>
    </QueryClientProvider>
  );
}
