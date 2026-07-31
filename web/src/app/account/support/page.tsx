import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Support",
};

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  PENDING: "Pending",
  RESOLVED: "Resolved",
};

export default async function AccountSupportPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/support");
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      order: { include: { invoice: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/account" className="text-sm font-medium text-copper hover:underline">
        ← Account
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            Support
          </h1>
          <p className="mt-2 text-charcoal/70">
            Ask about orders, pickup, or products. Check the{" "}
            <Link href="/help" className="font-medium text-copper hover:underline">
              help center
            </Link>{" "}
            first for quick answers.
          </p>
        </div>
        <Link
          href="/account/support/new"
          className="inline-flex rounded-full bg-copper px-5 py-2.5 text-sm font-semibold text-cream hover:bg-copper/90"
        >
          New ticket
        </Link>
      </div>

      <ul className="mt-8 space-y-3">
        {tickets.length === 0 ? (
          <li className="rounded-2xl border border-charcoal/10 bg-white p-8 text-center text-charcoal/60 shadow-sm">
            No tickets yet.{" "}
            <Link
              href="/account/support/new"
              className="font-medium text-copper hover:underline"
            >
              Start a conversation
            </Link>
            .
          </li>
        ) : (
          tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/account/support/${ticket.id}`}
                className="block rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm transition-colors hover:border-copper/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-medium text-charcoal">{ticket.subject}</h2>
                  <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                    {statusLabel[ticket.status] ?? ticket.status}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-charcoal/60">
                  {ticket.messages[0]?.body}
                </p>
                <p className="mt-2 text-xs text-charcoal/45">
                  Updated {ticket.updatedAt.toLocaleString()}
                  {ticket.order?.invoice?.invoiceNumber
                    ? ` · ${ticket.order.invoice.invoiceNumber}`
                    : ""}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
