import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  // Vercel reaches the Railway DB over the public proxy (~300ms+ per round trip), so
  // multi-query transactions like a MIXTO sale blow past Prisma's 5s default and 500.
  transactionOptions: { maxWait: 10_000, timeout: 25_000 },
});
