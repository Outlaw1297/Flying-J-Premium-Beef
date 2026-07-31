import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
  claim: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const claim = parsed.data.claim?.trim() || "";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    if (existing) {
      if (!claim || !existing.claimToken || claim !== existing.claimToken) {
        return NextResponse.json(
          {
            error:
              "Guest accounts can only be claimed with the link from the order confirmation page.",
          },
          { status: 403 },
        );
      }
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: parsed.data.name,
            passwordHash,
            claimToken: null,
          },
          select: { id: true, email: true, name: true },
        })
      : await prisma.user.create({
          data: {
            email,
            name: parsed.data.name,
            passwordHash,
          },
          select: { id: true, email: true, name: true },
        });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create account" },
      { status: 500 },
    );
  }
}
