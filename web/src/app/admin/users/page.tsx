import type { Metadata } from "next";
import {
  sendPasswordResetForUserAction,
  setUserRoleAction,
} from "@/app/admin/user-actions";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    take: 200,
  });

  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Users</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Create staff admins or customer accounts, and send password resets.
      </p>

      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-charcoal">
          Create user
        </h2>
        <div className="mt-4">
          <CreateUserForm />
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-charcoal/10 bg-cream/60 text-xs uppercase tracking-wider text-charcoal/50">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === session.user.id;
              const canDemote = user.role === "ADMIN" && adminCount > 1;
              return (
                <tr key={user.id} className="border-b border-charcoal/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-charcoal">
                      {user.name || "—"}
                      {isSelf ? (
                        <span className="ml-2 text-xs font-normal text-copper">you</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-charcoal/55">{user.email}</p>
                    {!user.passwordHash ? (
                      <p className="text-xs text-amber-700">Guest (no password)</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.role === "ADMIN"
                          ? "bg-copper/15 text-copper"
                          : "bg-charcoal/5 text-charcoal/70"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{user._count.orders}</td>
                  <td className="px-4 py-3 text-charcoal/60">
                    {user.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.role === "CUSTOMER" ? (
                        <form action={setUserRoleAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="role" value="ADMIN" />
                          <button
                            type="submit"
                            className="text-xs font-medium text-copper hover:underline"
                          >
                            Make admin
                          </button>
                        </form>
                      ) : canDemote && !isSelf ? (
                        <form action={setUserRoleAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="role" value="CUSTOMER" />
                          <button
                            type="submit"
                            className="text-xs font-medium text-charcoal/60 hover:underline"
                          >
                            Remove admin
                          </button>
                        </form>
                      ) : null}

                      {user.passwordHash ? (
                        <form action={sendPasswordResetForUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-charcoal/60 hover:underline"
                          >
                            Email reset link
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
