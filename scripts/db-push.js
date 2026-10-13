const { execSync } = require("child_process");

// Support all standard Vercel Postgres environment variable names
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
  console.log("Database connection string detected.");
} else {
  console.warn(
    "Warning: No DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL found in environment."
  );
}

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
  try {
    console.log("Running prisma db push to sync PostgreSQL tables...");
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("Prisma db push completed successfully.");

    // Optionally run seed if needed
    try {
      console.log("Seeding initial users and sample document...");
      execSync("npx tsx prisma/seed.ts", {
        stdio: "inherit",
        env: { ...process.env },
      });
      console.log("Seeding completed successfully.");
    } catch (seedErr) {
      console.warn("Seed step notice (can be ignored if already seeded):", seedErr.message);
    }
  } catch (err) {
    console.error("Prisma db push encountered an error:", err.message);
  }
} else {
  console.log("Skipping db push during build (local sqlite or missing db url).");
}

