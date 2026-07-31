"use client";

import Script from "next/script";

/**
 * Optional Crisp live chat. Set NEXT_PUBLIC_CRISP_WEBSITE_ID to enable.
 * When unset, tickets remain the primary support channel.
 */
export function CrispChat({ websiteId }: { websiteId: string }) {
  if (!websiteId) return null;

  const bootstrap = `
    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = ${JSON.stringify(websiteId)};
    (function () {
      var d = document;
      var s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = 1;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  `;

  return (
    <Script id="crisp-chat" strategy="afterInteractive">
      {bootstrap}
    </Script>
  );
}
