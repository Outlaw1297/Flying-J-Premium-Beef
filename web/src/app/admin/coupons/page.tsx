import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatCouponValue } from "@/lib/coupons";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { CreateCouponForm } from "@/components/admin/create-coupon-form";
import { toggleCouponAction } from "@/app/admin/coupons/actions";

export const metadata: Metadata = {
  title: "Coupons",
};

export default async function AdminCouponsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { redemptions: true } },
    },
  });

  const recentRedemptions = await prisma.couponRedemption.findMany({
    take: 15,
    orderBy: { redeemedAt: "desc" },
    include: {
      coupon: { select: { code: true } },
      user: { select: { email: true } },
      order: { select: { id: true, totalCents: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/admin" className="text-sm font-medium text-copper hover:underline">
        ← Admin
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        Coupons
      </h1>
      <p className="mt-2 text-charcoal/70">
        Create promotion codes for checkout. Codes sync to Stripe when configured.
      </p>

      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-charcoal">
          Create coupon
        </h2>
        <div className="mt-4">
          <CreateCouponForm />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-charcoal">
          Active campaigns
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 bg-cream/40 text-xs uppercase tracking-wider text-charcoal/50">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Uses</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">
                    No coupons yet — create WELCOME10 to get started.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="border-b border-charcoal/5">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-charcoal">{c.code}</p>
                      {c.campaignName && (
                        <p className="text-xs text-charcoal/50">{c.campaignName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-charcoal/80">
                      {formatCouponValue(c.type, c.value)}
                      {c.minOrderCents > 0 && (
                        <span className="block text-xs text-charcoal/50">
                          Min {formatCents(c.minOrderCents)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-charcoal/80">
                      {c.usesCount}
                      {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                      <span className="block text-xs text-charcoal/50">
                        {c._count.redemptions} redemptions
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          c.active
                            ? "text-xs font-medium text-copper"
                            : "text-xs font-medium text-charcoal/40"
                        }
                      >
                        {c.active ? "Active" : "Off"}
                      </span>
                      {c.expiresAt && (
                        <span className="block text-xs text-charcoal/50">
                          Exp {c.expiresAt.toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleCouponAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={c.active ? "true" : "false"}
                        />
                        <button
                          type="submit"
                          className="text-xs font-medium text-charcoal/60 hover:text-copper underline"
                        >
                          {c.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-charcoal">
          Recent redemptions
        </h2>
        <ul className="mt-4 space-y-2 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
          {recentRedemptions.length === 0 ? (
            <li className="py-4 text-center text-sm text-charcoal/50">
              No redemptions yet.
            </li>
          ) : (
            recentRedemptions.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-charcoal/5 py-2 text-sm last:border-0"
              >
                <span>
                  <span className="font-medium text-copper">{r.coupon.code}</span>
                  <span className="text-charcoal/60"> · {r.user.email}</span>
                </span>
                <span className="text-charcoal/70">
                  −{formatCents(r.discountCents)} ·{" "}
                  {r.redeemedAt.toLocaleDateString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
