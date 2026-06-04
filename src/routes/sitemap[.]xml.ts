import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://nota1000enem.online";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/redacao", changefreq: "weekly", priority: "0.9" },
  { path: "/questoes", changefreq: "weekly", priority: "0.9" },
  { path: "/aulas", changefreq: "weekly", priority: "0.9" },
  { path: "/pdfs", changefreq: "weekly", priority: "0.8" },
  { path: "/prova-real", changefreq: "weekly", priority: "0.8" },
  { path: "/plano-estudo", changefreq: "weekly", priority: "0.8" },
  { path: "/ranking", changefreq: "daily", priority: "0.7" },
  { path: "/planos", changefreq: "weekly", priority: "0.9" },
  { path: "/auth", changefreq: "monthly", priority: "0.4" },
];


export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = entries
          .map((e) =>
            [
              "  <url>",
              `    <loc>${BASE_URL}${e.path}</loc>`,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              "  </url>",
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

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
