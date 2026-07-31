import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewTicketForm } from "@/components/support/new-ticket-form";

export const metadata: Metadata = {
  title: "New support ticket",
};

type PageProps = {
  searchParams: Promise<{ orderId?: string; subject?: string }>;
};

export default async function NewSupportTicketPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/support/new");
  }

  const { orderId, subject } = await searchParams;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { invoice: true },
  });

  const orderOptions = orders.map((o) => ({
    id: o.id,
    label: `${o.invoice?.invoiceNumber ?? o.id.slice(-8)} · ${o.createdAt.toLocaleDateString()} · ${o.status}`,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/account/support"
        className="text-sm font-medium text-copper hover:underline"
      >
        ← Support
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        Contact support
      </h1>
      <p className="mt-2 text-charcoal/70">
        Tell us what you need. We&apos;ll email you when we reply.
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <NewTicketForm
          orders={orderOptions}
          defaultOrderId={orderId}
          defaultSubject={subject}
        />
      </div>
    </div>
  );
}
