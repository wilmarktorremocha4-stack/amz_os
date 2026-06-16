import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Supabase's pooled connection (port 6543) runs PgBouncer in transaction
// mode, which is incompatible with node-postgres's named prepared
// statements. Disabling the statement cache avoids "prepared statement
// already exists" / silent insert failures against that pooler.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
