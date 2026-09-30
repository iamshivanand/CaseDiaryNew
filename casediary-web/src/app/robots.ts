import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/bare-acts", "/calculators", "/pricing", "/auth/login", "/auth/register"],
        disallow: ["/api/", "/settings", "/cases/", "/drafts", "/team", "/finance", "/sync", "/cause-list", "/calendar"],
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended"],
        allow: ["/", "/bare-acts", "/calculators", "/pricing"],
        disallow: ["/cases", "/drafts", "/api/"],
      },
    ],
    sitemap: "https://advocase.in/sitemap.xml",
  };
}
