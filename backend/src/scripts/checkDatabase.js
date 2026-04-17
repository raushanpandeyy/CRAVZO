import { prisma } from "../config/database.js";

async function main() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connection successful");
}

main()
  .catch((error) => {
    console.error("Database connection failed");
    console.error(error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
