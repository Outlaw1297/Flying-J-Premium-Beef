import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewsletterStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Newsletter",
};

export default async function AdminNewslettersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
    take: 200,
  });

  const activeCount = subscribers.filter(
    (s) => s.status === NewsletterStatus.ACTIVE,
  ).length;

  const csv = [
    "email,status,source,subscribed_at,unsubscribed_at",
    ...subscribers.map(
      (s) =>
        `${s.email},${s.status},${s.source},${s.subscribedAt.toISOString()},${
          s.unsubscribedAt?.toISOString() ?? ""
        }`,
    ),
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/admin" className="text-sm font-medium text-copper hover:underline">
        ← Admin
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        Newsletter
      </h1>
      <p className="mt-2 text-charcoal/70">
        {activeCount} active subscriber{activeCount === 1 ? "" : "s"} (showing latest{" "}
        {subscribers.length}).
      </p>

      <div className="mt-6">
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download="flying-j-newsletter.csv"
          className="inline-flex rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-medium text-charcoal hover:border-copper hover:text-copper"
        >
          Download CSV
        </a>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-charcoal/10 bg-cream/40 text-xs uppercase tracking-wider text-charcoal/50">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-charcoal/50">
                  No subscribers yet.
                </td>
              </tr>
            ) : (
              subscribers.map((s) => (
                <tr key={s.id} className="border-b border-charcoal/5">
                  <td className="px-4 py-3 text-charcoal">{s.email}</td>
                  <td className="px-4 py-3 text-charcoal/70">{s.status}</td>
                  <td className="px-4 py-3 text-charcoal/70">{s.source}</td>
                  <td className="px-4 py-3 text-charcoal/70">
                    {s.subscribedAt.toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
