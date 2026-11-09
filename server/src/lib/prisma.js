import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { env } from "../config/env.js";

// Prisma 7 talks to PostgreSQL through the node-postgres (pg) driver adapter.
// The adapter owns a pg connection pool; prisma.$disconnect() closes it.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
