import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SiteShell } from "@/components/layout/site-shell";
import { CrispChat } from "@/components/support/crisp-chat";
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

export const metadata: Metadata = {
  title: {
    default: "Flying J Premium Beef",
    template: "%s | Flying J Premium Beef",
  },
  description:
    "Locally raised, butchered, and processed premium beef. Federally inspected. Order online for pickup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const crispId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() ?? "";

  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased text-charcoal bg-cream">
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
          {crispId ? <CrispChat websiteId={crispId} /> : null}
        </AuthProvider>
      </body>
    </html>
  );
}
