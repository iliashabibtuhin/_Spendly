import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 CLI configuration. The schema has no datasource url; the CLI
// (migrate, studio, db seed) reads it from here and the app reads it in
// src/lib/prisma.js. Both use DATABASE_URL, a PostgreSQL connection string.
//
// process.env is used instead of env("DATABASE_URL") so `prisma generate`
// (run by `npm install` via postinstall) works before a database is configured.
// Commands that need a database still fail with a clear error when it is unset.
//
// On Neon, run migrations over the direct (non-pooled) connection string.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.js",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
