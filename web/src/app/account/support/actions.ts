"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendSupportReplyEmail,
  sendSupportTicketCreatedEmail,
} from "@/lib/support-email";
import {
  AuthorType,
  SupportPriority,
  SupportTicketStatus,
} from "@/generated/prisma/enums";

export type SupportFormState = {
  error?: string;
  success?: string;
};

const ticketSchema = z.object({
  subject: z.string().min(3, "Subject is required").max(120),
  body: z.string().min(10, "Please include a few more details").max(4000),
  orderId: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
});

export async function createSupportTicketAction(
  _prev: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const parsed = ticketSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    orderId: formData.get("orderId") || undefined,
    priority: formData.get("priority") || "NORMAL",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  let orderId: string | null = null;
  let orderLabel: string | null = null;
  if (parsed.data.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, userId: session.user.id },
      include: { invoice: true },
    });
    if (!order) {
      return { error: "That order was not found on your account" };
    }
    orderId = order.id;
    orderLabel = order.invoice?.invoiceNumber ?? order.id.slice(-8);
  }

  const priority =
    parsed.data.priority === "HIGH"
      ? SupportPriority.HIGH
      : parsed.data.priority === "LOW"
        ? SupportPriority.LOW
        : SupportPriority.NORMAL;

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      orderId,
      subject: parsed.data.subject.trim(),
      priority,
      status: SupportTicketStatus.OPEN,
      messages: {
        create: {
          authorType: AuthorType.CUSTOMER,
          authorId: session.user.id,
          body: parsed.data.body.trim(),
          isInternal: false,
        },
      },
    },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  try {
    await sendSupportTicketCreatedEmail({
      ticketId: ticket.id,
      subject: ticket.subject,
      customerEmail: ticket.user.email,
      customerName: ticket.user.name,
      body: parsed.data.body.trim(),
      orderLabel,
    });
  } catch (error) {
    console.error("Support create email failed:", error);
  }

  revalidatePath("/account/support");
  revalidatePath("/admin/support");
  redirect(`/account/support/${ticket.id}`);
}

export async function replySupportTicketAction(
  _prev: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const ticketId = String(formData.get("ticketId") || "");
  const body = String(formData.get("body") || "").trim();
  const isInternal = formData.get("isInternal") === "on";
  const newStatus = String(formData.get("status") || "");

  if (!ticketId) return { error: "Missing ticket" };
  if (body.length < 2) return { error: "Message is required" };
  if (body.length > 4000) return { error: "Message is too long" };

  const isAdmin = session.user.role === "ADMIN";

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!ticket) return { error: "Ticket not found" };
  if (!isAdmin && ticket.userId !== session.user.id) {
    return { error: "Ticket not found" };
  }
  if (!isAdmin && isInternal) {
    return { error: "Unauthorized" };
  }

  const statusUpdate =
    isAdmin && newStatus
      ? newStatus === "RESOLVED"
        ? SupportTicketStatus.RESOLVED
        : newStatus === "PENDING"
          ? SupportTicketStatus.PENDING
          : newStatus === "OPEN"
            ? SupportTicketStatus.OPEN
            : undefined
      : !isAdmin
        ? // Customer reply reopens for staff attention
          SupportTicketStatus.OPEN
        : undefined;

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        ticketId,
        authorType: isAdmin ? AuthorType.STAFF : AuthorType.CUSTOMER,
        authorId: session.user.id,
        body,
        isInternal: isAdmin ? isInternal : false,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(statusUpdate ? { status: statusUpdate } : {}),
        updatedAt: new Date(),
      },
    }),
  ]);

  if (!isInternal) {
    try {
      await sendSupportReplyEmail({
        ticketId,
        subject: ticket.subject,
        customerEmail: ticket.user.email,
        customerName: ticket.user.name,
        replyBody: body,
        toCustomer: isAdmin,
      });
    } catch (error) {
      console.error("Support reply email failed:", error);
    }
  }

  revalidatePath(`/account/support/${ticketId}`);
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/account/support");
  revalidatePath("/admin/support");

  return { success: "Reply sent" };
}

export async function updateTicketStatusAction(
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  const ticketId = String(formData.get("ticketId") || "");
  const status = String(formData.get("status") || "");
  if (!ticketId || !status) return;

  const mapped =
    status === "RESOLVED"
      ? SupportTicketStatus.RESOLVED
      : status === "PENDING"
        ? SupportTicketStatus.PENDING
        : status === "OPEN"
          ? SupportTicketStatus.OPEN
          : null;
  if (!mapped) return;

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: mapped },
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
}
