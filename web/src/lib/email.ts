import { getAppUrl } from "@/lib/stripe";

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

type OrderEmailInput = {
  to: string;
  customerName: string | null;
  orderId: string;
  invoiceNumber: string;
  totalCents: number;
  fulfillmentType: string;
  items: { name: string; quantity: number; priceCents: number }[];
};

export async function sendOrderConfirmationEmail(
  input: OrderEmailInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "Flying J Premium Beef <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      `[email skipped] Order ${input.invoiceNumber} confirmation for ${input.to}`,
    );
    return;
  }

  const itemLines = input.items
    .map(
      (i) =>
        `<li>${i.quantity}× ${i.name} — ${formatCents(i.priceCents * i.quantity)}</li>`,
    )
    .join("");

  const fulfillment =
    input.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup";
  const accountUrl = `${getAppUrl()}/account/orders`;

  const html = `
    <div style="font-family: Georgia, serif; color: #1c1917;">
      <h1 style="font-size: 22px;">Thank you for your order</h1>
      <p>Hi ${input.customerName ?? "there"},</p>
      <p>We've received your Flying J Premium Beef order <strong>${input.invoiceNumber}</strong>.</p>
      <p><strong>Fulfillment:</strong> ${fulfillment}<br/>
      <strong>Total:</strong> ${formatCents(input.totalCents)}</p>
      <ul>${itemLines}</ul>
      <p><a href="${accountUrl}">View your orders</a></p>
      <p style="color:#78716c;font-size:12px;">Federally inspected · Locally raised</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Order confirmed — ${input.invoiceNumber}`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to send order confirmation email:", text);
  }
}

/** Order received — hanging weight / deferred invoice (not yet payable). */
export async function sendOrderReceivedEmail(input: {
  to: string;
  customerName: string | null;
  invoiceNumber: string;
  orderId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "Flying J Premium Beef <onboarding@resend.dev>";
  const orderUrl = `${getAppUrl()}/account/orders/${input.orderId}`;

  if (!apiKey) {
    console.info(
      `[email skipped] Order received ${input.invoiceNumber} for ${input.to}`,
    );
    return;
  }

  const html = `
    <div style="font-family: Georgia, serif; color: #1c1917;">
      <h1 style="font-size: 22px;">We received your order</h1>
      <p>Hi ${input.customerName ?? "there"},</p>
      <p>Thanks for ordering with Flying J Premium Beef. Invoice <strong>${input.invoiceNumber}</strong> is on hold until we confirm hanging weight.</p>
      <p>We&apos;ll email you a final invoice you can pay online once the weight is set.</p>
      <p><a href="${orderUrl}">View your order</a></p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Order received — ${input.invoiceNumber} (awaiting weigh-in)`,
      html,
    }),
  });
}

/** Invoice issued — customer can pay. */
export async function sendInvoiceIssuedEmail(input: {
  to: string;
  customerName: string | null;
  invoiceNumber: string;
  totalCents: number;
  orderId: string;
  invoiceId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "Flying J Premium Beef <onboarding@resend.dev>";
  const payUrl = `${getAppUrl()}/account/invoices/${input.invoiceId}`;

  if (!apiKey) {
    console.info(
      `[email skipped] Invoice issued ${input.invoiceNumber} for ${input.to}`,
    );
    return;
  }

  const html = `
    <div style="font-family: Georgia, serif; color: #1c1917;">
      <h1 style="font-size: 22px;">Your invoice is ready</h1>
      <p>Hi ${input.customerName ?? "there"},</p>
      <p>Invoice <strong>${input.invoiceNumber}</strong> is ready to pay.</p>
      <p><strong>Amount due:</strong> ${formatCents(input.totalCents)}</p>
      <p><a href="${payUrl}" style="display:inline-block;background:#b45309;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;">View &amp; pay invoice</a></p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Invoice ${input.invoiceNumber} — ${formatCents(input.totalCents)} due`,
      html,
    }),
  });
}
