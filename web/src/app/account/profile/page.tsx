import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      phone: true,
      email: true,
      preferredFulfillment: true,
      newsletterSubscribed: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/account" className="text-sm font-medium text-copper hover:underline">
        ← Account
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        Profile
      </h1>
      <p className="mt-2 text-charcoal/70">
        Keep your contact info and delivery address up to date for faster checkout.
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
