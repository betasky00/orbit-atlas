import { execSync } from "node:child_process";

// Auto-create the database tables during the Vercel build, but ONLY once a real
// DATABASE_URL is configured. Before that (or if the DB is unreachable) we skip
// gracefully so the build still succeeds and the AI tools keep working.
const url = process.env.DATABASE_URL || "";
const looksReal = url.startsWith("postgres") && !url.includes("...");

if (looksReal) {
  console.log("DATABASE_URL found — syncing schema with `prisma db push`…");
  try {
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      stdio: "inherit",
    });
    console.log("Database schema is in sync.");
  } catch (err) {
    console.warn(
      "prisma db push failed — continuing build anyway. The app will run, " +
        "but database features won't work until this succeeds. Reason:",
      err?.message
    );
  }
} else {
  console.log(
    "No DATABASE_URL set — skipping database setup. Add DATABASE_URL + DIRECT_URL " +
      "in Vercel and redeploy to enable saving accounts/posts."
  );
}
