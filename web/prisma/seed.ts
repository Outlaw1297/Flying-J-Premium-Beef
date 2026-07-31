import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: "Ribeye Steak",
    slug: "ribeye-steak",
    description: "Rich, marbled ribeye — perfect for grilling.",
    priceCents: 2499,
    weightLabel: "~1 lb",
    inventoryCount: 25,
    category: "steaks",
  },
  {
    name: "NY Strip Steak",
    slug: "ny-strip-steak",
    description: "Classic strip steak with bold beef flavor.",
    priceCents: 2199,
    weightLabel: "~1 lb",
    inventoryCount: 30,
    category: "steaks",
  },
  {
    name: "Ground Beef",
    slug: "ground-beef",
    description: "Premium ground beef for burgers, tacos, and more.",
    priceCents: 899,
    weightLabel: "1 lb",
    inventoryCount: 50,
    category: "ground",
  },
  {
    name: "Beef Brisket",
    slug: "beef-brisket",
    description: "Slow-smoke ready brisket for the pit master.",
    priceCents: 4599,
    weightLabel: "~3 lb",
    inventoryCount: 12,
    category: "roasts",
  },
  {
    name: "T-Bone Steak",
    slug: "t-bone-steak",
    description: "Two classics in one cut — strip and tenderloin.",
    priceCents: 2699,
    weightLabel: "~1.25 lb",
    inventoryCount: 18,
    category: "steaks",
  },
  {
    name: "Beef Patties",
    slug: "beef-patties",
    description: "Pre-formed patties for easy weeknight grilling.",
    priceCents: 1299,
    weightLabel: "4 pack",
    inventoryCount: 40,
    category: "ground",
  },
  {
    name: "Quarter Cow Bundle",
    slug: "quarter-cow-bundle",
    description: "A quarter cow of mixed cuts — freezer ready.",
    priceCents: 89900,
    weightLabel: "~100 lb",
    inventoryCount: 3,
    category: "bundles",
  },
  {
    name: "Half Cow Bundle",
    slug: "half-cow-bundle",
    description: "Half cow bundle with steaks, roasts, and ground.",
    priceCents: 169900,
    weightLabel: "~200 lb",
    inventoryCount: 2,
    category: "bundles",
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@flyingjbeef.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminPassword) {
    const passwordHash = await hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash, role: UserRole.ADMIN },
      create: {
        email: adminEmail,
        name: "Flying J Admin",
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
    console.log(`Admin user ready: ${adminEmail}`);
  } else if (process.env.NODE_ENV !== "production") {
    const devPassword = "changeme123";
    const passwordHash = await hash(devPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: "Flying J Admin",
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
    console.log(`Dev admin: ${adminEmail} / ${devPassword}`);
  } else {
    console.log("SEED_ADMIN_PASSWORD not set — skipping admin user in production");
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
