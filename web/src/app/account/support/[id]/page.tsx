import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Support ${id.slice(-6)}` };
}

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  PENDING: "Pending",
  RESOLVED: "Resolved",
};

export default async function CustomerTicketDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/support");
  }

  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: session.user.id },
    include: {
      order: { include: { invoice: true } },
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/account/support"
        className="text-sm font-medium text-copper hover:underline"
      >
        ← Support
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            {ticket.subject}
          </h1>
          <p className="mt-2 text-sm text-charcoal/60">
            Opened {ticket.createdAt.toLocaleString()}
            {ticket.order && (
              <>
                {" · "}
                <Link
                  href={`/account/orders/${ticket.order.id}`}
                  className="text-copper hover:underline"
                >
                  {ticket.order.invoice?.invoiceNumber ?? "View order"}
                </Link>
              </>
            )}
          </p>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-wide text-charcoal/70">
          {statusLabel[ticket.status] ?? ticket.status}
        </span>
      </div>

      <ol className="mt-8 space-y-4">
        {ticket.messages.map((msg) => (
          <li
            key={msg.id}
            className={`rounded-2xl border p-4 shadow-sm ${
              msg.authorType === "STAFF"
                ? "border-copper/20 bg-copper/5"
                : "border-charcoal/10 bg-white"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
              {msg.authorType === "STAFF" ? "Flying J staff" : "You"} ·{" "}
              {msg.createdAt.toLocaleString()}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal/80">
              {msg.body}
            </p>
          </li>
        ))}
      </ol>

      {ticket.status !== "RESOLVED" ? (
        <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
          <TicketReplyForm ticketId={ticket.id} />
        </div>
      ) : (
        <p className="mt-8 text-sm text-charcoal/60">
          This ticket is resolved.{" "}
          <Link
            href="/account/support/new"
            className="font-medium text-copper hover:underline"
          >
            Open a new ticket
          </Link>{" "}
          if you still need help.
        </p>
      )}
    </div>
  );
}
