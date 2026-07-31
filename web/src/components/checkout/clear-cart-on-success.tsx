"use client";

import { useEffect } from "react";
import { clearCartAfterCheckout } from "@/app/checkout/actions";

export function ClearCartOnSuccess() {
  useEffect(() => {
    void clearCartAfterCheckout();
  }, []);

  return null;
}
