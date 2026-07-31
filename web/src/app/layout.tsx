import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SiteShell } from "@/components/layout/site-shell";
import { CrispChat } from "@/components/support/crisp-chat";
import { getAppUrl } from "@/lib/stripe";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const appUrl = getAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Flying J Premium Beef",
    template: "%s | Flying J Premium Beef",
  },
  description:
    "Locally raised, butchered, and processed premium beef near Scranton, ND. Federally inspected. Order online for pickup or delivery.",
  keywords: [
    "premium beef",
    "North Dakota beef",
    "Scranton ND",
    "locally raised beef",
    "federally inspected",
    "Flying J Premium Beef",
  ],
  authors: [{ name: "Flying J Premium Beef" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "Flying J Premium Beef",
    title: "Flying J Premium Beef",
    description:
      "Locally raised, butchered, and processed premium beef. Federally inspected. Order online for pickup or delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flying J Premium Beef",
    description:
      "Locally raised, federally inspected premium beef from Scranton, North Dakota.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const crispId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() ?? "";

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased text-charcoal bg-cream">
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
          {crispId ? <CrispChat websiteId={crispId} /> : null}
        </AuthProvider>
      </body>
    </html>
  );
}
