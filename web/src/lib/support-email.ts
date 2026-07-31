import { getAppUrl } from "@/lib/stripe";

async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  logLabel: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "Flying J Premium Beef <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(`[email skipped] ${input.logLabel} → ${input.to}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    console.error(`Email failed (${input.logLabel}):`, await res.text());
  }
}

export function getSupportNotifyEmail(): string | null {
  return (
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    null
  );
}

export async function sendSupportTicketCreatedEmail(input: {
  ticketId: string;
  subject: string;
  customerEmail: string;
  customerName: string | null;
  body: string;
  orderLabel?: string | null;
}): Promise<void> {
  const staffTo = getSupportNotifyEmail();
  const appUrl = getAppUrl();
  const adminUrl = `${appUrl}/admin/support/${input.ticketId}`;
  const customerUrl = `${appUrl}/account/support/${input.ticketId}`;

  if (staffTo) {
    await sendEmail({
      to: staffTo,
      subject: `New support ticket: ${input.subject}`,
      logLabel: `support-new-${input.ticketId}`,
      html: `
        <div style="font-family: Georgia, serif; color: #1c1917;">
          <h1 style="font-size: 20px;">New support ticket</h1>
          <p><strong>From:</strong> ${input.customerName ?? "Customer"} (${input.customerEmail})</p>
          <p><strong>Subject:</strong> ${input.subject}</p>
          ${input.orderLabel ? `<p><strong>Order:</strong> ${input.orderLabel}</p>` : ""}
          <p style="white-space: pre-wrap;">${input.body}</p>
          <p><a href="${adminUrl}">Open in admin inbox</a></p>
        </div>
      `,
    });
  }

  await sendEmail({
    to: input.customerEmail,
    subject: `We received your message: ${input.subject}`,
    logLabel: `support-ack-${input.ticketId}`,
    html: `
      <div style="font-family: Georgia, serif; color: #1c1917;">
        <h1 style="font-size: 20px;">We've got your message</h1>
        <p>Hi ${input.customerName ?? "there"},</p>
        <p>Thanks for contacting Flying J Premium Beef. We'll follow up as soon as we can.</p>
        <p><strong>Subject:</strong> ${input.subject}</p>
        <p><a href="${customerUrl}">View your support thread</a></p>
      </div>
    `,
  });
}

export async function sendSupportReplyEmail(input: {
  ticketId: string;
  subject: string;
  customerEmail: string;
  customerName: string | null;
  replyBody: string;
  toCustomer: boolean;
}): Promise<void> {
  const appUrl = getAppUrl();

  if (input.toCustomer) {
    await sendEmail({
      to: input.customerEmail,
      subject: `Re: ${input.subject}`,
      logLabel: `support-reply-customer-${input.ticketId}`,
      html: `
        <div style="font-family: Georgia, serif; color: #1c1917;">
          <h1 style="font-size: 20px;">Reply from Flying J Premium Beef</h1>
          <p>Hi ${input.customerName ?? "there"},</p>
          <p style="white-space: pre-wrap;">${input.replyBody}</p>
          <p><a href="${appUrl}/account/support/${input.ticketId}">View conversation</a></p>
        </div>
      `,
    });
    return;
  }

  const staffTo = getSupportNotifyEmail();
  if (!staffTo) return;

  await sendEmail({
    to: staffTo,
    subject: `Customer reply: ${input.subject}`,
    logLabel: `support-reply-staff-${input.ticketId}`,
    html: `
      <div style="font-family: Georgia, serif; color: #1c1917;">
        <h1 style="font-size: 20px;">Customer replied</h1>
        <p><strong>From:</strong> ${input.customerName ?? "Customer"} (${input.customerEmail})</p>
        <p><strong>Subject:</strong> ${input.subject}</p>
        <p style="white-space: pre-wrap;">${input.replyBody}</p>
        <p><a href="${appUrl}/admin/support/${input.ticketId}">Open ticket</a></p>
      </div>
    `,
  });
}
