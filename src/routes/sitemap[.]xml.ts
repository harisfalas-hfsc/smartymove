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
          { path: "/about", changefreq: "weekly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/premium", changefreq: "weekly", priority: "0.8" },
          { path: "/privacy", changefreq: "yearly", priority: "0.4" },
          { path: "/terms", changefreq: "yearly", priority: "0.4" },
          { path: "/disclaimer", changefreq: "yearly", priority: "0.4" },
          { path: "/learn", changefreq: "weekly", priority: "0.7" },
          { path: "/learn/what-is-a-movement-score", changefreq: "monthly", priority: "0.6" },
          { path: "/learn/functional-movement-screening-explained", changefreq: "monthly", priority: "0.6" },
          { path: "/learn/ankle-mobility-and-your-squat", changefreq: "monthly", priority: "0.6" },
        ];

        const today = new Date().toISOString().split("T")[0];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            `    <lastmod>${today}</lastmod>`,
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
