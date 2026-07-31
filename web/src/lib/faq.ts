export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqCategory = {
  id: string;
  title: string;
  description: string;
  items: FaqItem[];
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "orders-pickup",
    title: "Orders & pickup",
    description: "How ordering, pickup, and delivery work.",
    items: [
      {
        id: "how-to-order",
        question: "How do I place an order?",
        answer:
          "Browse the shop, add cuts to your cart, and checkout. You can pay by card online, or choose cash or check due at pickup or delivery. Guest checkout is available — create an account afterward to track orders and get coupons.",
      },
      {
        id: "pickup-location",
        question: "Where do I pick up my order?",
        answer:
          "Local pickup is at our Flying J location in Scranton, ND (10457 Lanesboro Rd). After you order, we confirm when your beef is ready. Bring your order confirmation and payment if you chose cash or check.",
      },
      {
        id: "delivery",
        question: "Do you deliver?",
        answer:
          "Yes — local delivery is available in our service area. Enter your address at checkout and add delivery instructions (gate codes, cooler placement, pets). We’ll confirm timing after the order is placed.",
      },
      {
        id: "ready-time",
        question: "How long until my order is ready?",
        answer:
          "Timing depends on the cuts and whether we need to portion or pack your order. You’ll get updates by email, and signed-in customers can check status under Account → Orders.",
      },
    ],
  },
  {
    id: "products-cuts",
    title: "Products & cuts",
    description: "What’s available and how it’s processed.",
    items: [
      {
        id: "inspected",
        question: "Is your beef federally inspected?",
        answer:
          "Yes. Flying J Premium Beef is locally raised, butchered and processed, and federally inspected so you can trust quality and food safety standards.",
      },
      {
        id: "weights",
        question: "Are package weights exact?",
        answer:
          "Weights on product pages are typical package sizes (for example “~1 lb”). Actual packaged weight may vary slightly. Pricing is based on the listed package price unless otherwise noted.",
      },
      {
        id: "out-of-stock",
        question: "What if something is out of stock?",
        answer:
          "Inventory updates as orders come in. If an item sells out during checkout, you’ll see an error and can adjust your cart. Message us through Support if you want a substitute cut.",
      },
      {
        id: "bundles",
        question: "Do you offer half or quarter shares?",
        answer:
          "Bundle and share options appear in the shop when available. If you don’t see what you need, open a support ticket and we’ll help with current availability.",
      },
    ],
  },
  {
    id: "payment-refunds",
    title: "Payment & refunds",
    description: "Cards, cash, checks, and order changes.",
    items: [
      {
        id: "payment-methods",
        question: "What payment methods do you accept?",
        answer:
          "Card payments run securely through Stripe. You can also choose cash or check and pay when you pick up or receive delivery.",
      },
      {
        id: "coupons",
        question: "How do I use a coupon code?",
        answer:
          "Enter your code on the cart or checkout page, or open a link like /cart?code=WELCOME10. The discount applies before tax. One coupon per order.",
      },
      {
        id: "refunds",
        question: "Can I change or cancel an order?",
        answer:
          "Contact us as soon as possible through Support (link your order if you can). We’ll help with changes before packing when possible. Refunds for card payments are handled case by case.",
      },
    ],
  },
  {
    id: "storage-safety",
    title: "Storage & safety",
    description: "Keeping your beef at its best.",
    items: [
      {
        id: "storage",
        question: "How should I store my beef?",
        answer:
          "Keep frozen beef frozen until you’re ready to thaw. Thaw in the refrigerator, not on the counter. Use thawed meat within a few days, and follow standard food-safety practices for handling raw meat.",
      },
      {
        id: "coolers",
        question: "Do I need a cooler for pickup or delivery?",
        answer:
          "A cooler or insulated bag is recommended, especially in warm weather or for longer trips home. For delivery, note where we should leave coolers in your delivery instructions.",
      },
      {
        id: "allergens",
        question: "Any allergen or processing notes?",
        answer:
          "Our beef is processed in a federally inspected facility. If you have specific dietary concerns, ask us before ordering and we’ll share what we know about processing practices.",
      },
    ],
  },
];
