import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCartItemCount } from "@/lib/cart";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const cartCount = await getCartItemCount();

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>
      <SiteFooter />
      <MobileNav cartCount={cartCount} />
    </>
  );
}
