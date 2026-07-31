import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/stripe";

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl().replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/account/", "/api/", "/checkout/success"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
