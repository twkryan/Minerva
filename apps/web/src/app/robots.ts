import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/vestibulares/", "/materias/"],
      disallow: ["/dashboard", "/onboarding", "/questions", "/simulados"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
