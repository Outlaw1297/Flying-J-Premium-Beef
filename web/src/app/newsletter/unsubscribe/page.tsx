import type { Metadata } from "next";
import Link from "next/link";
import { UnsubscribeForm } from "@/components/newsletter/unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe",
};

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { email } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">
        Unsubscribe
      </h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Leave our newsletter anytime. You can still shop and order as usual.
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <UnsubscribeForm defaultEmail={email ?? ""} />
      </div>
      <p className="mt-6 text-center text-sm text-charcoal/60">
        Changed your mind?{" "}
        <Link href="/" className="font-medium text-copper hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
