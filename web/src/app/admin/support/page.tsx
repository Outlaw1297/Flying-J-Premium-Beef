import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTicketStatusAction } from "@/app/account/support/actions";
import { SupportTicketStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Support inbox",
};

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  PENDING: "Pending",
  RESOLVED: "Resolved",
};

export default async function AdminSupportInboxPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const { status: statusFilter } = await searchParams;
  const where =
    statusFilter === "OPEN" ||
    statusFilter === "PENDING" ||
    statusFilter === "RESOLVED"
      ? { status: statusFilter as SupportTicketStatus }
      : statusFilter === "active"
        ? {
            status: {
              in: [SupportTicketStatus.OPEN, SupportTicketStatus.PENDING],
            },
          }
        : {};

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
      order: { include: { invoice: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  const openCount = await prisma.supportTicket.count({
    where: {
      status: { in: [SupportTicketStatus.OPEN, SupportTicketStatus.PENDING] },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/admin" className="text-sm font-medium text-copper hover:underline">
        ← Admin
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        Support inbox
      </h1>
      <p className="mt-2 text-charcoal/70">
        {openCount} open or pending ticket{openCount === 1 ? "" : "s"}.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {[
          { href: "/admin/support", label: "All" },
          { href: "/admin/support?status=active", label: "Active" },
          { href: "/admin/support?status=OPEN", label: "Open" },
          { href: "/admin/support?status=PENDING", label: "Pending" },
          { href: "/admin/support?status=RESOLVED", label: "Resolved" },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-full border border-charcoal/15 px-3 py-1.5 font-medium text-charcoal/80 hover:border-copper hover:text-copper"
          >
            {f.label}
          </Link>
        ))}
      </div>

      <ul className="mt-8 space-y-3">
        {tickets.length === 0 ? (
          <li className="rounded-2xl border border-charcoal/10 bg-white p-8 text-center text-charcoal/50">
            No tickets in this view.
          </li>
        ) : (
          tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="font-medium text-charcoal hover:text-copper"
                  >
                    {ticket.subject}
                  </Link>
                  <p className="mt-1 text-sm text-charcoal/60">
                    {ticket.user.name ?? ticket.user.email} · {ticket.user.email}
                    {ticket.order?.invoice?.invoiceNumber
                      ? ` · ${ticket.order.invoice.invoiceNumber}`
                      : ""}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">
                    {ticket.messages[0]?.body}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                    {statusLabel[ticket.status] ?? ticket.status}
                  </span>
                  <form action={updateTicketStatusAction} className="flex gap-1">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    {ticket.status !== "RESOLVED" && (
                      <button
                        type="submit"
                        name="status"
                        value="RESOLVED"
                        className="text-xs font-medium text-copper hover:underline"
                      >
                        Resolve
                      </button>
                    )}
                    {ticket.status === "RESOLVED" && (
                      <button
                        type="submit"
                        name="status"
                        value="OPEN"
                        className="text-xs font-medium text-charcoal/60 hover:underline"
                      >
                        Reopen
                      </button>
                    )}
                  </form>
                </div>
              </div>
              <p className="mt-2 text-xs text-charcoal/45">
                {ticket._count.messages} message
                {ticket._count.messages === 1 ? "" : "s"} · Updated{" "}
                {ticket.updatedAt.toLocaleString()}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
