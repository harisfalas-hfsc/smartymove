import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://smartymove.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/movement-intelligence", changefreq: "weekly", priority: "0.95" },
          { path: "/movement-assessment", changefreq: "weekly", priority: "0.95" },
          { path: "/functional-movement-screening", changefreq: "weekly", priority: "0.95" },
          { path: "/corrective-exercise", changefreq: "weekly", priority: "0.9" },
          { path: "/mobility-and-stability", changefreq: "weekly", priority: "0.9" },
          { path: "/posture-and-movement-quality", changefreq: "weekly", priority: "0.85" },
          { path: "/injury-prevention", changefreq: "weekly", priority: "0.85" },
          { path: "/movement-patterns", changefreq: "weekly", priority: "0.85" },
          { path: "/why-movement-matters", changefreq: "monthly", priority: "0.75" },
          { path: "/about", changefreq: "weekly", priority: "0.7" },
          { path: "/how-it-works", changefreq: "weekly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/pricing", changefreq: "weekly", priority: "0.8" },
          { path: "/faq", changefreq: "weekly", priority: "0.8" },
          { path: "/glossary", changefreq: "monthly", priority: "0.75" },
          { path: "/research", changefreq: "monthly", priority: "0.7" },
          { path: "/privacy", changefreq: "yearly", priority: "0.4" },
          { path: "/terms", changefreq: "yearly", priority: "0.4" },
          { path: "/disclaimer", changefreq: "yearly", priority: "0.4" },
          { path: "/learn", changefreq: "weekly", priority: "0.7" },
          { path: "/learn/what-is-a-movement-score", changefreq: "monthly", priority: "0.6" },
          { path: "/learn/functional-movement-screening-explained", changefreq: "monthly", priority: "0.6" },
          { path: "/learn/ankle-mobility-and-your-squat", changefreq: "monthly", priority: "0.6" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
