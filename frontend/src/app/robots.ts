import type { MetadataRoute } from "next";
import { siteConfig } from "@/shared/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/*/dashboard", "/*/cart", "/*/checkout", "/*/order/", "/*/nosa", "/*/login", "/*/account", "/*/search"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
