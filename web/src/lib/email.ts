import { getAppUrl } from "@/lib/stripe";

type OrderEmailInput = {
  to: string;
  customerName: string | null;
  orderId: string;
  invoiceNumber: string;
  totalCents: number;
  fulfillmentType: string;
  items: { name: string; quantity: number; priceCents: number }[];
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

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
