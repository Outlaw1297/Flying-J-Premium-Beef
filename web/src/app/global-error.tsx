"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-neutral-600">
          We&apos;ve been notified. You can try again, or go back home.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-neutral-400">Ref: {error.digest}</p>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold"
          >
            Home
          </a>
        </div>
      </body>
    </html>
  );
}
