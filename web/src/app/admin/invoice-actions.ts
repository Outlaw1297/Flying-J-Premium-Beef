"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import {
  invoiceNeedsWeight,
  lineTotalCents,
  recalculateInvoiceTotals,
} from "@/lib/invoices";
import { sendInvoiceIssuedEmail } from "@/lib/email";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export type InvoiceFormState = { error?: string; success?: string };

const lineSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1).max(200),
  quantity: z.coerce.number().min(0),
  unitLabel: z.string().min(1).max(40),
  unitPriceCents: z.coerce.number().int().min(0),
  awaitingWeight: z.boolean().optional(),
  productId: z.string().nullable().optional(),
});

async function expireStripeCheckoutSession(
  sessionId: string | null | undefined,
): Promise<void> {
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) return;
  try {
    await getStripe().checkout.sessions.expire(sessionId);
  } catch {
    // Already expired, completed, or invalid — safe to ignore
  }
}

async function persistInvoiceDraft(
  formData: FormData,
): Promise<{ error: string } | { invoiceId: string; orderId: string }> {
  const invoiceId = String(formData.get("invoiceId") || "");
  if (!invoiceId) return { error: "Missing invoice" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true },
  });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status !== "DRAFT" && invoice.status !== "ISSUED") {
    return { error: "Only draft or issued invoices can be edited" };
  }

  const notes = String(formData.get("notes") || "").trim() || null;
  const taxDollars = Number(formData.get("taxDollars") || 0);
  const discountDollars = Number(formData.get("discountDollars") || 0);
  if (!Number.isFinite(taxDollars) || taxDollars < 0) {
    return { error: "Invalid tax amount" };
  }
  if (!Number.isFinite(discountDollars) || discountDollars < 0) {
    return { error: "Invalid discount amount" };
  }

  const rawLines = formData.get("linesJson");
  let parsedLines: z.infer<typeof lineSchema>[];
  try {
    parsedLines = z.array(lineSchema).parse(JSON.parse(String(rawLines || "[]")));
  } catch {
    return { error: "Invalid line items" };
  }
  if (parsedLines.length === 0) return { error: "Add at least one line" };

  const normalized = parsedLines.map((line, index) => {
    const isHanging = line.unitLabel.toLowerCase().includes("hanging");
    const quantity = line.quantity;
    // Keep awaitingWeight until staff edits the qty field (editor clears the flag)
    const awaitingWeight = isHanging
      ? !(quantity > 0) || line.awaitingWeight === true
      : false;
    return {
      description: line.description.trim(),
      quantity,
      unitLabel: line.unitLabel.trim() || "each",
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: lineTotalCents(quantity, line.unitPriceCents),
      awaitingWeight,
      productId: line.productId || null,
      sortOrder: index,
    };
  });

  const totals = recalculateInvoiceTotals({
    lines: normalized,
    discountCents: Math.round(discountDollars * 100),
    taxCents: Math.round(taxDollars * 100),
  });

  await expireStripeCheckoutSession(invoice.stripeCheckoutSessionId);

  await prisma.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoiceId } });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        notes,
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        stripeCheckoutSessionId: null,
        lines: { create: normalized },
      },
    });
    await tx.order.update({
      where: { id: invoice.orderId },
      data: {
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
      },
    });
  });

  return { invoiceId, orderId: invoice.orderId };
}

export async function updateInvoiceDraftAction(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  await requireAdmin();
  const result = await persistInvoiceDraft(formData);
  if ("error" in result) return { error: result.error };

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${result.invoiceId}`);
  revalidatePath(`/admin/orders/${result.orderId}`);
  return { success: "Invoice saved" };
}

export async function issueInvoiceAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const invoiceId = String(formData.get("invoiceId") || "");
  if (!invoiceId) return;

  // Persist editor fields when Issue is submitted from the invoice form
  if (formData.has("linesJson")) {
    const saved = await persistInvoiceDraft(formData);
    if ("error" in saved) {
      redirect(
        `/admin/invoices/${invoiceId}?error=${encodeURIComponent(saved.error)}`,
      );
    }
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      order: { include: { user: true } },
    },
  });
  if (!invoice || invoice.status === "PAID" || invoice.status === "VOID") return;

  if (invoiceNeedsWeight(invoice.lines)) {
    redirect(
      `/admin/invoices/${invoiceId}?error=${encodeURIComponent(
        "Enter hanging weight on all weight-based lines before issuing",
      )}`,
    );
  }
  if (invoice.totalCents <= 0) {
    redirect(
      `/admin/invoices/${invoiceId}?error=${encodeURIComponent(
        "Invoice total must be greater than zero",
      )}`,
    );
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "ISSUED",
      issuedAt: invoice.issuedAt ?? new Date(),
    },
  });

  try {
    await sendInvoiceIssuedEmail({
      to: invoice.order.user.email,
      customerName: invoice.order.user.name,
      invoiceNumber: invoice.invoiceNumber,
      totalCents: invoice.totalCents,
      orderId: invoice.orderId,
      invoiceId: invoice.id,
    });
  } catch (error) {
    console.error("Issue invoice email failed:", error);
  }

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath(`/account/orders/${invoice.orderId}`);
  redirect(`/admin/invoices/${invoiceId}`);
}

export async function markInvoicePaidAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const invoiceId = String(formData.get("invoiceId") || "");
  const method = String(formData.get("method") || "CASH");
  if (!invoiceId) return;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.status === "PAID" || invoice.status === "VOID") return;

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        issuedAt: invoice.issuedAt ?? new Date(),
      },
    });
    await tx.order.update({
      where: { id: invoice.orderId },
      data: {
        status: "PAID",
        paymentMethod: method === "CHECK" ? "CHECK" : "CASH",
      },
    });
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath(`/admin/orders/${invoice.orderId}`);
  redirect(`/admin/invoices/${invoiceId}`);
}

/** Customer or admin: start Stripe Checkout for an issued invoice. */
export async function payInvoiceAction(
  invoiceId: string,
): Promise<{ error?: string; url?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in required" };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      order: { include: { user: true } },
    },
  });
  if (!invoice) return { error: "Invoice not found" };

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = invoice.order.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return { error: "Invoice not found" };
  }

  if (invoice.status !== "ISSUED") {
    return { error: "This invoice is not open for payment" };
  }
  if (invoice.totalCents <= 0) return { error: "Nothing due on this invoice" };
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Card payments are not configured" };
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  await expireStripeCheckoutSession(invoice.stripeCheckoutSessionId);

  const customer = await stripe.customers.create({
    email: invoice.order.user.email,
    name: invoice.order.user.name || undefined,
    phone: invoice.order.user.phone || undefined,
    metadata: { userId: invoice.order.userId, invoiceId: invoice.id },
  });

  const line_items = invoice.lines
    .filter((l) => l.lineTotalCents > 0)
    .map((l) => ({
      quantity: 1,
      price_data: {
        currency: "usd" as const,
        unit_amount: l.lineTotalCents,
        product_data: {
          name: l.description,
          description:
            l.unitLabel === "each"
              ? undefined
              : `${l.quantity} ${l.unitLabel} × $${(l.unitPriceCents / 100).toFixed(2)}`,
        },
      },
    }));

  if (invoice.taxCents > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "usd" as const,
        unit_amount: invoice.taxCents,
        product_data: {
          name: "Sales tax",
          description: undefined,
        },
      },
    });
  }

  if (line_items.length === 0) {
    return { error: "Nothing due on this invoice" };
  }

  let discounts: { coupon: string }[] | undefined;
  if (invoice.discountCents > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: invoice.discountCents,
      currency: "usd",
      duration: "once",
      max_redemptions: 1,
      name: `Invoice ${invoice.invoiceNumber}`,
    });
    discounts = [{ coupon: coupon.id }];
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    line_items,
    ...(discounts ? { discounts } : {}),
    metadata: {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      userId: invoice.order.userId,
    },
    success_url: `${appUrl}/checkout/success?invoice_id=${invoice.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/account/invoices/${invoice.id}`,
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });

  if (!checkoutSession.url) return { error: "Unable to start payment" };
  return { url: checkoutSession.url };
}

export async function adminPayInvoiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const invoiceId = String(formData.get("invoiceId") || "");
  const result = await payInvoiceAction(invoiceId);
  if (result.error || !result.url) {
    redirect(`/admin/invoices/${invoiceId}?error=${encodeURIComponent(result.error || "Payment failed")}`);
  }
  redirect(result.url);
}
