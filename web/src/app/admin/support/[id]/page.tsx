import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { updateTicketStatusAction } from "@/app/account/support/actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Ticket ${id.slice(-6)}` };
}

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  PENDING: "Pending",
  RESOLVED: "Resolved",
};

export default async function AdminTicketDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
      order: { include: { invoice: true, items: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/admin/support"
        className="text-sm font-medium text-copper hover:underline"
      >
        ← Inbox
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            {ticket.subject}
          </h1>
          <p className="mt-2 text-sm text-charcoal/60">
            {ticket.user.name ?? "Customer"} · {ticket.user.email}
            {ticket.user.phone ? ` · ${ticket.user.phone}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-wide text-charcoal/70">
          {statusLabel[ticket.status] ?? ticket.status}
        </span>
      </div>

      {ticket.order && (
        <div className="mt-6 rounded-2xl border border-charcoal/10 bg-white p-4 text-sm shadow-sm">
          <p className="font-medium text-charcoal">
            Linked order{" "}
            {ticket.order.invoice?.invoiceNumber ?? ticket.order.id.slice(-8)}
          </p>
          <p className="mt-1 text-charcoal/60">
            Status {ticket.order.status} ·{" "}
            {(ticket.order.totalCents / 100).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </p>
          <ul className="mt-2 text-charcoal/70">
            {ticket.order.items.map((item) => (
              <li key={item.id}>
                {item.quantity}× {item.productNameSnapshot}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={updateTicketStatusAction} className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="ticketId" value={ticket.id} />
        {(["OPEN", "PENDING", "RESOLVED"] as const).map((s) => (
          <button
            key={s}
            type="submit"
            name="status"
            value={s}
            className="rounded-full border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal hover:border-copper hover:text-copper"
          >
            Mark {statusLabel[s]}
          </button>
        ))}
      </form>

      <ol className="mt-8 space-y-4">
        {ticket.messages.map((msg) => (
          <li
            key={msg.id}
            className={`rounded-2xl border p-4 shadow-sm ${
              msg.isInternal
                ? "border-dashed border-charcoal/20 bg-cream/60"
                : msg.authorType === "STAFF"
                  ? "border-copper/20 bg-copper/5"
                  : "border-charcoal/10 bg-white"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
              {msg.isInternal
                ? "Internal note"
                : msg.authorType === "STAFF"
                  ? "Staff"
                  : "Customer"}{" "}
              · {msg.createdAt.toLocaleString()}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal/80">
              {msg.body}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
        <TicketReplyForm ticketId={ticket.id} isAdmin currentStatus={ticket.status} />
      </div>
    </div>
  );
}
